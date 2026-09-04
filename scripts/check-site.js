#!/usr/bin/env node
/**
 * Live smoke checks against a running server (HTTP + optional browser).
 *
 * Canonical / og:url / robots Sitemap always name the public origin
 * (https://xenosite.org), even on localhost or a Vercel preview.
 *
 *   node scripts/check-site.js https://xenosite.org
 *   node scripts/check-site.js http://localhost:3000
 *   CHECK_SITE_SKIP_BROWSER=1 node scripts/check-site.js https://xenosite.org
 */
const zlib = require("zlib");
const { SITE_ORIGIN, MODELS } = require("./lib/sitemap-pages");

const PUBLIC = SITE_ORIGIN;
const DEFAULT_URL = process.env.CHECK_SITE_URL || process.env.BASE_URL || PUBLIC;
const SKIP_BROWSER = /^(1|true|yes)$/i.test(
  process.env.CHECK_SITE_SKIP_BROWSER || "",
);

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

function linkIcons(html) {
  return [...html.matchAll(/<link([^>]+)>/gi)]
    .map((m) => m[1])
    .filter((t) => /rel=["'][^"']*icon[^"']*["']/i.test(t))
    .map((t) => {
      const href = t.match(/href=["']([^"']+)["']/i);
      const type = t.match(/type=["']([^"']+)["']/i);
      return { href: href && href[1], type: type && type[1] };
    });
}

function imgTags(html) {
  return [...html.matchAll(/<img\b([^>]*)>/gi)].map((m) => {
    const tag = m[1];
    const src = (tag.match(/src=["']([^"']+)["']/i) || [])[1] || "";
    const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1];
    return { src, alt: alt == null ? null : alt };
  });
}

function decodeDataUri(uri) {
  const comma = uri.indexOf(",");
  if (comma < 0) throw new Error("malformed data URI");
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  if (/;base64/i.test(meta)) return Buffer.from(payload, "base64").toString("utf8");
  return decodeURIComponent(payload);
}

function assertPng(buf, label) {
  if (!buf || buf.length < 32) {
    throw new Error(`${label}: too small (${buf ? buf.length : 0} bytes)`);
  }
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    throw new Error(`${label}: not a PNG`);
  }
}

function assertSvgMarkup(text, label) {
  if (!/<svg[\s>]/i.test(text)) throw new Error(`${label}: missing <svg>`);
  if (!/<circle|<path|<g[\s>]/i.test(text)) {
    throw new Error(`${label}: empty-looking SVG`);
  }
}

async function request(base, pathname, { expectStatus = 200 } = {}) {
  const url = pathname.startsWith("http") ? pathname : `${base}${pathname}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "xenosite-check-site" },
      redirect: "follow",
    });
  } catch (err) {
    throw new Error(`${url}: ${err.cause?.code || err.message}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (res.status !== expectStatus) {
    throw new Error(`${pathname}: expected HTTP ${expectStatus}, got ${res.status}`);
  }
  return { res, buf, text: buf.toString("utf8"), url };
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
}

function publicPath(publicUrl) {
  const u = new URL(publicUrl);
  return `${u.pathname}${u.search}`;
}

