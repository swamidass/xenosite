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
  /** Multi-head model: only metabolites from this results[] index. */
  headIndex?: number | null;
};

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

/** True when every selected atom appears exactly in the metabolite site. */
export function exactSiteMatch(
  site: number[],
  selected: number[],
): boolean {
  return selected.every((a) => site.includes(a));
}

/**
 * True when each selected atom can be assigned to a distinct site atom that is
 * the same index or CIP-rank equivalent (`atoms.cipRank` from detailed=true).
 */
export function siteAtomsMatch(
  site: number[],
  selected: number[],
  cipRank?: number[] | null,
): boolean {
  if (!selected.length) return true;
  if (!site.length) return false;
  if (!cipRank?.length) return exactSiteMatch(site, selected);

  const used = new Set<number>();
  for (const a of selected) {
    let found = -1;
    for (let i = 0; i < site.length; i++) {
      if (used.has(i)) continue;
      const b = site[i];
      if (a === b) {
        found = i;
        break;
      }
      const ra = cipRank[a];
      const rb = cipRank[b];
      if (
        typeof ra === "number" &&
        typeof rb === "number" &&
        Number.isFinite(ra) &&
        Number.isFinite(rb) &&
        ra === rb
      ) {
        found = i;
        break;
      }
    }
    if (found < 0) return false;
    used.add(found);
  }
  return true;
}

function matchesSelection(
  m: MetaboliteRecord,
  selection?: SiteSelection | null,
  cipRank?: number[] | null,
): boolean {
  if (!selection) return true;
  if (selection.metaboliteSmiles) {
    return m.smiles === selection.metaboliteSmiles;
  }
  if (
    typeof selection.headIndex === "number" &&
    m.headIndex !== selection.headIndex
  ) {
    return false;
  }
  const atoms = selection.atomIdxs || [];
  if (!atoms.length) return true;
  const site = (m.atom || []).map(Number);
  return siteAtomsMatch(site, atoms, cipRank);
}

/**
 * Dedupe by SMILES (highest score). When scores tie and a site selection is
 * present, prefer the record whose atoms exactly match the selection.
 */
function dedupeBySmiles(
  list: MetaboliteRecord[],
  selection?: SiteSelection | null,
): MetaboliteRecord[] {
  const preferAtoms = selection?.atomIdxs?.length
    ? selection.atomIdxs
    : null;
  const best = new Map<string, MetaboliteRecord>();
  for (const m of list) {
    const key = String(m.smiles || "");
    if (!key) continue;
    const prev = best.get(key);
    if (!prev) {
      best.set(key, m);
      continue;
    }
    const scoreDiff = scoreOf(m) - scoreOf(prev);
    if (scoreDiff > 0) {
      best.set(key, m);
      continue;
    }
    if (scoreDiff < 0 || !preferAtoms) continue;
    const siteNew = (m.atom || []).map(Number);
    const sitePrev = (prev.atom || []).map(Number);
    const exactNew = exactSiteMatch(siteNew, preferAtoms);
    const exactPrev = exactSiteMatch(sitePrev, preferAtoms);
    if (exactNew && !exactPrev) best.set(key, m);
  }
  return [...best.values()];
}

export type RankMetabolitesResult = {
  shown: MetaboliteRecord[];
  totalMatching: number;
};

/**
 * Rank metabolites for display. Never returns more than `cap` entries.
 * Merge heads, dedupe by SMILES, sort by score, then take the top N.
 * Optional site/head selection filters before ranking (CIP-aware when `cipRank`
 * is provided).
 */
