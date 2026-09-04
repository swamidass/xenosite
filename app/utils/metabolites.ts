export type MetaboliteRecord = {
  smiles: string;
  atom?: number[] | null;
  pathway?: string | null;
  score?: number | null;
  name?: {
    name?: string;
    chebi?: number | string;
    chebiUrl?: string;
    description?: string;
  } | null;
  depiction?: string | null;
  /** Result / head index this metabolite came from (multi-head models). */
  headIndex?: number;
  /** Result model id, e.g. phase1.hydrolysis */
  headModel?: string | null;
};

/**
 * Flatten metabolites from every prediction head, tagging source head index.
 */
export function collectMetabolites(
  results: any[] | null | undefined,
): MetaboliteRecord[] {
  const out: MetaboliteRecord[] = [];
  (results || []).forEach((r, headIndex) => {
    for (const m of r?.metabolite || []) {
      if (!m?.smiles) continue;
      out.push({
        ...(m as MetaboliteRecord),
        headIndex,
        headModel: typeof r?.model === "string" ? r.model : null,
      });
    }
  });
  return out;
}

export type SiteSelection = {
  atomIdxs?: number[];
  bondIdx?: number | null;
  metaboliteSmiles?: string | null;
};

export const METABOLITE_SCORE_THRESHOLD = 0.01;
export const METABOLITE_DISPLAY_CAP = 5;

/** `NitrogenOxidation` → `nitrogen oxidation`; already spaced labels pass through. */
export function formatPathwayLabel(pathway: string | null | undefined): string {
  if (!pathway) return "";
  return String(pathway)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scoreOf(m: MetaboliteRecord) {
  return typeof m.score === "number" && Number.isFinite(m.score) ? m.score : 0;
}

function dedupeBySmiles(list: MetaboliteRecord[]): MetaboliteRecord[] {
  const best = new Map<string, MetaboliteRecord>();
  for (const m of list) {
    const key = String(m.smiles || "");
    if (!key) continue;
    const prev = best.get(key);
    if (!prev || scoreOf(m) > scoreOf(prev)) {
      best.set(key, m);
    }
  }
  return [...best.values()];
}

function matchesSelection(
  m: MetaboliteRecord,
  selection?: SiteSelection | null,
): boolean {
  if (!selection) return true;
  if (selection.metaboliteSmiles) {
    return m.smiles === selection.metaboliteSmiles;
  }
  const atoms = selection.atomIdxs || [];
  if (!atoms.length) return true;
  const site = (m.atom || []).map(Number);
  return atoms.every((a) => site.includes(a));
}

export type RankMetabolitesResult = {
  shown: MetaboliteRecord[];
  totalMatching: number;
};

/**
 * Rank metabolites for display. Never returns more than `cap` entries.
 * Unselected: merge all heads, dedupe by SMILES, threshold, then top N by score.
 * Site-selected: filter then cap (drop threshold only if site would be empty).
 */
export function rankMetabolites(
  metabolites: MetaboliteRecord[] | null | undefined,
  options: {
    selection?: SiteSelection | null;
    applyThreshold?: boolean;
    threshold?: number;
    cap?: number;
  } = {},
): RankMetabolitesResult {
  const threshold = options.threshold ?? METABOLITE_SCORE_THRESHOLD;
  const cap = options.cap ?? METABOLITE_DISPLAY_CAP;
  const applyThreshold = options.applyThreshold !== false;
  const selection = options.selection;

  const hasSiteSelection =
    !!selection &&
    ((selection.atomIdxs && selection.atomIdxs.length > 0) ||
      !!selection.metaboliteSmiles);

  // Merge across heads (callers pass a flat list), then dedupe by SMILES.
  let list = dedupeBySmiles(metabolites || []);
  list = list.filter((m) => matchesSelection(m, selection));
  list.sort((a, b) => scoreOf(b) - scoreOf(a));

  let filtered = list;
  if (applyThreshold) {
    const above = list.filter((m) => scoreOf(m) >= threshold);
    // Unselected: always apply threshold. Site-selected: drop it only if empty.
    if (above.length > 0 || !hasSiteSelection) {
      filtered = above;
    }
  }

  return {
    shown: filtered.slice(0, cap),
    totalMatching: filtered.length,
  };
}

/**
 * Prefer the metabolite record matching `smiles` (highest score if duplicates).
 */
export function findMetaboliteBySmiles(
  metabolites: MetaboliteRecord[] | null | undefined,
  smiles: string | null | undefined,
): MetaboliteRecord | null {
  if (!smiles) return null;
  let best: MetaboliteRecord | null = null;
  for (const m of metabolites || []) {
    if (m.smiles !== smiles) continue;
    if (!best || scoreOf(m) > scoreOf(best)) best = m;
  }
  return best;
}
