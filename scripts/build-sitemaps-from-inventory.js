#!/usr/bin/env node
/**
 * Build gzipped sitemaps from a committed inventory, or from the discovery
 * checkpoint if inventory is not present yet.
 *
 * Output (gitignored):
 *   public/sitemap/sitemapN.xml.gz
 *   public/sitemap/sitemap_index.xml
 *
 * Usage:
 *   make sitemaps
 *   node scripts/build-sitemaps-from-inventory.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const {
  SITE_ORIGIN,
  minScoreFromEnv,
  inventoryFromCheckpoint,
  absoluteUrl,
} = require("./lib/sitemap-pages");

const ROOT = path.join(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "data", "sitemap-inventory.json");
const CHECKPOINT_PATH = path.join(
  ROOT,
  "data",
  "sitemap-inventory.checkpoint.json",
);
const OUT_DIR = path.join(ROOT, "public", "sitemap");
const URL_LIMIT = Math.max(
  1,
  Number(process.env.SITEMAP_URL_LIMIT || 50000),
);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loadInventory() {
  const forceCheckpoint =
    process.env.SITEMAP_SOURCE === "checkpoint" ||
    process.argv.includes("--checkpoint");
  const minScore = minScoreFromEnv();

  if (!forceCheckpoint && fs.existsSync(INVENTORY_PATH)) {
    const inventory = loadJson(INVENTORY_PATH);
    return { inventory, source: INVENTORY_PATH };
  }

  if (fs.existsSync(CHECKPOINT_PATH)) {
    const checkpoint = loadJson(CHECKPOINT_PATH);
    if (Number(checkpoint.version) !== 2) {
      throw new Error(
        `Checkpoint ${CHECKPOINT_PATH} is not version 2; re-run make sitemap-inventory`,
      );
    }
    return {
      inventory: inventoryFromCheckpoint(checkpoint, { minScore }),
      source: CHECKPOINT_PATH,
    };
  }

  return { inventory: null, source: null };
}

function lastmodDate(inventory) {
  const raw = inventory.generatedAt || inventory.updatedAt;
  if (!raw) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function urlsetXml(pages, lastmod) {
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const page of pages) {
    xml +=
      "  <url>\n" +
      `    <loc>${xmlEscape(absoluteUrl(page.loc))}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      "  </url>\n";
  }
  xml += "</urlset>\n";
  return xml;
}

function indexXml(files) {
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const fileName of files) {
    xml +=
      "  <sitemap>\n" +
      `    <loc>${xmlEscape(`${SITE_ORIGIN}/sitemap/${fileName}`)}</loc>\n` +
      "  </sitemap>\n";
  }
  xml += "</sitemapindex>\n";
  return xml;
}

function clearOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name === ".gitkeep") continue;
    fs.unlinkSync(path.join(OUT_DIR, name));
  }
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out.length ? out : [[]];
}

function main() {
  const { inventory, source } = loadInventory();
  if (!inventory) {
    console.warn(
      "No sitemap inventory or checkpoint found; skipping sitemap generation.",
    );
    console.warn(`  looked for ${INVENTORY_PATH}`);
    console.warn(`  looked for ${CHECKPOINT_PATH}`);
    return;
  }

  const pages = Array.isArray(inventory.pages) ? inventory.pages : [];
  const lastmod = lastmodDate(inventory);
  const shards = chunk(pages, URL_LIMIT);
  const modelPages = pages.filter((p) => p.score != null && p.model && p.model !== "_");
  const allModelPages = pages.filter((p) => p.model === "_" && p.score != null);

  console.log(`Source: ${source}`);
  console.log(`Min score: ${inventory.minScore ?? minScoreFromEnv()}`);
  console.log(
    `Pages: ${pages.length} ` +
      `(${modelPages.length} model×molecule, ${allModelPages.length} /_/, ` +
      `${pages.length - modelPages.length - allModelPages.length} static)`,
  );

  clearOutDir();

  const files = [];
  shards.forEach((shard, i) => {
    const fileName = `sitemap${i + 1}.xml.gz`;
    const xml = urlsetXml(shard, lastmod);
    fs.writeFileSync(path.join(OUT_DIR, fileName), zlib.gzipSync(Buffer.from(xml, "utf8")));
    files.push(fileName);
    console.log(`  wrote ${fileName} (${shard.length} urls)`);
  });

  const indexPath = path.join(OUT_DIR, "sitemap_index.xml");
  fs.writeFileSync(indexPath, indexXml(files));
  console.log(`  wrote sitemap_index.xml (${files.length} sitemaps)`);
  console.log(`Done. ${OUT_DIR}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
