/**
 * Copy @xenosite/xpict dist into public/ so the browser loads it as plain
 * ESM (not remixed/esbuild-bundled). That keeps Node-only paths (fs, RDKit npm)
 * out of the Remix client bundle and lets wasm resolve via import.meta.url.
 *
 * Interactive UI paints client-side from this public copy. Open Graph still
 * uses API depictions until server wasm packaging is reliable on Vercel.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(
  __dirname,
  "..",
  "node_modules",
  "@xenosite",
  "xpict",
  "dist",
);
const dest = path.join(__dirname, "..", "public", "xpict-pkg");

if (!fs.existsSync(src)) {
  console.warn("[copy-xpict-public] @xenosite/xpict not installed; skip");
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

// Convenience alias used by older notes / absolute wasm URL fallbacks.
const wasmSrc = path.join(dest, "wasm", "xpict_core_bg.wasm");
const wasmAliasDir = path.join(__dirname, "..", "public", "xpict");
fs.mkdirSync(wasmAliasDir, { recursive: true });
if (fs.existsSync(wasmSrc)) {
  fs.copyFileSync(wasmSrc, path.join(wasmAliasDir, "xpict_core_bg.wasm"));
}

console.log("[copy-xpict-public] → public/xpict-pkg (+ public/xpict wasm alias)");
