import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "@remix-run/vercel";
import * as build from "@remix-run/dev/server-build";

/**
 * Touch wasm binaries with statically analyzable paths so Vercel NFT packs
 * them into the serverless function. Without this, OG xpict paint fails with
 * ENOENT on RDKit_minimal.wasm (JS is traced; .wasm is not).
 *
 * Wrapped in try/catch so a missing file cannot take down every route at boot.
 */
const root = dirname(fileURLToPath(import.meta.url));
for (const rel of [
  "node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm",
  "node_modules/@swamidasslab/xpict/dist/wasm/xpict_core_bg.wasm",
]) {
  try {
    readFileSync(join(root, rel));
  } catch {
    /* NFT still sees the readFileSync; absence is handled at paint time */
  }
}

export default createRequestHandler({ build, mode: process.env.NODE_ENV });
