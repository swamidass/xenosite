# Lab log

## 2026-09-16

- GA (`G-LYSCEP16PN` via GTM) shows ~4.5k views / ~540 users over ~28d — too little to explain Vercel function GB-Hrs; cost is mostly non-JS crawl of the ~50k sitemap.
- Short-term fix: filter `sitemap-inventory.json` to `preferred-drug-names.txt` and drop `/_` hubs → **408** URLs (401 molecule). Expand later via ChEBI drug roles.
- Gtag: read `gaTrackingId` via `useRouteLoaderData("root")` so nested molecule routes still load the tag; pageviews include search.
