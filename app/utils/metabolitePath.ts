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
};

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
  return {
    atomIdxs: atoms.length ? atoms : undefined,
    bondIdx,
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
  return p;
}
