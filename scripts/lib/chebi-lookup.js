const https = require("https");
const http = require("http");
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");
const os = require("os");
const { pipeline } = require("stream/promises");
const msgpack = require("msgpack5")();

const DEFAULT_CHEBI_URL = "https://swami.wustl.edu/~jswami/chebi.msgpack.gz";

function downloadFile(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    client
      .get(url, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          if (redirectsLeft <= 0) {
            reject(new Error(`Too many redirects fetching ${url}`));
            return;
          }
          const nextUrl = new URL(response.headers.location, url).toString();
          downloadFile(nextUrl, dest, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(
            new Error(`Failed to download ${url}: HTTP ${response.statusCode}`),
          );
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

async function loadChebiLookup(options = {}) {
  const url = options.url || process.env.CHEBI_MSGPACK_URL || DEFAULT_CHEBI_URL;
  const cacheDir =
    options.cacheDir || path.join(os.tmpdir(), "xenosite-sitemap");
  fs.mkdirSync(cacheDir, { recursive: true });
  const gzPath = path.join(cacheDir, "chebi.msgpack.gz");
  const binPath = path.join(cacheDir, "chebi.msgpack");

  if (!fs.existsSync(binPath)) {
    console.error(`Downloading ${url}`);
    await downloadFile(url, gzPath);
    console.error(`Unzipping to ${binPath}`);
    await pipeline(
      fs.createReadStream(gzPath),
      zlib.createGunzip(),
      fs.createWriteStream(binPath),
    );
  } else {
    console.error(`Using cached CHEBI lookup: ${binPath}`);
  }

  const decoded = msgpack.decode(fs.readFileSync(binPath));
  if (!decoded || !decoded.lookup) {
    throw new Error("CHEBI msgpack missing lookup map");
  }
  return decoded.lookup;
}

function looksLikeSmiles(name) {
  if (!name || typeof name !== "string") return true;
  if (/[=#\[\]\\\/%]/.test(name)) return true;
  if (
    /\d+[A-Za-z]|[A-Za-z]\d+/.test(name) &&
    !/\s/.test(name) &&
    name.length >= 6
  ) {
    if (/^[A-Za-z0-9@+\-]+$/.test(name) && /[CNOPSFClBrcnops]/.test(name)) {
      return name.length >= 8;
    }
  }
  return false;
}

/**
 * Heuristic drug-like / common-name filter.
 * Tunable via options; defaults match the sitemap plan.
 */
function isDrugLikeName(rawName, options = {}) {
  const maxLen =
    options.maxLen ?? Number(process.env.SITEMAP_NAME_MAX_LEN || 40);
  const minLen =
    options.minLen ?? Number(process.env.SITEMAP_NAME_MIN_LEN || 3);
  const name = String(rawName || "")
    .trim()
    .toLowerCase();

  if (!name) return { ok: false, reason: "empty" };
  if (name.length < minLen) return { ok: false, reason: "too_short" };
  if (name.length > maxLen) return { ok: false, reason: "too_long" };
  if (!/^[a-z]/.test(name)) return { ok: false, reason: "not_alpha_start" };
  if (!/[a-z]/.test(name)) return { ok: false, reason: "no_letters" };
  // Drop systematic / coded names aggressively
  if (/\d/.test(name)) return { ok: false, reason: "has_digit" };
  if (/[()]/.test(name)) return { ok: false, reason: "has_parens" };
  if (looksLikeSmiles(name)) return { ok: false, reason: "smiles_like" };

  // Stereo / registry-ish noise
  if (/^[\(\[+±\-]/.test(name)) return { ok: false, reason: "stereo_prefix" };
  if (/,/.test(name)) return { ok: false, reason: "comma_systematic" };
  if ((name.match(/'/g) || []).length >= 2)
    return { ok: false, reason: "many_primes" };
  if (
    /(yl|ine|ate|one|ol|ic acid)$/.test(name) &&
    (name.match(/-/g) || []).length >= 3
  ) {
    return { ok: false, reason: "hyphenated_systematic" };
  }
  if (
    /^(d|l|dl|n|o|s|r)-/.test(name) &&
    (name.match(/-/g) || []).length >= 2 &&
    name.length > 24
  ) {
    return { ok: false, reason: "stereo_systematic" };
  }

  return { ok: true, reason: "ok", name };
}

/**
 * Prefer recognizable common names over obscure short synonyms
 * (e.g. "caffeine" over "thein", "ibuprofen" over "anco").
 */
function nameQuality(name, options = {}) {
  let score = 0;
  if (/^[a-z]+$/.test(name)) {
    score += 100 + Math.min(name.length, 12);
    // Prefer ordinary INN-length tokens over long obscure synonyms
    if (name.length >= 6 && name.length <= 12) score += 25;
  } else if (/^[a-z]+(?:[ -][a-z]+)+$/.test(name)) {
    score += 60 + Math.min(name.length, 18);
  }
  if (/^[\(\[+±\-]/.test(name)) score -= 50;
  if (/\d/.test(name)) score -= 40;
  if (/[()]/.test(name)) score -= 40;
  if (name.length < 5) score -= 30;
  if (name.length > 20) score -= name.length - 20;
  if (options.preferred && options.preferred.has(name)) score += 1000;
  return score;
}

function loadPreferredDrugNames(filePath) {
  const preferredPath =
    filePath || path.join(__dirname, "preferred-drug-names.txt");
  if (!fs.existsSync(preferredPath)) return new Set();
  return new Set(
    fs
      .readFileSync(preferredPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Build CHEBI id -> preferred canonical name from lookup.
 */
function collectDrugLikeCandidates(lookup, options = {}) {
  const byChebi = new Map();
  const dropped = { totalNames: 0, keptNames: 0, reasons: {} };
  const preferred = options.preferred || loadPreferredDrugNames();

  for (const [rawKey, chebi] of Object.entries(lookup)) {
    dropped.totalNames++;
    const verdict = isDrugLikeName(rawKey, options);
    if (!verdict.ok) {
      dropped.reasons[verdict.reason] =
        (dropped.reasons[verdict.reason] || 0) + 1;
      continue;
    }
    dropped.keptNames++;
    const id = Number(chebi);
    if (!Number.isFinite(id)) continue;

    const quality = nameQuality(verdict.name, { preferred });
    const existing = byChebi.get(id);
    if (
      !existing ||
      quality > existing.quality ||
      (quality === existing.quality &&
        verdict.name.localeCompare(existing.name) < 0)
    ) {
      byChebi.set(id, { chebi: id, name: verdict.name, quality });
    }
  }

  const candidates = [...byChebi.values()]
    .map(({ chebi, name }) => ({ chebi, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { candidates, stats: { ...dropped, uniqueChebi: candidates.length } };
}

module.exports = {
  DEFAULT_CHEBI_URL,
  loadChebiLookup,
  isDrugLikeName,
  nameQuality,
  loadPreferredDrugNames,
  collectDrugLikeCandidates,
  looksLikeSmiles,
};