export function rankMetabolites(
  metabolites: MetaboliteRecord[] | null | undefined,
  options: {
    selection?: SiteSelection | null;
    /** Per-atom CIP ranks from `atoms.cipRank` (detailed=true). */
    cipRank?: number[] | null;
    cap?: number;
  } = {},
): RankMetabolitesResult {
  const cap = options.cap ?? METABOLITE_DISPLAY_CAP;
  const selection = options.selection;
  const cipRank = options.cipRank;

  // Filter before dedupe so equivalent site records remain available to match,
  // then dedupe preferring an exact atom list for the selection when tied.
  let list = (metabolites || []).filter((m) =>
    matchesSelection(m, selection, cipRank),
  );
  list = dedupeBySmiles(list, selection);
  list.sort((a, b) => scoreOf(b) - scoreOf(a));

  return {
    shown: list.slice(0, cap),
    totalMatching: list.length,
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

export type FormationEdgeMatch = {
  smiles: string;
  /** Parent results[] head index. */
  headIndex?: number | null;
  /** Parent atom indices; matched with CIP topological equivalence when provided. */
  atomIdxs?: number[] | null;
  /**
   * Which match to pick when smiles+head+site yield several metabolites
   * (0-based among matches sorted by descending score).
   */
  matchIndex?: number | null;
};

function scoreOfMet(m: MetaboliteRecord) {
  return typeof m.score === "number" && Number.isFinite(m.score) ? m.score : 0;
}

/**
 * All parent metabolites matching smiles (+ optional head + CIP-aware site).
 * Ordered by descending score so matchIndex is stable.
 */
export function listFormationEdgeMatches(
  metabolites: MetaboliteRecord[] | null | undefined,
  edge: FormationEdgeMatch,
  cipRank?: number[] | null,
): MetaboliteRecord[] {
  let candidates = (metabolites || []).filter((m) => m.smiles === edge.smiles);
  if (!candidates.length) return [];

  if (typeof edge.headIndex === "number" && Number.isInteger(edge.headIndex)) {
    candidates = candidates.filter((m) => m.headIndex === edge.headIndex);
    if (!candidates.length) return [];
  }

  const atoms = edge.atomIdxs?.filter((n) => Number.isInteger(n) && n >= 0);
  if (atoms?.length) {
    // CIP-aware: site atoms need not be identical indices if ranks match.
    candidates = candidates.filter((m) =>
      siteAtomsMatch((m.atom || []).map(Number), atoms, cipRank),
    );
    if (!candidates.length) return [];
  }

  return [...candidates].sort((a, b) => scoreOfMet(b) - scoreOfMet(a));
}

/**
 * Match a child hop edge against the parent's metabolite list.
 * SMILES required; head + CIP-aware site narrow; matchIndex picks among ties.
 */
export function matchFormationEdge(
  metabolites: MetaboliteRecord[] | null | undefined,
  edge: FormationEdgeMatch,
  cipRank?: number[] | null,
): MetaboliteRecord | null {
  const matches = listFormationEdgeMatches(metabolites, edge, cipRank);
  if (!matches.length) return null;
  const idx =
    typeof edge.matchIndex === "number" &&
    Number.isInteger(edge.matchIndex) &&
    edge.matchIndex >= 0
      ? edge.matchIndex
      : 0;
  return matches[idx] || null;
}

export type ChildEdgeValidation =
  | { ok: true; metabolite: MetaboliteRecord }
  | { ok: false; reason: string };

/**
 * Late membership check: smiles (+ head + site, CIP-aware) must match a
 * parent metabolite; matchIndex must land on one of those matches.
 */
export function validateChildFormationEdge(
  parentMetabolites: MetaboliteRecord[] | null | undefined,
  edge: FormationEdgeMatch,
  cipRank?: number[] | null,
): ChildEdgeValidation {
  if (!edge.smiles) {
    return { ok: false, reason: "missing child SMILES" };
  }
  const matches = listFormationEdgeMatches(parentMetabolites, edge, cipRank);
  if (!matches.length) {
    const bits = [`smiles=${edge.smiles}`];
    if (typeof edge.headIndex === "number") bits.push(`head=${edge.headIndex}`);
    if (edge.atomIdxs?.length) bits.push(`site=${edge.atomIdxs.join(",")}`);
    return {
      ok: false,
      reason: `child edge not in parent metabolites (${bits.join("; ")})`,
    };
  }
  const idx =
    typeof edge.matchIndex === "number" &&
    Number.isInteger(edge.matchIndex) &&
    edge.matchIndex >= 0
      ? edge.matchIndex
      : 0;
  const metabolite = matches[idx];
  if (!metabolite) {
    return {
      ok: false,
      reason: `matchIndex=${idx} out of range (${matches.length} CIP-equivalent matches)`,
    };
  }
  return { ok: true, metabolite };
}

/**
 * Among metabolites shown in the panel that share this SMILES/head/site
 * (CIP-aware), return this record's matchIndex for the path slug.
 */
export function metaboliteMatchIndex(
  metabolites: MetaboliteRecord[] | null | undefined,
  target: MetaboliteRecord,
  cipRank?: number[] | null,
): number {
  const matches = listFormationEdgeMatches(
    metabolites,
    {
      smiles: target.smiles,
      headIndex: target.headIndex,
      atomIdxs: (target.atom || []).map(Number),
    },
    cipRank,
  );
  const i = matches.indexOf(target);
  return i >= 0 ? i : 0;
}
