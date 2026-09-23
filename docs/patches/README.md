# Upstream patch: JS CXSMILES star labels

Ready-to-apply patch for [`swamidasslab/xenosite-pict`](https://github.com/swamidasslab/xenosite-pict)
(issue [#20](https://github.com/swamidasslab/xenosite-pict/issues/20)).

The Cursor cloud agent **cannot push** to `swamidasslab/xenosite-pict` (403),
so this file is the PR payload until someone with write access lands it.

## Apply

```bash
cd /path/to/xenosite-pict
git checkout main && git pull
git checkout -b cursor/js-cxsmiles-star-labels
git am /path/to/xenosite/docs/patches/xpict-js-cxsmiles-star-labels.patch
cd js && npm test
git push -u origin HEAD
gh pr create --title "feat(js): auto-apply CXSMILES star labels in xpict.render" \
  --body "Closes #20. Port of Python \`cx_atom_labels\`; explicit \`star_labels\` still overrides."
```

## What it does

- Adds `js/src/cxsmiles.ts` (ChemAxon `|$…$|` parse + star encounter order)
- `xpict.render` auto-sets `star_labels` from the input CXSMILES when omitted
- Smoke tests: `*C |$R1;$|`, GSH adduct, explicit override

`@xenosite/xpict` ≥ 0.3.1 auto-applies CX aliases when `star_labels` is omitted.
Xenosite still keeps the same logic in `app/utils/cxsmiles.ts` and passes
`star_labels` explicitly in `paintSmiles` for override clarity.
