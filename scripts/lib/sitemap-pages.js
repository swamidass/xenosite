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
    { loc: "/_", model: "_", name: null, score: null },
  ];
}

function pagesFromCheckpoint(checkpoint, minScore = minScoreFromEnv()) {
  const pages = [...staticSitemapPages()];
  for (const record of Object.values(checkpoint?.results || {})) {
    if (!isCompleteRecord(record)) continue;
    const name = record.name || record.queryName;
    if (!name) continue;
    const scores = record.scores || {};
    const hits = hitsFromScores(scores, minScore);
    if (hits.length === 0) continue;

    const encoded = encodeURIComponent(name);
    let best = 0;
    for (const model of hits) {
      const score = Number(scores[model]);
      best = Math.max(best, score);
      pages.push({
        loc: `/${model}/${encoded}`,
        chebi: record.chebi,
        model,
        name,
        score: Number(score.toFixed(6)),
        queryName: record.queryName,
      });
    }
    pages.push({
      loc: `/_/${encoded}`,
      chebi: record.chebi,
      model: "_",
      name,
      score: Number(best.toFixed(6)),
      models: hits,
      queryName: record.queryName,
    });
  }
  pages.sort((a, b) => a.loc.localeCompare(b.loc));
  return pages;
}

function inventoryFromCheckpoint(checkpoint, extras = {}) {
  const minScore = extras.minScore ?? minScoreFromEnv();
  const pages = pagesFromCheckpoint(checkpoint, minScore);
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
  inventoryFromCheckpoint,
  absoluteUrl,
};
