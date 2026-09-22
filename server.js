import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "@remix-run/vercel";
import * as build from "@remix-run/dev/server-build";

/**
 * Touch wasm binaries with statically analyzable paths so Vercel NFT packs
 * them into the serverless function. Without this, OG xpict paint fails with
 * ENOENT on RDKit_minimal.wasm (JS is traced; .wasm is not).
 */
const root = dirname(fileURLToPath(import.meta.url));
readFileSync(
  join(root, "node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm"),
);
readFileSync(
  join(root, "node_modules/@swamidasslab/xpict/dist/wasm/xpict_core_bg.wasm"),
);

export default createRequestHandler({ build, mode: process.env.NODE_ENV });
