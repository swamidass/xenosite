#!/usr/bin/env node
/**
 * Fast path: shrink data/sitemap-inventory.json to preferred drugs + drop /_.
 * No API or CHEBI download — filters the committed page list in place.
 *
 *   node scripts/filter-sitemap-inventory-preferred.js
 */
const fs = require("fs");
const path = require("path");
const { loadPreferredDrugNames } = require("./lib/chebi-lookup");
const { filterPagesToPreferred } = require("./lib/sitemap-pages");

const ROOT = path.join(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "data", "sitemap-inventory.json");

function main() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error(`Missing ${INVENTORY_PATH}`);
  }
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
  const before = inventory.pages?.length || 0;
  const preferred = loadPreferredDrugNames();
  const pages = filterPagesToPreferred(inventory.pages || [], preferred);
  inventory.pages = pages;
  inventory.generatedAt = new Date().toISOString();
  inventory.filter = {
    type: "preferred-drugs",
    preferredCount: preferred.size,
    droppedUnderscore: true,
  };
  inventory.stats = {
    ...(inventory.stats || {}),
    includedPages: pages.length,
    beforeFilterPages: before,
  };
  inventory.source = `${inventory.source || "inventory"} + preferred-drug filter`;

  fs.writeFileSync(INVENTORY_PATH, `${JSON.stringify(inventory, null, 2)}\n`);
  const molecule = pages.filter((p) => p.score != null).length;
  console.log(`Wrote ${INVENTORY_PATH}`);
  console.log(`  ${before} → ${pages.length} pages (${molecule} molecule URLs)`);
  console.log(`  preferred names loaded: ${preferred.size}`);
}

main();
