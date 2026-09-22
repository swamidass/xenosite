/**
 * Stage xpict + RDKit next to the Vercel serverless entry (`api/`) so OG
 * paint can `import()` them even when NFT skips dynamic bare imports.
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
const destRoot = path.join(root, "api", "node_modules");

const xpictSrc = path.join(root, "node_modules", "@swamidasslab", "xpict");
const rdkitSrc = path.join(root, "node_modules", "@rdkit", "rdkit");

const okXpict = copyDir(
  xpictSrc,
  path.join(destRoot, "@swamidasslab", "xpict"),
);
const okRdkit = copyDir(rdkitSrc, path.join(destRoot, "@rdkit", "rdkit"));

console.log(
  `[copy-xpict-server] → api/node_modules (xpict=${okXpict}, rdkit=${okRdkit})`,
);
