#!/usr/bin/env node
/**
 * Dry-run: list drug-like CHEBI name candidates for the sitemap inventory.
 *
 * Usage:
 *   node scripts/sitemap-candidates.js
 *   make sitemap-candidates
 */
const fs = require("fs");
const path = require("path");
const {
  loadChebiLookup,
  collectDrugLikeCandidates,
} = require("./lib/chebi-lookup");

const MUST_KEEP = [
  "caffeine",
  "ibuprofen",
  "morphine",
  "aspirin",
  "acetaminophen",
  "paracetamol",
];

async function main() {
  const lookup = await loadChebiLookup();
  const { candidates, stats } = collectDrugLikeCandidates(lookup);

  const names = new Set(candidates.map((c) => c.name));
  const chebis = new Set(candidates.map((c) => c.chebi));
  const mustKeepHits = [];
  const mustKeepMisses = [];
  for (const n of MUST_KEEP) {
    const chebi = lookup[n];
    if (chebi != null && chebis.has(Number(chebi))) {
      const canonical = candidates.find((c) => c.chebi === Number(chebi));
      mustKeepHits.push(
        `${n} -> ${canonical ? canonical.name : "?"} (CHEBI:${chebi})`,
      );
    } else if (names.has(n)) {
      mustKeepHits.push(n);
    } else {
      mustKeepMisses.push(n);
    }
  }

  console.log("CHEBI name filter dry-run");
  console.log("------------------------");
  console.log(`Total lookup keys considered: ${stats.totalNames}`);
  console.log(`Drug-like names kept:         ${stats.keptNames}`);
  console.log(`Unique CHEBI ids:             ${stats.uniqueChebi}`);
  console.log("Drop reasons:");
  for (const [reason, count] of Object.entries(stats.reasons).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${reason.padEnd(24)} ${count}`);
  }
  console.log("");
  console.log(`Must-keep hits: ${mustKeepHits.join(", ") || "(none)"}`);
  if (mustKeepMisses.length) {
    console.log(`Must-keep MISSES: ${mustKeepMisses.join(", ")}`);
  }
  console.log("");
  console.log("Sample kept names:");
  for (const c of candidates.slice(0, 40)) {
    console.log(`  ${c.name} (CHEBI:${c.chebi})`);
  }
  console.log("...");
  console.log("Sample kept names (middle):");
  const mid = Math.floor(candidates.length / 2);
  for (const c of candidates.slice(mid, mid + 20)) {
    console.log(`  ${c.name} (CHEBI:${c.chebi})`);
  }

  const outPath = path.join(__dirname, "..", "data", "sitemap-candidates.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats,
        mustKeepHits,
        mustKeepMisses,
        candidates,
      },
      null,
      2,
    ),
  );
  console.log("");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
