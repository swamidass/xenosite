/**
 * Path helpers for molecule focus stacks:
 *   /{model}/{mol}
 *   /{model}/{mol}/{metabolite}
 *   /{model}/{mol}/{metabolite}/{model}/{mol}
 *
 * `{mol}` stub: `smiles` or `smiles;1,2` (optional `;bN` bond). SOM lives on the
 * owning generation's stub so the parent highlights without a child callback.
 * `{metabolite}`: `smiles;head;match` — pathway/score resolved from parent results.
 */

import { MODELS } from "~/data";

export type FocusGeneration = {
  model: string;
  /** Molecule identity for resolve_query (SMILES or name). */
  query: string;
  /** Selected SOM atom indices on this generation's mol stub. */
  som?: number[];
  /** Optional bond index on this generation's mol stub. */
  bondIdx?: number | null;
  /** Parent prediction head index (nested hops — from metabolite segment). */
  headIndex?: number | null;
  /**
   * When smiles+head+parent-som (CIP-aware) match several metabolites, which
   * match to use (0-based among matches, highest-score order).
   */
  matchIndex?: number | null;
};

export type MoleculeFocusPath = {
  /** Root model (generation 0). */
  model: string;
  /** Queries only (compat / search box). */
  segments: string[];
  /** Full stack including per-hop models. */
  generations: FocusGeneration[];
};

const MODEL_PATHS = new Set(MODELS.map((m) => m.path).concat("_"));

/** Nested hop with no model tab selected yet (canonize / identity only). */
export const UNSELECTED_MODEL_PATH = "_";

/** Max nested metabolite hops after the root (Gen 1…N). */
export const MAX_NESTED_HOPS = 4;

/** Max generations including root (depth 0…MAX_NESTED_HOPS). */
export const MAX_GENERATIONS = 1 + MAX_NESTED_HOPS;

export function isModelPath(s: string | null | undefined): boolean {
  return !!s && MODEL_PATHS.has(s);
}

/** True when a hop has a real prediction model (not `_` / empty). */
export function hasPredictionModel(model: string | null | undefined): boolean {
  return isModelPath(model) && model !== UNSELECTED_MODEL_PATH;
}

function encodeSeg(s: string) {
  return encodeURIComponent(s);
}

function decodeSeg(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Molecule stub: `smiles[;atoms][;bN]` — owned by that generation's route. */
export type MolStub = {
  smiles: string;
  som?: number[];
  bondIdx?: number | null;
};

function parseAtomList(raw: string): number[] {
  return raw
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b);
}

function parseBondPart(raw: string): number | null {
  if (!raw.startsWith("b")) return null;
  const n = Number(raw.slice(1));
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function parseMolStub(raw: string): MolStub {
  const decoded = decodeSeg(raw);
  const parts = decoded.split(";");
  const smiles = parts[0] || "";
  let som: number[] | undefined;
  let bondIdx: number | null = null;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const bond = parseBondPart(part);
    if (bond != null) {
      bondIdx = bond;
      continue;
    }
    if (/^[\d,]+$/.test(part)) {
      const atoms = parseAtomList(part);
      if (atoms.length) som = atoms;
    }
  }

  return {
    smiles,
    ...(som?.length ? { som } : {}),
    ...(bondIdx != null ? { bondIdx } : {}),
  };
}

export function encodeMolStub(stub: MolStub): string {
  const smiles = stub.smiles || "";
  const som =
    stub.som
      ?.filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b) || [];
  const somPart = som.length ? som.join(",") : "";
  const bondPart =
    stub.bondIdx != null && Number.isInteger(stub.bondIdx)
      ? `b${stub.bondIdx}`
      : "";
  if (!somPart && !bondPart) return smiles;
  if (!bondPart) return `${smiles};${somPart}`;
  if (!somPart) return `${smiles};${bondPart}`;
  return `${smiles};${somPart};${bondPart}`;
}

/**
 * Nested metabolite segment: `smiles;head;match`
 * Site comes from the parent mol stub, not this segment.
 */
export type MetaboliteSlug = {
  smiles: string;
  headIndex?: number | null;
  matchIndex?: number | null;
};

export function parseMetaboliteSlug(raw: string): MetaboliteSlug {
  const decoded = decodeSeg(raw);
  const [smiles = "", headPart, matchPart] = decoded.split(";");
  let headIndex: number | null = null;
  if (headPart != null && headPart !== "" && /^\d+$/.test(headPart)) {
    headIndex = Number(headPart);
  }
  let matchIndex: number | null = null;
  if (matchPart != null && matchPart !== "" && /^\d+$/.test(matchPart)) {
    matchIndex = Number(matchPart);
  }
  return { smiles, headIndex, matchIndex };
}

