#!/usr/bin/env node
/**
 * MANUAL discovery: score each drug-like CHEBI name against every model.
 *
 * One job per compound. Each job queries all models and stores which ones
 * hit (score >= SITEMAP_MIN_SCORE, default 0.25). Inventory pages are:
 *   /{model}/{name}  for each hitting model
 *   /_/{name}        if any model hit
 *
 * - 32 parallel workers (override with SITEMAP_WORKERS)
 * - tqdm-style in-place progress (stderr) + keep rate
 * - Idempotent / resumable: checkpoint merges; never clobbers completed work
 *
 * Usage:
 *   make sitemap-inventory
 *   SITEMAP_MIN_SCORE=0.25 SITEMAP_WORKERS=32 node scripts/sitemap-inventory.js
 */
const fs = require("fs");
const path = require("path");
const {
  loadChebiLookup,
  collectDrugLikeCandidates,
} = require("./lib/chebi-lookup");
const {
  MODELS,
  hitsFromScores: hitsFromScoresAt,
  isCompleteRecord,
  inventoryFromCheckpoint,
} = require("./lib/sitemap-pages");

const ROOT = path.join(__dirname, "..");
const OUT_PATH = path.join(ROOT, "data", "sitemap-inventory.json");
const CHECKPOINT_PATH = path.join(
  ROOT,
  "data",
  "sitemap-inventory.checkpoint.json",
);

const WORKERS = Math.max(
  1,
  Number(process.env.SITEMAP_WORKERS || 32),
);
const MIN_SCORE = Number(process.env.SITEMAP_MIN_SCORE || 0.25);
const BACKEND =
  process.env.XENOSITE_BACKEND || "https://swami.wustl.edu/xenosite-api";
const BACKEND_KEY = process.env.XENOSITE_BACKEND_KEY || null;
const TIMEOUT_MS = Number(process.env.SITEMAP_TIMEOUT_MS || 60000);
const SAVE_EVERY = Math.max(1, Number(process.env.SITEMAP_SAVE_EVERY || 50));

function jobKey(chebi) {
  return String(chebi);
}

