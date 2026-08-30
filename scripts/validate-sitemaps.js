#!/usr/bin/env node
/**
 * Validate generated sitemap XML, gzip shards, index URLs, and robots.txt.
 *
 * Usage:
 *   make validate-sitemaps
 *   node scripts/validate-sitemaps.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");
const { SITE_ORIGIN, MODELS } = require("./lib/sitemap-pages");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "sitemap");
const ROBOTS_PATH = path.join(ROOT, "public", "robots.txt");
const INDEX_NAME = "sitemap_index.xml";
const INDEX_URL = `${SITE_ORIGIN}/sitemap/${INDEX_NAME}`;
const URL_LIMIT = 50000;
const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
const MAX_LOC_CHARS = 2048;
const LASTMOD_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function hasXmllint() {
  const r = spawnSync("xmllint", ["--version"], { encoding: "utf8" });
  return r.status === 0 || r.status === 1; // --version may exit 0
}

function xmllint(filePath, label) {
  const r = spawnSync("xmllint", ["--noout", filePath], {
    encoding: "utf8",
  });
  if (r.status !== 0) {
    fail(`${label}: xmllint failed: ${(r.stderr || r.stdout || "").trim()}`);
    return false;
  }
  return true;
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) =>
    decodeXml(m[1].trim()),
  );
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function unescapeCheck(xml) {
  // Raw '&' that is not an entity is invalid XML; xmllint already covers this.
  const bad = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/);
  if (bad) fail(`Unescaped '&' in XML near: ${bad[0]}`);
}

function validateLoc(loc, kind) {
  if (!loc.startsWith("http://") && !loc.startsWith("https://")) {
    fail(`${kind} loc is not absolute: ${loc}`);
    return;
  }
  let url;
  try {
    url = new URL(loc);
  } catch {
    fail(`${kind} loc is not a valid URL: ${loc}`);
    return;
  }
  if (url.protocol !== "https:") {
    fail(`${kind} loc must be https: ${loc}`);
  }
  if (`${url.protocol}//${url.host}` !== SITE_ORIGIN) {
    fail(`${kind} loc host mismatch (${url.host}): ${loc}`);
  }
  if (loc.length > MAX_LOC_CHARS) {
    fail(`${kind} loc exceeds ${MAX_LOC_CHARS} chars: ${loc.slice(0, 80)}...`);
  }
  if (/\s/.test(loc)) {
    fail(`${kind} loc contains whitespace: ${loc}`);
  }
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fail(`Missing ${OUT_DIR}. Run: make sitemaps`);
    return;
  }

  const robots = fs.readFileSync(ROBOTS_PATH, "utf8");
  if (!/^User-agent:\s*\*/m.test(robots)) {
    fail("robots.txt is missing 'User-agent: *'");
  }
  const sitemapLines = [...robots.matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(
    (m) => m[1],
  );
  if (!sitemapLines.length) {
    fail("robots.txt is missing a Sitemap: line");
  } else if (!sitemapLines.includes(INDEX_URL)) {
    fail(
      `robots.txt Sitemap should be ${INDEX_URL} (found ${sitemapLines.join(", ")})`,
    );
  }

  const indexPath = path.join(OUT_DIR, INDEX_NAME);
  if (!fs.existsSync(indexPath)) {
    fail(`Missing sitemap index: ${indexPath}`);
    return;
  }

  const lint = hasXmllint();
  if (!lint) warn("xmllint not found; skipping XML well-formedness checks");
  else xmllint(indexPath, INDEX_NAME);

  const indexXml = fs.readFileSync(indexPath, "utf8");
  unescapeCheck(indexXml);
  if (!indexXml.includes("<sitemapindex")) {
    fail("sitemap_index.xml is not a sitemapindex document");
  }
  const indexLocs = extractLocs(indexXml);
  if (!indexLocs.length) fail("sitemap_index.xml has no <loc> entries");

  const shardNames = [];
  for (const loc of indexLocs) {
    validateLoc(loc, "index");
    if (!loc.endsWith(".xml.gz")) {
      fail(`index loc should be a .xml.gz sitemap: ${loc}`);
    }
    const expectedPrefix = `${SITE_ORIGIN}/sitemap/`;
    if (!loc.startsWith(expectedPrefix)) {
      fail(`index loc should live under ${expectedPrefix}: ${loc}`);
      continue;
    }
    const name = loc.slice(expectedPrefix.length);
    if (name.includes("/") || name.includes("..")) {
      fail(`index loc has an unexpected path: ${loc}`);
      continue;
    }
    shardNames.push(name);
    if (!fs.existsSync(path.join(OUT_DIR, name))) {
      fail(`index points at missing file: ${name}`);
    }
  }

  const onDiskGz = fs
    .readdirSync(OUT_DIR)
    .filter((n) => n.endsWith(".xml.gz"))
    .sort();
  for (const name of onDiskGz) {
    if (!shardNames.includes(name)) {
      warn(`${name} exists on disk but is not listed in sitemap_index.xml`);
    }
  }

  const allPageLocs = [];
  const tmpDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "xenosite-sitemap-"));
  try {
    for (const name of shardNames) {
      const gzPath = path.join(OUT_DIR, name);
      if (!fs.existsSync(gzPath)) continue;
      let xml;
      try {
        xml = zlib.gunzipSync(fs.readFileSync(gzPath)).toString("utf8");
      } catch (err) {
        fail(`${name}: not valid gzip (${err.message})`);
        continue;
      }
      if (xml.length > MAX_UNCOMPRESSED_BYTES) {
        fail(
          `${name}: uncompressed size ${xml.length} exceeds 50MB sitemap limit`,
        );
      }
      unescapeCheck(xml);
      if (!xml.includes("<urlset")) {
        fail(`${name}: not a urlset document`);
      }
      const tmpXml = path.join(tmpDir, name.replace(/\.gz$/, ""));
      fs.writeFileSync(tmpXml, xml);
      if (lint) xmllint(tmpXml, name);

      const locs = extractLocs(xml);
      const lastmods = [...xml.matchAll(/<lastmod>\s*([^<]+)\s*<\/lastmod>/g)].map(
        (m) => m[1].trim(),
      );
      if (locs.length > URL_LIMIT) {
        fail(`${name}: ${locs.length} URLs exceeds ${URL_LIMIT} limit`);
      }
      if (lastmods.some((d) => !LASTMOD_RE.test(d))) {
        fail(`${name}: invalid <lastmod> value`);
      }
      if (lastmods.length && lastmods.length !== locs.length) {
        warn(
          `${name}: lastmod count (${lastmods.length}) != loc count (${locs.length})`,
        );
      }
      for (const loc of locs) validateLoc(loc, name);
      allPageLocs.push(...locs);
      console.log(
        `  ${name}: gzip ok, xml ${lint ? "well-formed" : "parsed"}, ${locs.length} urls, ${(xml.length / 1024).toFixed(1)} KiB uncompressed`,
      );
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  const seen = new Set();
  const dupes = [];
  for (const loc of allPageLocs) {
    if (seen.has(loc)) dupes.push(loc);
    seen.add(loc);
  }
  if (dupes.length) {
    fail(`${dupes.length} duplicate <loc> values (e.g. ${dupes[0]})`);
  }

  const required = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/_`,
    ...MODELS.map((m) => `${SITE_ORIGIN}/${m}`),
  ];
  for (const loc of required) {
    if (!seen.has(loc)) warn(`missing static page ${loc}`);
  }

  console.log(`robots.txt Sitemap: ${sitemapLines.join(", ") || "(none)"}`);
  console.log(`index: ${indexLocs.length} shards, ${allPageLocs.length} unique page URLs`);

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("\nSitemaps look valid.");
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
