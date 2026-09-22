/**
 * ChemAxon CXSMILES atom-label helpers.
 *
 * Port of xpict Python `cx_atom_labels` (structure.py). The JS xpict client does
 * not yet apply CX trailers automatically — callers must pass `star_labels`.
 */

/** ChemAxon ``|$alias1;alias2;$|`` atom-label block inside CXSMILES. */
const CX_ATOM_LABELS = /\|\$([^|]*)\$\|/;

/**
 * Parse CXSMILES ``|$a;b;c;$|`` aliases into a per-atom label list.
 * Empty segments → ``null``. Returns ``[]`` when no label block is present.
 * Leading underscore in ChemAxon (``_R``) is stripped for display.
 */
export function cxAtomLabels(smilesOrCx: string): Array<string | null> {
  if (!smilesOrCx) return [];
  const m = smilesOrCx.match(CX_ATOM_LABELS);
  if (!m) return [];
  const raw = m[1] ?? "";
  // Trailing empty field before final ``$`` is common: ``a;b;``.
  let parts = raw.split(";");
  if (parts.length && parts[parts.length - 1] === "") {
    parts = parts.slice(0, -1);
  }
  const out: Array<string | null> = [];
  for (let p of parts) {
    p = p.trim();
    if (!p) {
      out.push(null);
      continue;
    }
    if (p.startsWith("_") && p.length > 1) p = p.slice(1);
    out.push(p);
  }
  return out;
}

/** SMILES graph only — drop `` |$…$|`` / other CX trailers. */
export function smilesBase(smilesOrCx: string): string {
  if (!smilesOrCx) return "";
  const cut = smilesOrCx.split(/\s\|/, 1)[0];
  return (cut ?? smilesOrCx).trim();
}

const ORGANIC_TWO = new Set(["Cl", "Br"]);

/**
 * Atom indices in SMILES order (CX label slots / RDKit order for organic SMILES).
 * Returns indices of ``*`` / ``[*…]`` dummy atoms.
 */
export function smilesStarAtomIndices(smilesOrCx: string): number[] {
  const s = smilesBase(smilesOrCx);
  const stars: number[] = [];
  let atom = 0;
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === "[") {
      const end = s.indexOf("]", i + 1);
      if (end < 0) break;
      const inner = s.slice(i + 1, end);
      // Dummy / R-group atoms in brackets.
      if (
        inner === "*" ||
        inner.startsWith("*") ||
        /^R\d*/i.test(inner) ||
        inner.startsWith("_")
      ) {
        stars.push(atom);
      }
      atom += 1;
      i = end + 1;
      continue;
    }
    if (c === "*") {
      stars.push(atom);
      atom += 1;
      i += 1;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      const two = s.slice(i, i + 2);
      if (ORGANIC_TWO.has(two)) {
        atom += 1;
        i += 2;
        continue;
      }
      // Organic subset / aromatic single letter.
      atom += 1;
      i += 1;
      continue;
    }
    // Bonds, ring digits, parens, stereo, dots, etc.
    i += 1;
  }
  return stars;
}

/**
 * Labels for ``*`` atoms in encounter order — xpict ``star_labels`` option.
 * ``undefined`` when there is no CX label block (leave xpict defaults).
 */
export function starLabelsFromCxsmiles(
  smilesOrCx: string,
): Array<string | null> | undefined {
  const labels = cxAtomLabels(smilesOrCx);
  if (!labels.length) return undefined;
  const stars = smilesStarAtomIndices(smilesOrCx);
  if (!stars.length) return undefined;
  return stars.map((idx) => (idx < labels.length ? labels[idx] : null));
}
