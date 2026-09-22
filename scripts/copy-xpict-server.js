/**
 * After `remix build`, ensure the Vercel serverless function can paint OG
 * images with xpict:
 *
 * 1. Append NFT-friendly `readFileSync` probes to `api/index.js` so `.wasm`
 *    binaries are packed beside the traced JS (NFT skips unreferenced wasm).
 * 2. Stage full packages under `api/node_modules` as a fallback resolve root.
 */
const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-xpict-server] missing ${src}; skip`);
    return false;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

const root = path.join(__dirname, "..");
const apiIndex = path.join(root, "api", "index.js");

if (!fs.existsSync(apiIndex)) {
  console.warn("[copy-xpict-server] api/index.js missing; run remix build first");
  process.exit(0);
}

const destRoot = path.join(root, "api", "node_modules");
const okXpict = copyDir(
  path.join(root, "node_modules", "@swamidasslab", "xpict"),
  path.join(destRoot, "@swamidasslab", "xpict"),
);
const okRdkit = copyDir(
  path.join(root, "node_modules", "@rdkit", "rdkit"),
  path.join(destRoot, "@rdkit", "rdkit"),
);

const marker = "/* xpict-nft-wasm */";
let src = fs.readFileSync(apiIndex, "utf8");
if (!src.includes(marker)) {
  // Probe both flattened (/var/task) and nested (/var/task/api) layouts.
  // Paths must stay string-literal for NFT static analysis.
  const probe = `
${marker}
try {
  const __xpictFs = require("fs");
  const __xpictPath = require("path");
  __xpictFs.readFileSync(__xpictPath.join(__dirname, "node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm"));
  __xpictFs.readFileSync(__xpictPath.join(__dirname, "node_modules/@swamidasslab/xpict/dist/wasm/xpict_core_bg.wasm"));
  __xpictFs.readFileSync(__xpictPath.join(__dirname, "../node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm"));
  __xpictFs.readFileSync(__xpictPath.join(__dirname, "../node_modules/@swamidasslab/xpict/dist/wasm/xpict_core_bg.wasm"));
} catch (__xpictNftErr) {
  /* NFT traces the paths; missing at boot is ok */
}
`;
  fs.writeFileSync(apiIndex, probe + src);
}

console.log(
  `[copy-xpict-server] NFT probe injected; api/node_modules xpict=${okXpict} rdkit=${okRdkit}`,
);
