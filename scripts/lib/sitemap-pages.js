/**
 * Shared sitemap inventory helpers: model list, keep threshold, pages from checkpoint.
 */
const MODELS = [
  "epoxidation",
  "quinone",
  "reactivity",
  "phase1",
  "ndealk",
  "ugt",
];

const DEFAULT_MIN_SCORE = 0.25;
const SITE_ORIGIN = "https://xenosite.org";

function minScoreFromEnv() {
  return Number(process.env.SITEMAP_MIN_SCORE || DEFAULT_MIN_SCORE);
}

function hitsFromScores(scores, minScore = minScoreFromEnv()) {
  return MODELS.filter(
    (model) => typeof scores?.[model] === "number" && scores[model] >= minScore,
  );
}

function isCompleteRecord(record) {
  if (!record || record.error) return false;
  const scores = record.scores || {};
  return MODELS.every((model) => typeof scores[model] === "number");
}

function staticSitemapPages() {
  return [
    { loc: "/", model: null, name: null, score: null },
    ...MODELS.map((model) => ({
      loc: `/${model}`,
      model,
      name: null,
      score: null,
    })),
  ];
}

function slugForRecord(record, nameByChebi) {
  const queryName = String(record.queryName || "").trim();
  const mapped =
    nameByChebi && record.chebi != null
      ? nameByChebi.get(Number(record.chebi))
      : null;
  return String(mapped || queryName).trim();
}

function pageNameKeys(page) {
  const keys = [];
  for (const field of ["name", "queryName", "resolvedName"]) {
    const v = page?.[field];
    if (v) keys.push(String(v).trim().toLowerCase());
  }
  const loc = String(page?.loc || "");
  if (loc.startsWith("/") && loc !== "/") {
    const parts = loc.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      try {
        keys.push(decodeURIComponent(last).trim().toLowerCase());
      } catch {
        keys.push(last.trim().toLowerCase());
      }
    }
  }
  return keys;
}

/**
 * Fast filter of an existing inventory page list:
 * drop /_ hubs; keep static hubs; keep molecule pages matching preferred names.
 */
function filterPagesToPreferred(pages, preferredNames) {
  const preferred = preferredNames instanceof Set
    ? preferredNames
    : new Set(
        [...(preferredNames || [])].map((n) => String(n).trim().toLowerCase()),
      );

  const preferredChebis = new Set();
  for (const page of pages) {
    if (page?.score == null) continue;
    if (page.model === "_" || page.loc === "/_" || page.loc?.startsWith("/_/")) {
      continue;
    }
    if (pageNameKeys(page).some((k) => preferred.has(k))) {
      const id = Number(page.chebi);
      if (Number.isFinite(id)) preferredChebis.add(id);
    }
  }

  const out = [];
  for (const page of pages) {
    if (page?.model === "_" || page.loc === "/_" || page.loc?.startsWith("/_/")) {
      continue;
    }
    if (page?.score == null) {
      // Keep non-_ static hubs only
      if (page.loc === "/" || MODELS.includes(page.model)) out.push(page);
      continue;
    }
    const chebi = Number(page.chebi);
    if (Number.isFinite(chebi) && preferredChebis.has(chebi)) {
      out.push(page);
      continue;
    }
    if (pageNameKeys(page).some((k) => preferred.has(k))) out.push(page);
  }
  out.sort((a, b) => String(a.loc).localeCompare(String(b.loc)));
  return out;
}

function pagesFromCheckpoint(
  checkpoint,
  minScore = minScoreFromEnv(),
  nameByChebi = null,
) {
  const pages = [...staticSitemapPages()];
  for (const record of Object.values(checkpoint?.results || {})) {
    if (!isCompleteRecord(record)) continue;
    const name = slugForRecord(record, nameByChebi);
    if (!name) continue;
    const scores = record.scores || {};
    const hits = hitsFromScores(scores, minScore);
    if (hits.length === 0) continue;

    const encoded = encodeURIComponent(name);
    const resolvedName =
      record.name && record.name !== name ? record.name : undefined;
    const queryName =
      record.queryName && record.queryName !== name
        ? record.queryName
        : undefined;
    for (const model of hits) {
      const score = Number(scores[model]);
      pages.push({
        loc: `/${model}/${encoded}`,
        chebi: record.chebi,
        model,
        name,
        score: Number(score.toFixed(6)),
        ...(queryName ? { queryName } : {}),
        ...(resolvedName ? { resolvedName } : {}),
      });
    }
  }
  pages.sort((a, b) => a.loc.localeCompare(b.loc));
  return pages;
}

function inventoryFromCheckpoint(checkpoint, extras = {}) {
  const minScore = extras.minScore ?? minScoreFromEnv();
  const pages = pagesFromCheckpoint(
    checkpoint,
    minScore,
    extras.nameByChebi || null,
  );
  return {
    generatedAt: new Date().toISOString(),
    source: extras.source || "chebi.msgpack.gz + xenosite-api",
    backend: extras.backend || null,
    minScore,
    workers: extras.workers ?? null,
    models: MODELS,
    nameFilter: extras.nameFilter || {
      maxLen: Number(process.env.SITEMAP_NAME_MAX_LEN || 40),
      excludeDigits: true,
      excludeParens: true,
    },
    stats: {
      checkpointCompounds: Object.keys(checkpoint?.results || {}).length,
      includedPages: pages.length,
    },
    pages,
  };
}

function absoluteUrl(loc) {
  if (!loc || loc === "/") return `${SITE_ORIGIN}/`;
  const path = loc.startsWith("/") ? loc : `/${loc}`;
  return `${SITE_ORIGIN}${path}`;
}

module.exports = {
  MODELS,
  DEFAULT_MIN_SCORE,
  SITE_ORIGIN,
  minScoreFromEnv,
  hitsFromScores,
  isCompleteRecord,
  staticSitemapPages,
  pagesFromCheckpoint,
  slugForRecord,
  filterPagesToPreferred,
  inventoryFromCheckpoint,
  absoluteUrl,
};
