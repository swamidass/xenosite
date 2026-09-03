/**
 * Path helpers for molecule focus stacks:
 *   /{model}/{root}
 *   /{model}/{root}/m/{met1}/m/{met2}
 */

export type MoleculeFocusPath = {
  model: string;
  segments: string[];
};

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
 * Parse a pathname like /epoxidation/aspirin/m/CCO/m/CC into model + segments.
 */
export function parseMoleculeFocusPath(pathname: string): MoleculeFocusPath | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const model = parts[0];
  const segments: string[] = [decodeSeg(parts[1])];

  let i = 2;
  while (i < parts.length) {
    if (parts[i] !== "m" || i + 1 >= parts.length) return null;
    segments.push(decodeSeg(parts[i + 1]));
    i += 2;
  }

  return { model, segments };
}

export function moleculeFocusUrl(opts: {
  model: string;
  segments: string[];
  search?: string;
}): string {
  const { model, segments } = opts;
  if (!segments.length) return `/${model}`;
  let path = `/${model}/${encodeSeg(segments[0])}`;
  for (let i = 1; i < segments.length; i++) {
    path += `/m/${encodeSeg(segments[i])}`;
  }
  if (opts.search) {
    const q = opts.search.startsWith("?") ? opts.search : `?${opts.search}`;
    path += q;
  }
  return path;
}

export function focusQuery(segments: string[]): string {
  return segments[segments.length - 1] || "";
}

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
