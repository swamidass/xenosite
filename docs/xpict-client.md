# Client-side depiction (`@xenosite/xpict`)

The site paints interactive molecules **in the browser** with xpict (RDKit
script + WASM). Coords come from the `Rendered` object — no SVG `embed_script`.

**Interactive pages use `depict=false`** — no SVG in prediction JSON and no
`/depict` proxy. After hydrate, Remix `ClientOnly` + `Suspense` + a `*.client`
paint resource paints (no `useEffect`).

**Open Graph PNGs** (`/og/:model/:query`) still request API depictions
(`depict=true` on that route only). Server-side xpict for OG is deferred until
RDKit/xpict wasm packaging works reliably on Vercel serverless.

- **Main card:** `XpictMoleculeDepiction` (shade from `atom` / `bond` scores)
- **Metabolite cards:** `XpictLazyMetaboliteImg`, **aligned to the parent** via
  `align_to` / `alignToSmiles` at every hop
- **Nested hop depiction:** also aligned to the previous generation’s SMILES
  (`HopDepictContext.alignToSmiles`)
- **Star / R-group labels:** CXSMILES ``|$GSH;;;;$|`` trailers are parsed in
  `app/utils/cxsmiles.ts` and passed as xpict `star_labels`. Upstream
  `@xenosite/xpict` ≥ 0.3.1 also auto-applies CX aliases when `star_labels` is
  omitted; we still pass them explicitly for override clarity. Upstream patch
  history: [`docs/patches/`](patches/README.md) /
  [xenosite-pict#20](https://github.com/swamidasslab/xenosite-pict/issues/20)
- **Legacy (tests only):** `InteractiveMoleculeDepiction` (server SVG + embed);
  `LazyMetaboliteImg` re-exports the client xpict path

## How the browser loads xpict

`scripts/copy-xpict-public.js` (postinstall + build) copies the package `dist/`
to `public/xpict-pkg/`. Client code dynamic-imports `/xpict-pkg/index.js` so
Remix/esbuild never bundles RDKit/Node builtins into the app chunk. WASM
resolves beside that ESM via `import.meta.url`.


## Install / CI

Package name: **`@xenosite/xpict`** (formerly `@swamidasslab/xpict`). Intended
registry is public npm (`publishConfig.registry: https://registry.npmjs.org`).
Until the package is published there, this repo vendors a release tarball.

### Preferred: registry (when published)

```json
"@xenosite/xpict": "^0.3.1"
```

### Interim: vendored tarball

```json
"@xenosite/xpict": "file:vendor/xenosite-xpict-0.3.1.tgz"
```

`postinstall` / `build` copy `dist/` (including WASM) to `public/xpict-pkg/`.
