# Lab log

## 2026-10-01

- SOM overlay rings sat above phenol atoms: xpict JS `svg_coords` omit Rust heteroatom label pad. Workaround in xenosite (not xpict): after paint, fit shade disks → `(xscale,xshift,yscale,yshift)` on overlay/hit coords (identity / translation / full fit by how many pairs; never hard-fail). Match atoms **and** bond midpoints so ndealk bond-shade does not invent a ½-bond shift. Overlay/hit map through measured img display size (`ResizeObserver`, `xMidYMid meet`) so CSS-shrunk wide SVGs stay aligned.

## 2026-09-30

- Phase I backbones lost Metabolic Rainbow ink after client xpict: API used to set xenopict backbone color per head; restore via `backboneColorForModel` → xpict `color` (SO `#D55E00` … RD `#CC79A7`). Shade plot-dots stay score-based; bond strokes are not score-colored.
- Depiction package is `@swamidasslab/xpict@0.3.1` (GitHub Packages name), still installed via vendored `vendor/xenosite-xpict-0.3.1.tgz` so Vercel/CI need no `read:packages` token.
- Shade colors looked too hot on low-score molecules: xpict was auto-scaling shade to each mol’s local max. Pin `shade_vmin=0` / `shade_vmax=1` in `paintSmiles` via `withFixedShadeWindow` (scores already on [0, 1]).
- xpict/RDKit load: empty gray pulse looked like missing metabolites — use per-image `DepictLoading` (XDot + “Loading…”) as ClientOnly/Suspense fallback. Long-cache `/xpict-pkg/*` and WASM (`immutable`) so the runtime is not revalidated every visit.
- Deploy bug: switching model tabs re-hit the prediction API for molecules already loaded; atom clicks revalidated favicon.png (`max-age=0`). Fix: process-local + `clientLoader` prediction cache; correct `max-age` Cache-Control; immutable long-cache for favicons; canonical meta omits SOM stubs so atom clicks don’t rewrite `<head>`.
- Live `_data` headers confirmed broken: query loader sent `public, maxage=600` (invalid); model layout sent `max-age=0`. Fixed loader `HEADERS`, lift via route `headers` export, and stop entry.server from clobbering loader Cache-Control.

## 2026-09-16

- GA (`G-LYSCEP16PN` via GTM) shows ~4.5k views / ~540 users over ~28d — too little to explain Vercel function GB-Hrs; cost is mostly non-JS crawl of the ~50k sitemap.
- Short-term fix: filter `sitemap-inventory.json` to `preferred-drug-names.txt` and drop `/_` hubs → **408** URLs (401 molecule). Expand later via ChEBI drug roles.
- Gtag: read `gaTrackingId` via `useRouteLoaderData("root")` so nested molecule routes still load the tag; pageviews include search.
