#!/usr/bin/env node
/**
 * Live smoke checks against a running server.
 *
 * Canonical / og:url / robots Sitemap always name the public origin
 * (https://xenosite.org), even when you point this at localhost or a
 * Vercel preview. Requests go to --url; expected public URLs do not.
 *
 *   node scripts/check-site.js
 *   node scripts/check-site.js https://xenosite.org
 *   node scripts/check-site.js http://localhost:3000
 *   node scripts/check-site.js https://xenosite-git-....vercel.app
 *   make check-site URL=http://localhost:3000
 */
const zlib = require("zlib");
const { SITE_ORIGIN, MODELS } = require("./lib/sitemap-pages");

const PUBLIC = SITE_ORIGIN;
const DEFAULT_URL = process.env.CHECK_SITE_URL || process.env.BASE_URL || PUBLIC;

function parseBase(raw) {
  const value = String(raw || DEFAULT_URL).trim().replace(/\/+$/, "");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid base URL: ${raw}`);
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error(`Base URL must be http(s): ${raw}`);
  }
  return value;
}

function attr(html, name) {
  const re = new RegExp(
    `(?:name|property|rel)=["']${name}["'][^>]*content=["']([^"']+)["']|` +
      `content=["']([^"']+)["'][^>]*(?:name|property|rel)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] || m[2] : null;
}

function canonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const href = m[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

function title(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function h1s(html) {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  );
}

function faviconPng(html) {
  const tags = [...html.matchAll(/<link[^>]+rel=["']icon["'][^>]*>/gi)].map(
    (m) => m[0],
  );
  const png = tags.find((t) => /type=["']image\/png["']/i.test(t));
  const href = (png || "").match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

async function request(base, pathname, { expectStatus = 200 } = {}) {
  const url = pathname.startsWith("http") ? pathname : `${base}${pathname}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "xenosite-check-site" },
    redirect: "follow",
  });
  const buf = Buffer.from(await res.arrayBuffer());
  if (res.status !== expectStatus) {
    throw new Error(
      `${pathname}: expected HTTP ${expectStatus}, got ${res.status}`,
    );
  }
  return { res, buf, text: buf.toString("utf8"), url };
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) =>
    m[1].trim(),
  );
}

async function main() {
  const base = parseBase(process.argv[2]);
  const errors = [];
  const notes = [];
  let passed = 0;

  const check = async (name, fn) => {
    try {
      await fn();
      passed++;
      console.log(`  ok  ${name}`);
    } catch (err) {
      errors.push(`${name}: ${err.message || err}`);
      console.log(`  FAIL  ${name}: ${err.message || err}`);
    }
  };

  console.log(`Checking ${base}`);
  console.log(`Public origin (canonicals): ${PUBLIC}\n`);

  await check("homepage title, canonical, OG, h1, JSON-LD", async () => {
    const { text } = await request(base, "/");
    if (title(text) !== "XenoSite") throw new Error(`title=${title(text)}`);
    if (canonical(text) !== PUBLIC) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (attr(text, "og:url") !== PUBLIC) {
      throw new Error(`og:url=${attr(text, "og:url")}`);
    }
    if (attr(text, "og:image") !== `${PUBLIC}/xenosite.png`) {
      throw new Error(`og:image=${attr(text, "og:image")}`);
    }
    if (faviconPng(text) !== "/favicon.png") {
      throw new Error(`favicon=${faviconPng(text)}`);
    }
    if (h1s(text).length !== 1 || h1s(text)[0] !== "What is XenoSite?") {
      throw new Error(`h1s=${JSON.stringify(h1s(text))}`);
    }
    if (!text.includes("WebSite") || !text.includes("SearchAction")) {
      throw new Error("missing WebSite SearchAction JSON-LD");
    }
  });

  await check("model landing canonical + h1", async () => {
    const { text } = await request(base, "/epoxidation");
    if (canonical(text) !== `${PUBLIC}/epoxidation`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (h1s(text).length !== 1 || h1s(text)[0] !== "Epoxidation") {
      throw new Error(`h1s=${JSON.stringify(h1s(text))}`);
    }
  });

  await check("caffeine page canonical + OG image", async () => {
    const { text } = await request(base, "/epoxidation/caffeine");
    if (canonical(text) !== `${PUBLIC}/epoxidation/caffeine`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (attr(text, "og:image") !== `${PUBLIC}/og/epoxidation/caffeine`) {
      throw new Error(`og:image=${attr(text, "og:image")}`);
    }
    if (h1s(text)[0] !== "Caffeine") {
      throw new Error(`h1=${h1s(text)[0]}`);
    }
  });

  await check("synonym thein canonicalizes to caffeine", async () => {
    const { text } = await request(base, "/epoxidation/thein");
    if (canonical(text) !== `${PUBLIC}/epoxidation/caffeine`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
  });

  await check("dihydrobunolol loc stays drug-like, not systematic", async () => {
    const { text } = await request(base, "/epoxidation/dihydrobunolol");
    if (canonical(text) !== `${PUBLIC}/epoxidation/dihydrobunolol`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (/tert-butylammonio/.test(canonical(text) || "")) {
      throw new Error("canonical followed CHEBI systematic name");
    }
  });

  await check("unknown model is a 404 with links", async () => {
    const { text } = await request(base, "/not-a-real-model", {
      expectStatus: 404,
    });
    if (title(text) !== "XenoSite | Page not found") {
      throw new Error(`title=${title(text)}`);
    }
    if (!text.includes('href="/epoxidation"')) {
      throw new Error("404 missing model links");
    }
  });

  await check("robots.txt Sitemap line", async () => {
    const { text } = await request(base, "/robots.txt");
    if (!/^User-agent:\s*\*/m.test(text)) {
      throw new Error("missing User-agent: *");
    }
    const expected = `${PUBLIC}/sitemap/sitemap_index.xml`;
    if (!new RegExp(`^Sitemap:\\s*${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m").test(text)) {
      throw new Error(`expected Sitemap: ${expected}\n---\n${text}`);
    }
  });

  await check("sitemap index + gzip shard served here", async () => {
    const { text } = await request(base, "/sitemap/sitemap_index.xml");
    const locs = extractLocs(text);
    if (locs.length < 1) throw new Error("index has no shards");
    for (const loc of locs) {
      if (!loc.startsWith(`${PUBLIC}/sitemap/`) || !loc.endsWith(".xml.gz")) {
        throw new Error(`bad index loc ${loc}`);
      }
    }
    const shardPath = locs[0].slice(PUBLIC.length);
    const { buf } = await request(base, shardPath);
    let xml;
    try {
      xml = zlib.gunzipSync(buf).toString("utf8");
    } catch (err) {
      throw new Error(`shard is not gzip: ${err.message}`);
    }
    if (!xml.includes("<urlset") || !xml.includes("/_/caffeine")) {
      throw new Error("shard missing /_/caffeine");
    }
    if (xml.includes("tert-butylammonio") || xml.includes("/_/guaranine")) {
      throw new Error("shard still has systematic or synonym slugs");
    }
    if (!xml.includes("dihydrobunolol")) {
      throw new Error("shard missing dihydrobunolol");
    }
    notes.push(`${locs.length} shards in index; first has ${xml.split("<loc>").length - 1} locs`);
  });

  for (const model of MODELS) {
    await check(`model tab ${model} 200`, async () => {
      await request(base, `/${model}`);
    });
  }

  console.log(`\n${passed} passed, ${errors.length} failed`);
  for (const n of notes) console.log(`  ${n}`);
  if (errors.length) {
    process.exit(1);
  }
  console.log("Site checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