export function encodeMetaboliteSlug(slug: MetaboliteSlug): string {
  const smiles = slug.smiles || "";
  const hasHead =
    typeof slug.headIndex === "number" &&
    Number.isInteger(slug.headIndex) &&
    slug.headIndex >= 0;
  const hasMatch =
    typeof slug.matchIndex === "number" &&
    Number.isInteger(slug.matchIndex) &&
    slug.matchIndex > 0;
  if (!hasHead && !hasMatch) return smiles;
  const headPart = hasHead ? String(slug.headIndex) : "";
  if (!hasMatch) return `${smiles};${headPart}`;
  return `${smiles};${headPart};${slug.matchIndex}`;
}

function molStubSeg(g: FocusGeneration): string {
  return encodeSeg(
    encodeMolStub({
      smiles: g.query,
      som: g.som,
      bondIdx: g.bondIdx,
    }),
  );
}

function metaboliteSeg(g: FocusGeneration): string {
  return encodeSeg(
    encodeMetaboliteSlug({
      smiles: g.query,
      headIndex: g.headIndex,
      matchIndex: g.matchIndex,
    }),
  );
}

/**
 * Remix param names for a generation depth.
 * Root: model / query (mol stub).
 * Nested depth d≥1: met{d} / m{d} / q{d} (metabolite / model / mol stub).
 */
export function hopParamNames(depth: number): {
  model: string;
  query: string;
  met?: string;
} {
  if (depth <= 0) return { model: "model", query: "query" };
  return { met: `met${depth}`, model: `m${depth}`, query: `q${depth}` };
}

/** Remix route id for a nested predicting hop (has model+mol). */
export function hopRouteId(depth: number): string {
  if (depth <= 0) return "routes/_model.$model.$query";
  let id = "routes/_model.$model.$query";
  for (let d = 1; d <= depth; d++) {
    id += `.$met${d}.$m${d}.$q${d}`;
  }
  return id;
}

function generationFromMolStub(
  model: string,
  rawMol: string,
  edge?: Pick<FocusGeneration, "headIndex" | "matchIndex">,
): FocusGeneration {
  const mol = parseMolStub(rawMol);
  return {
    model,
    query: mol.smiles,
    ...(mol.som?.length ? { som: mol.som } : {}),
    ...(mol.bondIdx != null ? { bondIdx: mol.bondIdx } : {}),
    ...(edge
      ? {
          headIndex: edge.headIndex ?? null,
          matchIndex: edge.matchIndex ?? null,
        }
      : {}),
  };
}

/**
 * Build the generation stack from Remix route params (preferred over parsing).
 */
export function generationsFromParams(
  params: Record<string, string | undefined> | null | undefined,
): FocusGeneration[] {
  if (!params?.model || params.query == null || params.query === "") {
    return [];
  }
  const generations: FocusGeneration[] = [
    generationFromMolStub(params.model, params.query),
  ];
  for (let d = 1; d <= MAX_NESTED_HOPS; d++) {
    const metKey = `met${d}`;
    const metRaw = params[metKey];
    if (metRaw == null || metRaw === "") break;
    const met = parseMetaboliteSlug(metRaw);
    const mk = `m${d}`;
    const qk = `q${d}`;
    const m = params[mk];
    const q = params[qk];
    if (m != null && m !== "" && q != null && q !== "") {
      generations.push(
        generationFromMolStub(m, q, {
          headIndex: met.headIndex,
          matchIndex: met.matchIndex,
        }),
      );
    } else {
      generations.push({
        model: UNSELECTED_MODEL_PATH,
        query: met.smiles,
        headIndex: met.headIndex,
        matchIndex: met.matchIndex,
      });
      break;
    }
  }
  return generations;
}

/**
 * Parse a pathname into per-generation models + mol stubs + metabolite edges.
 */
