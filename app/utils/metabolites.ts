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
};

export type SiteSelection = {
  atomIdxs?: number[];
  bondIdx?: number | null;
  metaboliteSmiles?: string | null;
};

export const METABOLITE_SCORE_THRESHOLD = 0.2;
export const METABOLITE_DISPLAY_CAP = 5;

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
 * Unselected: threshold then top N. Selected: filter by site, then cap
 * (drop threshold only if that would leave the site empty).
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

  let list = dedupeBySmiles(metabolites || []);
  list = list.filter((m) => matchesSelection(m, selection));
  list.sort((a, b) => scoreOf(b) - scoreOf(a));

  const hasSiteSelection =
    !!selection &&
    ((selection.atomIdxs && selection.atomIdxs.length > 0) ||
      selection.metaboliteSmiles);

  let filtered = list;
  if (applyThreshold) {
    const above = list.filter((m) => scoreOf(m) >= threshold);
    if (above.length > 0 || !hasSiteSelection) {
      filtered = above;
    }
    // else keep site-filtered list regardless of threshold
  }

  const totalMatching = filtered.length;
  return {
    shown: filtered.slice(0, cap),
    totalMatching,
  };
}
