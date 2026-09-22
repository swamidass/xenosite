# Client-side depiction (`@swamidasslab/xpict`)

The site paints interactive molecules **in the browser** with xpict (RDKit
script + WASM). Coords come from the `Rendered` object — no SVG `embed_script`.

**Prediction API never gets `depict=true`** — no `/v1/depict` and no SVG in
prediction JSON. After hydrate, Remix `ClientOnly` + `Suspense` + a `*.client`
paint resource paints (no `useEffect`).

**Open Graph PNGs** (`/og/:model/:query`) paint **server-side** via
`paintSmilesServer` (`app/utils/xpictPaint.server.ts`) so crawlers get a real
image without calling the API depict endpoint.

- **Main card:** `XpictMoleculeDepiction` (shade from `atom` / `bond` scores)
- **Metabolite cards:** `XpictLazyMetaboliteImg`, **aligned to the parent** via
  `align_to` / `alignToSmiles` at every hop
- **Nested hop depiction:** also aligned to the previous generation’s SMILES
  (`HopOutletContext.alignToSmiles`)
- **Star / R-group labels:** CXSMILES ``|$GSH;;;;$|`` trailers are parsed in
  `app/utils/cxsmiles.ts` and passed as xpict `star_labels`. Upstream patch:
  [`docs/patches/`](patches/README.md) / [xenosite-pict#20](https://github.com/swamidasslab/xenosite-pict/issues/20)
- **Legacy (tests only):** `InteractiveMoleculeDepiction` (server SVG + embed);
  `LazyMetaboliteImg` re-exports the client xpict path

## How the browser loads xpict

`scripts/copy-xpict-public.js` (postinstall + build) copies the package `dist/`
to `public/xpict-pkg/`. Client code dynamic-imports `/xpict-pkg/index.js` so
Remix/esbuild never bundles RDKit/Node builtins into the app chunk. WASM
resolves beside that ESM via `import.meta.url`.


## Install / CI

`@swamidasslab/xpict` is published **public** on GitHub Packages
(`publishConfig.access: "public"`). GitHub’s **npm** registry still requires
authentication to download — there is no anonymous `npm install` for
`npm.pkg.github.com` (unlike the Container registry).

### Preferred: registry

Committed `.npmrc` only sets the scope registry (yarn v1 cannot reference an
unset `${NPM_TOKEN}`).

```
@swamidasslab:registry=https://npm.pkg.github.com
```

Add auth in CI / `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

```json
"@swamidasslab/xpict": "^0.1.2"
```

Set `NPM_TOKEN` (and optionally `NODE_AUTH_TOKEN` to the same value):

| Environment | Token |
| --- | --- |
| Local | Classic PAT with `read:packages` in `~/.npmrc` |
| GitHub Actions | `secrets.NPM_TOKEN`, or `GITHUB_TOKEN` after granting the package **Actions → Read** access to `swamidass/xenosite` |
| Vercel | Project env `NPM_TOKEN` (available at install) |

### Interim: vendored tarball

Until CI secrets / package Actions access are wired, this repo may use:

```json
"@swamidasslab/xpict": "file:vendor/swamidasslab-xpict-0.1.2.tgz"
```

`postinstall` / `build` copy WASM to `public/xpict/xpict_core_bg.wasm`.