async function runHttp(base, check, notes) {
  let homeHtml;
  await check("homepage title, canonical, OG, h1, JSON-LD", async () => {
    const { text } = await request(base, "/");
    homeHtml = text;
    if (title(text) !== "XenoSite") throw new Error(`title=${title(text)}`);
    if (canonical(text) !== PUBLIC) throw new Error(`canonical=${canonical(text)}`);
    if (attr(text, "og:url") !== PUBLIC) throw new Error(`og:url=${attr(text, "og:url")}`);
    if (attr(text, "og:image") !== `${PUBLIC}/xenosite.png`) {
      throw new Error(`og:image=${attr(text, "og:image")}`);
    }
    if (attr(text, "og:image:width") !== "2400") {
      throw new Error(`og:image:width=${attr(text, "og:image:width")}`);
    }
    if (attr(text, "twitter:card") !== "summary_large_image") {
      throw new Error(`twitter:card=${attr(text, "twitter:card")}`);
    }
    const icons = linkIcons(text);
    if (!icons.some((i) => i.href === "/favicon.png")) {
      throw new Error(`favicon png missing: ${JSON.stringify(icons)}`);
    }
    if (!icons.some((i) => i.href === "/favicon.svg")) {
      throw new Error("favicon svg missing");
    }
    if (h1s(text).length !== 1 || h1s(text)[0] !== "What is XenoSite?") {
      throw new Error(`h1s=${JSON.stringify(h1s(text))}`);
    }
    if (!text.includes("#organization") || !text.includes("WebSite") || !text.includes("SearchAction")) {
      throw new Error("missing Organization/WebSite JSON-LD");
    }
    if (!text.includes("<svg") || !text.includes('fill:rgb(254,0,0)')) {
      throw new Error("logo XDot SVG not in homepage HTML");
    }
  });

  await check("static images (favicon, share PNG) decode", async () => {
    const png = await request(base, "/favicon.png");
    assertPng(png.buf, "/favicon.png");
    const share = await request(base, "/xenosite.png");
    assertPng(share.buf, "/xenosite.png");
    if (share.buf.length < 10000) {
      throw new Error(`xenosite.png too small (${share.buf.length})`);
    }
    const svg = await request(base, "/favicon.svg");
    assertSvgMarkup(svg.text, "/favicon.svg");
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

  await check("caffeine page canonical, depictions, CHEBI, OG PNG", async () => {
    const { text } = await request(base, "/epoxidation/caffeine");
    if (canonical(text) !== `${PUBLIC}/epoxidation/caffeine`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (attr(text, "og:image") !== `${PUBLIC}/og/epoxidation/caffeine`) {
      throw new Error(`og:image=${attr(text, "og:image")}`);
    }
    if (h1s(text)[0] !== "Caffeine") throw new Error(`h1=${h1s(text)[0]}`);
    const imgs = imgTags(text).filter((i) => i.src.startsWith("data:image/svg"));
    if (!imgs.length) throw new Error("no depiction <img> data URIs");
    for (const img of imgs) {
      if (!img.alt || /caffeine/i.test(img.alt) === false) {
        throw new Error(`depiction alt=${img.alt}`);
      }
      assertSvgMarkup(decodeDataUri(img.src), "depiction");
    }
    const chebi = text.match(/<a[^>]*href="[^"]*CHEBI[^"]*"[^>]*>/i);
    if (!chebi) throw new Error("missing CHEBI link");
    if (/\bnofollow\b/i.test(chebi[0])) throw new Error("CHEBI should not be nofollow");
    const og = await request(base, "/og/epoxidation/caffeine");
    const ctype = og.res.headers.get("content-type") || "";
    if (!ctype.includes("image/png")) throw new Error(`OG content-type=${ctype}`);
    assertPng(og.buf, "/og/epoxidation/caffeine");
    if (og.buf.length < 1000) throw new Error("OG PNG too small");
  });

  await check("synonym thein canonicalizes to caffeine", async () => {
    const { text } = await request(base, "/epoxidation/thein");
    if (canonical(text) !== `${PUBLIC}/epoxidation/caffeine`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
  });

  await check("dihydrobunolol loc stays drug-like; depiction present", async () => {
    const { text } = await request(base, "/epoxidation/dihydrobunolol");
    if (canonical(text) !== `${PUBLIC}/epoxidation/dihydrobunolol`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    if (/tert-butylammonio/.test(canonical(text) || "")) {
      throw new Error("canonical followed CHEBI systematic name");
    }
    const imgs = imgTags(text).filter((i) => i.src.startsWith("data:image/svg"));
    if (!imgs.length) throw new Error("no depictions");
    assertSvgMarkup(decodeDataUri(imgs[0].src), "dihydrobunolol depiction");
  });

  await check("canonize page /_/caffeine has depiction", async () => {
    const { text } = await request(base, "/_/caffeine");
    if (canonical(text) !== `${PUBLIC}/_/caffeine`) {
      throw new Error(`canonical=${canonical(text)}`);
    }
    const imgs = imgTags(text).filter((i) => i.src.startsWith("data:image/svg"));
    if (!imgs.length) throw new Error("no depiction");
    assertSvgMarkup(decodeDataUri(imgs[0].src), "/_/caffeine depiction");
  });

  await check("each model caffeine page has a depiction", async () => {
    for (const model of MODELS) {
      const { text } = await request(base, `/${model}/caffeine`);
      const imgs = imgTags(text).filter((i) => i.src.startsWith("data:image/svg"));
      if (!imgs.length) throw new Error(`/${model}/caffeine has no depiction`);
      assertSvgMarkup(decodeDataUri(imgs[0].src), `/${model}/caffeine`);
    }
  });

  await check("unknown model is a 404 with links", async () => {
    const { text } = await request(base, "/not-a-real-model", { expectStatus: 404 });
    if (title(text) !== "XenoSite | Page not found") {
      throw new Error(`title=${title(text)}`);
    }
    if (!text.includes('name="robots"') || !text.includes("noindex")) {
      throw new Error("404 should be noindex");
    }
    for (const model of MODELS) {
      if (!text.includes(`href="/${model}"`)) {
        throw new Error(`404 missing /${model}`);
      }
    }
  });

  await check("robots.txt Sitemap line", async () => {
    const { text } = await request(base, "/robots.txt");
    if (!/^User-agent:\s*\*/m.test(text)) throw new Error("missing User-agent: *");
    const expected = `${PUBLIC}/sitemap/sitemap_index.xml`;
    const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`^Sitemap:\\s*${escaped}`, "m").test(text)) {
      throw new Error(`expected Sitemap: ${expected}\n---\n${text}`);
    }
  });

  await check("sitemap shards: gzip, names, sample page images", async () => {
    const { text } = await request(base, "/sitemap/sitemap_index.xml");
    const locs = extractLocs(text);
    if (locs.length < 2) throw new Error(`expected 2 shards, got ${locs.length}`);
    const xmls = [];
    for (const loc of locs) {
      if (!loc.startsWith(`${PUBLIC}/sitemap/`) || !loc.endsWith(".xml.gz")) {
        throw new Error(`bad index loc ${loc}`);
      }
      const { buf } = await request(base, publicPath(loc));
      const xml = zlib.gunzipSync(buf).toString("utf8");
      if (!xml.includes("<urlset")) throw new Error(`${loc} not a urlset`);
      xmls.push(xml);
    }
    const all = xmls.join("\n");
    if (!all.includes("/_/caffeine")) throw new Error("missing /_/caffeine");
    if (!all.includes("dihydrobunolol")) throw new Error("missing dihydrobunolol");
    if (all.includes("tert-butylammonio") || all.includes("/_/guaranine")) {
      throw new Error("systematic or synonym slugs in sitemap");
    }
    const moleculeLocs = extractLocs(all).filter((u) =>
      /^https:\/\/xenosite\.org\/epoxidation\/[a-z][a-z-]*$/.test(u),
    );
    const samples = moleculeLocs.slice(0, 3);
    if (samples.length < 3) throw new Error("not enough simple epoxidation sample URLs");
    for (const loc of samples) {
      const { text: page } = await request(base, publicPath(loc));
      const imgs = imgTags(page).filter((i) => i.src.startsWith("data:image/svg"));
      if (!imgs.length) throw new Error(`${loc} has no depiction`);
      assertSvgMarkup(decodeDataUri(imgs[0].src), loc);
    }
    notes.push(
      `${locs.length} shards; sampled ${samples.length} epoxidation pages for depictions`,
    );
  });

  for (const model of MODELS) {
    await check(`model tab ${model} 200 + h1`, async () => {
      const { text } = await request(base, `/${model}`);
      if (h1s(text).length !== 1) throw new Error(`h1s=${JSON.stringify(h1s(text))}`);
    });
  }

  void homeHtml;
}

function pathnameOf(page) {
  return new URL(page.url()).pathname;
}

function searchInput(page) {
  return page.locator('input[name="search"]');
}

async function waitForDepiction(page, { timeout = 20000 } = {}) {
  const img = page.locator('img[src^="data:image/svg"]').first();
  await img.waitFor({ state: "visible", timeout });
  const box = await img.boundingBox();
  if (!box || box.width < 40 || box.height < 40) {
    throw new Error(`depiction box ${JSON.stringify(box)}`);
  }
  return img;
}

async function typeQuery(page, text) {
  const input = searchInput(page);
  await input.waitFor({ state: "visible" });
  await input.click();
  await input.fill("");
  await input.pressSequentially(text, { delay: 45 });
}

async function runBrowser(base, check) {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    throw new Error(
      "playwright is not installed. yarn add -D playwright && npx playwright install chromium",
    );
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    userAgent: "xenosite-check-site-browser",
  });
  try {
    await check("search stays put while typing, then updates after debounce", async () => {
      await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await typeQuery(page, "caffeine");
      if (pathnameOf(page) !== "/") {
        throw new Error(
          `URL changed before 300ms debounce: ${pathnameOf(page)}`,
        );
      }
      await page.waitForURL((url) => url.pathname === "/_/caffeine", {
        timeout: 8000,
      });
    });

    await check("depiction images are visible after search", async () => {
      const img = await waitForDepiction(page);
      const alt = await img.getAttribute("alt");
      if (!alt || !/caffeine/i.test(alt)) throw new Error(`alt=${alt}`);
    });

    await check("typing more updates the URL and depiction again", async () => {
      const input = searchInput(page);
      await input.click();
      await page.keyboard.press("ControlOrMeta+A");
      await input.pressSequentially("ibuprofen", { delay: 45 });
      if (pathnameOf(page).includes("ibuprofen")) {
        throw new Error("URL jumped to ibuprofen before debounce");
      }
      await page.waitForURL((url) => url.pathname === "/_/ibuprofen", {
        timeout: 8000,
      });
      await waitForDepiction(page);
      const value = await searchInput(page).inputValue();
      if (!/ibuprofen/i.test(value)) throw new Error(`search value=${value}`);
    });

    await check("model tab click keeps molecule and shows image", async () => {
      await page.getByRole("tab", { name: "Quinonation" }).click();
      await page.waitForURL(/\/quinone\/ibuprofen/, { timeout: 15000 });
      await waitForDepiction(page);
    });

    await check("logo returns home; model tab then live search", async () => {
      await page.getByRole("link", { name: "XenoSite" }).click();
      await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", {
        timeout: 10000,
      });
      await page.getByRole("tab", { name: "Epoxidation" }).click();
      await page.waitForURL((url) => url.pathname === "/epoxidation", {
        timeout: 10000,
      });
      await typeQuery(page, "caffeine");
      if (pathnameOf(page) !== "/epoxidation") {
        throw new Error(
          `URL changed before debounce on model page: ${pathnameOf(page)}`,
        );
      }
      await page.waitForURL((url) => url.pathname === "/epoxidation/caffeine", {
        timeout: 8000,
      });
      const img = await waitForDepiction(page);
      const alt = await img.getAttribute("alt");
      if (!alt || !/caffeine/i.test(alt)) throw new Error(`alt=${alt}`);
    });
  } finally {
    await browser.close();
  }
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
  console.log("HTTP");
  await runHttp(base, check, notes);

  if (SKIP_BROWSER) {
    notes.push("browser checks skipped (CHECK_SITE_SKIP_BROWSER)");
  } else {
    console.log("\nBrowser");
    await runBrowser(base, check);
  }

  console.log(`\n${passed} passed, ${errors.length} failed`);
  for (const n of notes) console.log(`  ${n}`);
  if (errors.length) process.exit(1);
  console.log("Site checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