export function parseMoleculeFocusPath(pathname: string): MoleculeFocusPath | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (!isModelPath(parts[0])) return null;

  const generations: FocusGeneration[] = [
    generationFromMolStub(parts[0], parts[1]),
  ];
  let i = 2;
  while (i < parts.length) {
    if (generations.length >= MAX_GENERATIONS) return null;
    const metRaw = parts[i++];
    // A bare trailing model path is an incomplete `/{model}/{mol}` pair.
    if (
      i >= parts.length &&
      isModelPath(metRaw) &&
      !metRaw.includes(";")
    ) {
      return null;
    }
    const met = parseMetaboliteSlug(metRaw);
    if (!met.smiles) return null;

    if (i < parts.length && isModelPath(parts[i]) && i + 1 < parts.length) {
      const model = parts[i++];
      const mol = parseMolStub(parts[i++]);
      generations.push({
        model,
        query: mol.smiles || met.smiles,
        som: mol.som,
        bondIdx: mol.bondIdx,
        headIndex: met.headIndex,
        matchIndex: met.matchIndex,
      });
    } else if (i >= parts.length) {
      generations.push({
        model: UNSELECTED_MODEL_PATH,
        query: met.smiles,
        headIndex: met.headIndex,
        matchIndex: met.matchIndex,
      });
    } else {
      return null;
    }
  }

  return {
    model: generations[0].model,
    segments: generations.map((g) => g.query),
    generations,
  };
}

export function moleculeFocusUrl(opts: {
  generations?: FocusGeneration[];
  /** @deprecated Prefer generations. Root model when using segments. */
  model?: string;
  /** @deprecated Prefer generations. Queries only (all share model). */
  segments?: string[];
  search?: string;
}): string {
  let generations = opts.generations;
  if (!generations?.length) {
    const model = opts.model || "";
    const segments = opts.segments || [];
    if (!segments.length) return model ? `/${model}` : "/";
    generations = segments.map((query) => ({ model, query }));
  }

  if (generations.length > MAX_GENERATIONS) {
    generations = generations.slice(0, MAX_GENERATIONS);
  }

  const root = generations[0];
  let path = `/${root.model}/${molStubSeg(root)}`;
  for (let i = 1; i < generations.length; i++) {
    const g = generations[i];
    path += `/${metaboliteSeg(g)}`;
    if (hasPredictionModel(g.model)) {
      path += `/${g.model}/${molStubSeg(g)}`;
    }
  }
  if (opts.search) {
    const q = opts.search.startsWith("?") ? opts.search : `?${opts.search}`;
    path += q;
  }
  return path;
}

/** True when another nested hop can be appended under `depth`. */
export function canAppendMetaboliteHop(depth: number): boolean {
  return depth + 1 <= MAX_NESTED_HOPS;
}

/**
 * Set the model at `depth` and drop every hop below it.
 * Changing a model clears metabolite / SOM selections nested under that hop.
 * For depth≥1, ensures a mol stub exists (smiles from the metabolite edge).
 */
export function withGenerationModel(
  generations: FocusGeneration[],
  depth: number,
  model: string,
): FocusGeneration[] {
  if (!generations.length) return [];
  const end = Math.max(0, Math.min(Math.floor(depth), generations.length - 1));
  return generations.slice(0, end + 1).map((g, i) => {
    if (i !== end) return g;
    return {
      ...g,
      model,
      // Keep smiles; clear som when swapping model at this hop.
      som: undefined,
      bondIdx: null,
    };
  });
}

export function focusQuery(segments: string[]): string {
  return segments[segments.length - 1] || "";
}

export type MetaboliteEdgeFields = {
  headIndex?: number | null;
  /** Applied to the parent generation's mol stub (site of formation). */
  site?: number[];
  matchIndex?: number | null;
};

function withParentSom(
  generations: FocusGeneration[],
  depth: number,
  site?: number[],
): FocusGeneration[] {
  if (!site?.length) return generations.slice(0, depth + 1);
  return generations.slice(0, depth + 1).map((g, i) =>
    i === depth
      ? {
          ...g,
          som: site
            .filter((n) => Number.isInteger(n) && n >= 0)
            .sort((a, b) => a - b),
        }
      : g,
  );
}

export function appendMetaboliteGeneration(
  generations: FocusGeneration[],
  metaboliteSmiles: string,
  model?: string,
  edge?: MetaboliteEdgeFields,
): FocusGeneration[] {
  if (generations.length >= MAX_GENERATIONS) return generations;
  const base = withParentSom(generations, generations.length - 1, edge?.site);
  const childModel = model || UNSELECTED_MODEL_PATH;
  return [
    ...base,
    {
      model: childModel,
      query: metaboliteSmiles,
      headIndex: edge?.headIndex ?? null,
      matchIndex: edge?.matchIndex ?? null,
      ...(hasPredictionModel(childModel)
        ? { som: undefined, bondIdx: null }
        : {}),
    },
  ];
}

/**
 * Select/replace the metabolite hop under `depth`.
 * Writes formation site onto the parent mol stub; metabolite segment is
 * smiles;head;match only. Replacing an existing child keeps that child's
 * prediction model when present.
 */
