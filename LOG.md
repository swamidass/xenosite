# Lab log

## 2026-09-30

- Deploy bug: switching model tabs re-hit the prediction API for molecules already loaded; atom clicks revalidated favicon.png (`max-age=0`). Fix: process-local + `clientLoader` prediction cache; correct `max-age` Cache-Control; immutable long-cache for favicons; canonical meta omits SOM stubs so atom clicks don’t rewrite `<head>`.
- Live `_data` headers confirmed broken: query loader sent `public, maxage=600` (invalid); model layout sent `max-age=0`. Fixed loader `HEADERS`, lift via route `headers` export, and stop entry.server from clobbering loader Cache-Control.

## 2026-09-16

- GA (`G-LYSCEP16PN` via GTM) shows ~4.5k views / ~540 users over ~28d — too little to explain Vercel function GB-Hrs; cost is mostly non-JS crawl of the ~50k sitemap.
- Short-term fix: filter `sitemap-inventory.json` to `preferred-drug-names.txt` and drop `/_` hubs → **408** URLs (401 molecule). Expand later via ChEBI drug roles.
- Gtag: read `gaTrackingId` via `useRouteLoaderData("root")` so nested molecule routes still load the tag; pageviews include search.
