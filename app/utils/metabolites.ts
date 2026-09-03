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

export const METABOLITE_SCORE_THRESHOLD = 0.05;
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

function groupByHead(
  list: MetaboliteRecord[],
): Map<number, MetaboliteRecord[]> {
  const map = new Map<number, MetaboliteRecord[]>();
  for (const m of list) {
    const h = typeof m.headIndex === "number" ? m.headIndex : 0;
    const arr = map.get(h);
    if (arr) arr.push(m);
    else map.set(h, [m]);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => scoreOf(b) - scoreOf(a));
  }
  return map;
}

/**
 * Unselected multi-head default: at least the best metabolite from every head
 * that has any, then fill remaining cap slots with next-best overall
 * (preferring scores ≥ threshold).
 */
function rankAcrossHeads(
  list: MetaboliteRecord[],
  threshold: number,
  cap: number,
): MetaboliteRecord[] {
  const byHead = groupByHead(list);
  if (byHead.size <= 1) {
    const above = list.filter((m) => scoreOf(m) >= threshold);
    return (above.length ? above : list).slice(0, cap);
  }

  const picked: MetaboliteRecord[] = [];
  const used = new Set<string>();

  // Best from each head (so every head is represented when possible).
  const headWinners = [...byHead.entries()]
    .map(([headIndex, mets]) => ({ headIndex, m: mets[0] }))
    .filter((x) => x.m)
    .sort((a, b) => scoreOf(b.m) - scoreOf(a.m));

  for (const { m } of headWinners) {
    if (picked.length >= cap) break;
    const key = `${m.headIndex ?? 0}:${m.smiles}`;
    if (used.has(key)) continue;
    used.add(key);
    picked.push(m);
  }

  // Fill remaining slots: prefer ≥ threshold, then any leftover by score.
  const rest = list
    .slice()
    .sort((a, b) => scoreOf(b) - scoreOf(a));
  const prefer = [
    ...rest.filter((m) => scoreOf(m) >= threshold),
    ...rest.filter((m) => scoreOf(m) < threshold),
  ];
  for (const m of prefer) {
    if (picked.length >= cap) break;
    const key = `${m.headIndex ?? 0}:${m.smiles}`;
    if (used.has(key)) continue;
    used.add(key);
    picked.push(m);
  }

  return picked;
}

export type RankMetabolitesResult = {
  shown: MetaboliteRecord[];
  totalMatching: number;
};

/**
 * Rank metabolites for display. Never returns more than `cap` entries.
 * Unselected multi-head: best from each head, then fill remaining slots.
 * Unselected single-head: threshold then top N.
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

  let list = metabolites || [];

  if (hasSiteSelection) {
    // Site filter across all heads; dedupe smiles to the best score.
    list = dedupeBySmiles(list).filter((m) => matchesSelection(m, selection));
    list.sort((a, b) => scoreOf(b) - scoreOf(a));
    let filtered = list;
    if (applyThreshold) {
      const above = list.filter((m) => scoreOf(m) >= threshold);
      if (above.length > 0) filtered = above;
      // else keep site-filtered list regardless of threshold
    }
    return {
      shown: filtered.slice(0, cap),
      totalMatching: filtered.length,
    };
  }

  // No site selection — keep per-head identity so every head can contribute.
  const shown = rankAcrossHeads(list, threshold, cap);
  // totalMatching: unique smiles after global dedupe for "how many exist" sense
  const totalMatching = dedupeBySmiles(list).length;
  return { shown, totalMatching };
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