export function selectMetaboliteGeneration(
  generations: FocusGeneration[],
  depth: number,
  metaboliteSmiles: string,
  edge?: MetaboliteEdgeFields,
): FocusGeneration[] {
  const base = withParentSom(generations, depth, edge?.site);
  if (base.length >= MAX_GENERATIONS) return base;
  const existing = generations[depth + 1];
  const model =
    existing && hasPredictionModel(existing.model)
      ? existing.model
      : UNSELECTED_MODEL_PATH;
  return [
    ...base,
    {
      model,
      query: metaboliteSmiles,
      headIndex: edge?.headIndex ?? null,
      matchIndex: edge?.matchIndex ?? null,
      ...(hasPredictionModel(model) ? { som: undefined, bondIdx: null } : {}),
    },
  ];
}

/**
 * Set/clear SOM on this generation's mol stub and drop deeper hops.
 */
export function withGenerationSom(
  generations: FocusGeneration[],
  depth: number,
  som?: number[] | null,
  bondIdx?: number | null,
): FocusGeneration[] {
  if (!generations.length) return [];
  const end = Math.max(0, Math.min(Math.floor(depth), generations.length - 1));
  return generations.slice(0, end + 1).map((g, i) => {
    if (i !== end) return g;
    const atoms =
      som
        ?.filter((n) => Number.isInteger(n) && n >= 0)
        .sort((a, b) => a - b) || [];
    return {
      ...g,
      som: atoms.length ? atoms : undefined,
      bondIdx: bondIdx ?? null,
    };
  });
}

/** @deprecated Use appendMetaboliteGeneration. */
export function appendMetaboliteSegment(
  segments: string[],
  metaboliteSmiles: string,
): string[] {
  return [...segments, metaboliteSmiles];
}

export type SomSearchParams = {
  atomIdxs?: number[];
  bondIdx?: number | null;
  /**
   * Active prediction head for multi-head models (phase1, etc.).
   * URL form: `?head=0` or `?head=hydrolysis` (head filter without atoms).
   */
  head?: string | null;
};

/** Last segment of a dotted head model id (`phase1.hydrolysis` → `hydrolysis`). */
export function headSlug(model: string | null | undefined): string {
  if (!model) return "";
  const parts = String(model).split(".");
  return parts[parts.length - 1] || String(model);
}

/**
 * Resolve `?head=` to a results[] index.
 * Accepts a non-negative integer, a full model id, or a head slug suffix.
 */
export function resolveHeadIndex(
  head: string | null | undefined,
  results: { model?: string }[] | null | undefined,
): number | null {
  if (head == null || head === "") return null;
  const list = results || [];
  if (/^\d+$/.test(head)) {
    const i = Number(head);
    return i >= 0 && i < list.length ? i : null;
  }
  const byFull = list.findIndex((r) => r.model === head);
  if (byFull >= 0) return byFull;
  const bySlug = list.findIndex((r) => headSlug(r.model) === head);
  return bySlug >= 0 ? bySlug : null;
}

/** Prefer a stable slug in the URL when the head has a model id. */
export function encodeHeadParam(
  headIndex: number,
  results: { model?: string }[] | null | undefined,
): string {
  const r = results?.[headIndex];
  const slug = headSlug(r?.model);
  return slug || String(headIndex);
}

export function parseSomSearchParams(
  params: URLSearchParams,
): SomSearchParams {
  const atoms = params
    .getAll("atom")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b);
  const bondRaw = params.get("bond");
  const bondIdx =
    bondRaw != null && bondRaw !== "" && Number.isInteger(Number(bondRaw))
      ? Number(bondRaw)
      : null;
  const head = params.get("head");
  return {
    atomIdxs: atoms.length ? atoms : undefined,
    bondIdx,
    head: head || null,
  };
}

export function somToSearchParams(som: SomSearchParams): URLSearchParams {
  const p = new URLSearchParams();
  for (const a of som.atomIdxs || []) {
    p.append("atom", String(a));
  }
  if (som.bondIdx != null && Number.isInteger(som.bondIdx)) {
    p.set("bond", String(som.bondIdx));
  }
  if (som.head) {
    p.set("head", som.head);
  }
  return p;
}

/**
 * Model-tab navigations drop SOM search; formation lives in the path stub now.
 */
export function modelTabSearchFromLocation(
  _search: string | URLSearchParams,
): string {
  return "";
}

/** SMILES only from a mol stub param (for loaders / revalidate). */
export function smilesFromMolStubParam(
  raw: string | null | undefined,
): string {
  if (raw == null || raw === "") return "";
  return parseMolStub(raw).smiles || raw;
}
