#!/usr/bin/env node
/**
 * Rebuild data/sitemap-inventory.json from the checkpoint without recrawling.
 *
 * loc uses the best drug-like CHEBI synonym (preferred-drug-names + name
 * quality), never the API redirect / systematic label.
 */
const fs = require("fs");
const path = require("path");
const {
  loadChebiLookup,
  collectDrugLikeCandidates,
} = require("./lib/chebi-lookup");
const { inventoryFromCheckpoint } = require("./lib/sitemap-pages");

const ROOT = path.join(__dirname, "..");
const CHECKPOINT_PATH = path.join(
  ROOT,
  "data",
  "sitemap-inventory.checkpoint.json",
);
const OUT_PATH = path.join(ROOT, "data", "sitemap-inventory.json");

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    throw new Error(`Missing checkpoint: ${CHECKPOINT_PATH}`);
  }
  const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  if (Number(checkpoint.version) !== 2) {
    throw new Error("Checkpoint is not version 2");
  }

  const lookup = await loadChebiLookup();
  const { candidates } = collectDrugLikeCandidates(lookup);
  const nameByChebi = new Map(candidates.map((c) => [c.chebi, c.name]));

  const inventory = inventoryFromCheckpoint(checkpoint, {
    nameByChebi,
    minScore: Number(process.env.SITEMAP_MIN_SCORE || 0.25),
    backend: checkpoint.backend || null,
    workers: checkpoint.workers || null,
    source: "checkpoint + chebi drug-like names",
  });
  saveJson(OUT_PATH, inventory);

  const remapped = inventory.pages.filter(
    (p) => p.queryName && p.model === "_",
  ).length;
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  pages: ${inventory.pages.length}`);
  console.log(`  /_/ slugs remapped from queryName: ${remapped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