function hitsFromScores(scores) {
  return hitsFromScoresAt(scores, MIN_SCORE);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "?";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function keepLabel(kept, scored, unit = "pages") {
  if (!scored) return "kept —";
  const pct = (100 * kept) / scored;
  return `kept ${pct.toFixed(1)}% (${kept}/${scored} ${unit})`;
}

/** tqdm-like single-line bar on stderr; falls back to occasional newlines if not a TTY. */
class ProgressBar {
  constructor(total, { label = "crawl", width = 28 } = {}) {
    this.total = total;
    this.n = 0;
    this.label = label;
    this.width = width;
    this.started = Date.now();
    this.extra = "";
    this.stream = process.stderr;
    this.useBar =
      Boolean(this.stream.isTTY) || process.env.SITEMAP_PROGRESS === "bar";
    this._lastDraw = 0;
  }

  update(n, extra = "") {
    this.n = n;
    this.extra = extra;
    const now = Date.now();
    const done = n >= this.total && this.total > 0;
    if (this.useBar) {
      if (done || now - this._lastDraw >= 80) this._draw();
      return;
    }
    if (done || now - this._lastDraw >= 5000) this._drawNl();
  }

  _bar() {
    const pct = this.total ? this.n / this.total : 1;
    const filled = Math.round(this.width * Math.min(1, Math.max(0, pct)));
    return `${"█".repeat(filled)}${"░".repeat(this.width - filled)}`;
  }

  _line() {
    const elapsed = (Date.now() - this.started) / 1000;
    const rate = this.n / Math.max(elapsed, 0.001);
    const remain = Math.max(0, this.total - this.n);
    const eta = remain / Math.max(rate, 0.001);
    const pct = this.total ? (100 * this.n) / this.total : 100;
    const extra = this.extra ? `  ${this.extra}` : "";
    return (
      `${this.label} |${this._bar()}| ${pct.toFixed(1)}% ` +
      `${this.n}/${this.total}  ${rate.toFixed(1)}/s  eta ${formatDuration(eta)}` +
      extra
    );
  }

  _draw() {
    this._lastDraw = Date.now();
    this.stream.write(`\r\x1b[K${this._line()}`);
  }

  _drawNl() {
    this._lastDraw = Date.now();
    this.stream.write(`${this._line()}\n`);
  }

  close() {
    if (this.useBar) {
      this._draw();
      this.stream.write("\n");
    } else {
      this._drawNl();
    }
  }
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Failed to parse ${filePath}: ${err.message}`);
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function flattenNumbers(value, out = []) {
  if (value == null) return out;
  if (typeof value === "number" && Number.isFinite(value)) {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) flattenNumbers(item, out);
  }
  return out;
}

/** Max prediction signal across mol / bond / atom-like fields. */
function interestScore(payload) {
  let best = 0;
  for (const result of payload?.results || []) {
    if (result?.mol != null && Number.isFinite(Number(result.mol))) {
      best = Math.max(best, Number(result.mol));
    }
    for (const key of ["bond", "atom", "atoms", "site", "sites"]) {
      const nums = flattenNumbers(result?.[key]);
      for (const n of nums) best = Math.max(best, n);
    }
  }
  return best;
}

async function fetchModel(model, query) {
  const url =
    `${BACKEND}/v0/${model}?` +
    new URLSearchParams({
      query,
      depict: "false",
      detailed: "true",
    });

  const headers = { "User-Agent": "xenosite-sitemap-inventory" };
  if (BACKEND_KEY) headers.Authorization = `Bearer ${BACKEND_KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function emptyCheckpoint(meta = {}) {
  return {
    version: 2,
    updatedAt: null,
    backend: BACKEND,
    minScore: MIN_SCORE,
    models: MODELS,
    ...meta,
    // chebi -> compound record with per-model scores (never deleted on rerun)
    results: {},
  };
}

function mergeCheckpoint(existing, incomingMeta = {}) {
  const base = emptyCheckpoint(incomingMeta);
  if (!existing || typeof existing !== "object") return base;
  // v1 used chebi::model keys; do not mix schemas
  if (Number(existing.version) !== 2) return base;
  return {
    ...base,
    ...existing,
    version: 2,
    results: {
      ...(existing.results || {}),
    },
    minScore: MIN_SCORE,
    models: MODELS,
    backend: BACKEND,
  };
}

function buildInventoryFromCheckpoint(checkpoint) {
  return inventoryFromCheckpoint(checkpoint, {
    minScore: MIN_SCORE,
    backend: BACKEND,
    workers: WORKERS,
  });
}

async function runPool(jobs, workerFn, concurrency, onProgress) {
  let index = 0;
  let active = 0;
  let completed = 0;
  const total = jobs.length;

  return new Promise((resolve, reject) => {
    let rejected = false;

    const launch = () => {
      if (rejected) return;
      while (active < concurrency && index < total) {
        const job = jobs[index++];
        active++;
        Promise.resolve()
          .then(() => workerFn(job))
          .then(() => {
            completed++;
            active--;
            if (onProgress) onProgress(completed, total);
            if (completed === total) resolve();
            else launch();
          })
          .catch((err) => {
            rejected = true;
            reject(err);
          });
      }
    };

    if (total === 0) resolve();
    else launch();
  });
}

async function main() {
  console.log(`Backend: ${BACKEND}`);
  console.log(`Workers: ${WORKERS}`);
  console.log(`Min score: ${MIN_SCORE}`);
  console.log(`Checkpoint: ${CHECKPOINT_PATH}`);

  const lookup = await loadChebiLookup();
  const { candidates, stats: nameStats } = collectDrugLikeCandidates(lookup);
  console.log(
    `Candidates: ${candidates.length} unique CHEBI ` +
      `(from ${nameStats.keptNames} drug-like names)`,
  );

  let checkpoint = mergeCheckpoint(loadJson(CHECKPOINT_PATH, null), {
    nameStats,
  });

  let scoredCompounds = 0;
  let compoundsWithHit = 0;
  let scoredPages = 0;
  let keptPages = 0;
  let errors = 0;
  for (const record of Object.values(checkpoint.results)) {
    if (isCompleteRecord(record)) {
      scoredCompounds++;
      const hits = hitsFromScores(record.scores);
      if (hits.length) compoundsWithHit++;
      scoredPages += MODELS.length;
      keptPages += hits.length;
    } else if (record?.error || Object.keys(record?.errors || {}).length) {
      errors++;
    }
  }
  const priorCount = Object.keys(checkpoint.results).length;
  console.log(`Loaded checkpoint compounds: ${priorCount}`);
  console.log(
    `  already scored: ${scoredCompounds} compounds, ${scoredPages} pages  ` +
      `${keepLabel(keptPages, scoredPages)}  errors: ${errors}`,
  );

  const jobs = [];
  for (const candidate of candidates) {
    const key = jobKey(candidate.chebi);
    const existing = checkpoint.results[key];
    if (isCompleteRecord(existing)) continue;
    jobs.push({ ...candidate, key });
  }

  console.log(`Jobs remaining: ${jobs.length} (one per compound, all ${MODELS.length} models)`);

  let sinceSave = 0;
  const persist = (force = false) => {
    sinceSave++;
    if (!force && sinceSave < SAVE_EVERY) return;
    sinceSave = 0;
    checkpoint.updatedAt = new Date().toISOString();
    saveJson(CHECKPOINT_PATH, checkpoint);
  };

  let stopping = false;
  const onSignal = (signal) => {
    if (stopping) return;
    stopping = true;
    persist(true);
    console.error(`\nCaught ${signal}; checkpoint saved. Re-run to resume.`);
    process.exit(130);
  };
  process.on("SIGINT", () => onSignal("SIGINT"));
  process.on("SIGTERM", () => onSignal("SIGTERM"));

  const bar = new ProgressBar(jobs.length, { label: "inventory" });
  const extra = () =>
    `${keepLabel(keptPages, scoredPages)}  err ${errors}  min=${MIN_SCORE}`;
  bar.update(0, extra());

  await runPool(
    jobs,
    async (job) => {
      const prev = checkpoint.results[job.key];
      const prevComplete = isCompleteRecord(prev);
      const prevHadError = Boolean(
        prev?.error || Object.keys(prev?.errors || {}).length,
      );
      const prevHits = prevComplete ? hitsFromScores(prev.scores).length : 0;

      const scores = { ...(prev?.scores || {}) };
      const modelErrors = { ...(prev?.errors || {}) };
      let name = prev?.name || job.name;

      try {
        for (const model of MODELS) {
          if (typeof scores[model] === "number") continue;
          try {
            const payload = await fetchModel(model, job.name);
            scores[model] = interestScore(payload);
            delete modelErrors[model];
            const apiName = payload?.name?.name
              ? String(payload.name.name).trim().toLowerCase()
              : null;
            if (apiName) name = apiName;
          } catch (err) {
            modelErrors[model] = String(err.message || err);
          }
        }

        const complete = MODELS.every((model) => typeof scores[model] === "number");
        const hits = hitsFromScores(scores);
        const errorCount = Object.keys(modelErrors).length;
        checkpoint.results[job.key] = {
          chebi: job.chebi,
          queryName: job.name,
          name: name || job.name,
          scores,
          hits,
          ...(errorCount ? { errors: modelErrors } : {}),
          scoredAt: new Date().toISOString(),
        };

        if (prevHadError && errorCount === 0) errors--;
        else if (!prevHadError && errorCount > 0) errors++;

        if (complete) {
          if (!prevComplete) {
            scoredCompounds++;
            scoredPages += MODELS.length;
            keptPages += hits.length;
            if (hits.length) compoundsWithHit++;
          } else if (hits.length !== prevHits) {
            keptPages += hits.length - prevHits;
            if (prevHits === 0 && hits.length) compoundsWithHit++;
            else if (prevHits > 0 && hits.length === 0) compoundsWithHit--;
          }
        }
      } catch (err) {
        if (!prevComplete) {
          if (!prevHadError) errors++;
          checkpoint.results[job.key] = {
            chebi: job.chebi,
            queryName: job.name,
            name: job.name,
            scores,
            hits: hitsFromScores(scores),
            error: String(err.message || err),
            scoredAt: new Date().toISOString(),
          };
        }
      }
      persist(false);
    },
    WORKERS,
    (completed) => bar.update(completed, extra()),
  );

  bar.close();
  persist(true);

  const inventory = buildInventoryFromCheckpoint(checkpoint);
  saveJson(OUT_PATH, inventory);

  const includedModelPages = inventory.pages.filter(
    (p) => p.score != null && p.model && p.model !== "_",
  ).length;
  const includedAllModelPages = inventory.pages.filter(
    (p) => p.model === "_" && p.score != null,
  ).length;
  const keepPct = scoredPages
    ? ((100 * keptPages) / scoredPages).toFixed(1)
    : "—";

  console.log("Done.");
  console.log(`  compounds scored: ${scoredCompounds}`);
  console.log(
    `  pages kept (model×molecule, score>=${MIN_SCORE}): ` +
      `${keptPages}/${scoredPages} (${keepPct}%)`,
  );
  console.log(
    `  compounds with ≥1 model hit: ${compoundsWithHit}/${scoredCompounds}`,
  );
  console.log(`  checkpoint errors: ${errors}`);
  console.log(`  inventory pages (incl. static): ${inventory.pages.length}`);
  console.log(`  model×molecule pages in sitemap: ${includedModelPages}`);
  console.log(`  all-models (/_/) pages: ${includedAllModelPages}`);
  console.log(`  wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
