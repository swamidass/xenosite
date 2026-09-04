/**
 * Path helpers for molecule focus stacks with per-generation models:
 *   /{model0}/{query0}
 *   /{model0}/{query0}/m/{model1}/{query1}/m/{model2}/{query2}
 *
 * Legacy hops without an explicit model (`/m/{query}`) inherit the previous
 * generation's model.
 */

import { MODELS } from "~/data";

export type FocusGeneration = {
  model: string;
  query: string;
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

export function isModelPath(s: string | null | undefined): boolean {
  return !!s && MODEL_PATHS.has(s);
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

/**
 * Parse a pathname into per-generation models + queries.
 */
export function parseMoleculeFocusPath(pathname: string): MoleculeFocusPath | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const generations: FocusGeneration[] = [
    { model: parts[0], query: decodeSeg(parts[1]) },
  ];

  let i = 2;
  while (i < parts.length) {
    if (parts[i] !== "m" || i + 1 >= parts.length) return null;
    const a = decodeSeg(parts[i + 1]);
    // /m/{model}/{query} when next token is a known model path and another seg follows
    if (isModelPath(a) && i + 2 < parts.length && parts[i + 2] !== "m") {
      generations.push({ model: a, query: decodeSeg(parts[i + 2]) });
      i += 3;
      continue;
    }
    // Legacy /m/{query} — inherit previous model
    generations.push({
      model: generations[generations.length - 1].model,
      query: a,
    });
    i += 2;
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

  const root = generations[0];
  let path = `/${root.model}/${encodeSeg(root.query)}`;
  for (let i = 1; i < generations.length; i++) {
    const g = generations[i];
    // Always emit explicit model for nested hops so models can differ.
    path += `/m/${g.model}/${encodeSeg(g.query)}`;
  }
  if (opts.search) {
    const q = opts.search.startsWith("?") ? opts.search : `?${opts.search}`;
    path += q;
  }
  return path;
}

/** Replace the model at `depth`; leave other generations unchanged. */
export function withGenerationModel(
  generations: FocusGeneration[],
  depth: number,
  model: string,
): FocusGeneration[] {
  return generations.map((g, i) => (i === depth ? { ...g, model } : g));
}

export function focusQuery(segments: string[]): string {
  return segments[segments.length - 1] || "";
}

export function appendMetaboliteGeneration(
  generations: FocusGeneration[],
  metaboliteSmiles: string,
  model?: string,
): FocusGeneration[] {
  const parent = generations[generations.length - 1];
  return [
    ...generations,
    { model: model || parent?.model || "", query: metaboliteSmiles },
  ];
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
   * URL form: `?head=0` (0-based results[] index) or `?head=hydrolysis`
   * (suffix / full id of results[i].model).
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

/** Attach pathway / score so nested hops can still show how the metabolite was ranked. */
export function withMetaboliteMetaParams(
  params: URLSearchParams,
  meta: { pathway?: string | null; score?: number | null },
): URLSearchParams {
  const p = new URLSearchParams(params);
  if (meta.pathway) p.set("pathway", String(meta.pathway));
  if (typeof meta.score === "number" && Number.isFinite(meta.score)) {
    p.set("score", meta.score.toFixed(2));
  }
  return p;
}

export function parseMetaboliteMetaParams(params: URLSearchParams): {
  pathway: string | null;
  score: number | null;
} {
  const pathway = params.get("pathway");
  const scoreRaw = params.get("score");
  const score =
    scoreRaw != null && scoreRaw !== "" && Number.isFinite(Number(scoreRaw))
      ? Number(scoreRaw)
      : null;
  return { pathway: pathway || null, score };
}
