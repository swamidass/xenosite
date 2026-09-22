# Client-side depiction (`@swamidasslab/xpict`)

The site paints molecules in the browser with xpict (RDKit coords + WASM scene).
Coords come from the `Rendered` object — no SVG `embed_script`.

- **Main card:** `XpictMoleculeDepiction` (shade from `atom` / `bond` scores)
- **Metabolite cards:** `XpictLazyMetaboliteImg`, **aligned to the parent** via
  `align_to` / `alignToSmiles` at every hop
- **Nested hop depiction:** also aligned to the previous generation’s SMILES
  (`HopOutletContext.alignToSmiles`)
- **Legacy (tests):** `InteractiveMoleculeDepiction` + `LazyMetaboliteImg` + `/depict`

## Install / CI

Today the package is **vendored** so installs need no GitHub token:

```json
"@swamidasslab/xpict": "file:vendor/swamidasslab-xpict-0.1.1.tgz"
```

`postinstall` / `build` copy WASM to `public/xpict/xpict_core_bg.wasm`.

### Switch to GitHub Packages

1. Publish visibility: set `publishConfig.access` to `"public"` in xpict (optional;
   GitHub’s **npm** registry still usually requires a token to pull).
2. Package settings → **Manage Actions access** → grant **Read** to `swamidass/xenosite`.
3. Repo secret `NPM_TOKEN` = classic PAT with `read:packages`.
4. `.npmrc`:

   ```
   @swamidasslab:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

5. Dependency: `"@swamidasslab/xpict": "^0.1.1"`.
6. Workflow / Vercel: export `NPM_TOKEN` (and `NODE_AUTH_TOKEN`) at install time.
