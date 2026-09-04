# Requested changes for `xenosite-api`

Needed so the XenoSite frontend can do interactive SOM hit-testing and show metabolite names without depicting every metabolite on each prediction.

## Deployed API check (2026-09-03)

Base: `https://swami.wustl.edu/xenosite-api`

| Need | Status on deploy |
|------|------------------|
| Embedded `{coords, scale}` in `/v1/depict` | **Present** (script `type="application/json"`; body may be HTML-escaped `&quot;`) |
| Embedded coords in `?depict=true` canonize SVG | **Present** (same) |
| `bonds.idx` on molecule payload | **Present** |
| `Metabolite.name` in OpenAPI schema | **Present** (optional field already declared) |
| Live prediction + metabolite enrichment | **Not verifiable** — all `/v0/*` and `/v1/{model}` prediction routes return **503** (`ONNX … missing`; models not converted on this host) |

**Frontend note:** SVG script JSON uses HTML entities (`{&quot;coords&quot;:…}`). Parsers must unescape before `JSON.parse`.

Until prediction routes are healthy, we cannot confirm that metabolite `name` is populated at runtime (only that the schema allows it).

---

## 1. Embed coordinate JSON in prediction SVGs

In `xenosite/api/mol.py` (`depictor`), when building shaded depictions:

```python
Xenopict(result.smiles, embed_script=True).shade(...).halo()
```

Also for the empty-results fallback depiction in the same function.

In `xenosite/api/v1/main.py` `/depict`:

```python
Xenopict(self.molecule.smiles, embed_script=True).to_svg()
```

**Why:** Xenopict only embeds `{ "coords": [...], "scale": N }` in an SVG `<script type="application/json">` when `embed_script=True`. The frontend keeps the SVG as an `<img>` and hit-tests atoms/bonds from that JSON + `bonds.idx`. Without it, SOM selection cannot work.

**Verify:** SVG from `?depict=true` (and `/v1/depict`) contains `application/json` with `coords` and `scale`.

**Deploy status:** Looks done for `/v1/depict` and canonize depictions. Confirm shaded **model** depictions also embed coords once ONNX routes are up.

---

## 2. Optional `name` on `Metabolite`

In `xenosite/api/types.py`, on `Metabolite`:

```python
name: Optional[dict] = None
```

Same shape as molecule-level name lookup (e.g. `name`, `chebi`, `description`) — no need for a new schema type.

**Deploy status:** Schema already includes `name`. Live `metabolites=true` responses populate `name` for some ChEBI hits (e.g. phase1/aspirin); many metabolites remain unnamed.

### Frontend must pass `metabolites=true`

Prediction routes omit the metabolite list unless `metabolites=true` is set. The site loader always sends this flag; ranking/capping still happens only in the UI.

---

## 3. Best-effort metabolite name enrichment (no per-metabolite Xenopict)

In `depictor` (or right after predictions are assembled, before return):

- If `results[].metabolite` is present, look up each metabolite SMILES via existing `SqliteNameLookup` (same as canonize).
- On success with a real ChEBI/name hit, set `metabolite.name` (strip `smiles` / `reordering` / `ismiles`).
- On SMILES-only / miss / error: leave `name` unset; never raise.
- **Do not** call `Xenopict` on metabolites in this path. Metabolite drawings stay a separate `/v1/depict` (or frontend proxy) concern.

**Why:** Metabolite lists can be huge; depicting them all on the prediction request is too expensive. Names are nice-to-have for the panel.

**Verify:** Unit tests that (a) ChEBI hits attach `name`, (b) misses stay `None`, (c) enrichment never constructs `Xenopict` for metabolites, (d) existing depiction tests still pass and now assert embedded JSON when `depict=true`.

**Deploy status:** Live `metabolites=true` responses populate `name` for some ChEBI hits (e.g. phase1/aspirin); many metabolites remain unnamed.

---

## 4. Drop RDKit-invalid metabolite SMILES

When assembling `results[].metabolite`, **do not emit** products whose SMILES RDKit cannot parse/sanitize (e.g. pentavalent aromatic N-oxides like `NC(CC1=CN(O)=CN1)C(=O)O`). Prefer a charge-separated form (`…[n+]([O-])…`) or omit the product.

**Why:** `/v1/depict` and prediction routes reject these with 422; the site must not offer undepictable / unresolvable metabolites. The frontend also filters known-bad patterns and drops depict failures, but the forest should not emit them.

**Verify:** Histidine (`h`) phase1 NitrogenOxidation products include the charged N-oxide form and **not** `…CN(O)=CN…`.

---

## Out of scope for this API pass

- Bioactivation as a live site model
- Changing metabolite ranking/threshold (frontend: top 5, score ≥ 0.01)
- Path URLs / `/m/` drill-down (frontend only)
- Frontend overlay / hit-test UI

## Acceptance checklist

1. Shaded prediction SVG includes embedded `{coords, scale}` JSON.
2. Plain `/v1/depict` SVG also includes that JSON (optional but preferred for consistency).
3. `Metabolite.name` is optional and populated best-effort.
4. Prediction path never Xenopicts the metabolite list.
5. Metabolite lists omit SMILES RDKit cannot parse/sanitize.
6. Prediction model routes return 200 with ONNX available (blocked on current deploy).
