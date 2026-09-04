/**
 * True when the search box is navigating to a different root molecule.
 * Nested /m/ hops and SOM clicks keep the same draft query and must NOT
 * unmount the outlet (that looked like a full page reload).
 */
export function isSearchBoxNavigation(
  committedQuery: string | undefined,
  draftQuery: string | null | undefined,
  navigationState: string,
): boolean {
  return (
    navigationState !== "idle" &&
    !!draftQuery &&
    draftQuery !== (committedQuery || "")
  );
}

/**
 * Nested /m/* stack fingerprint (everything after the root hop).
 * Used to detect metabolite / nested-model prediction fetches.
 */
export function nestedStackKey(
  generations: { model: string; query: string }[] | undefined,
): string {
  return JSON.stringify((generations || []).slice(1));
}

/**
 * True while Remix is loading a nested metabolite hop or nested model change.
 * Search-param-only navigations (SOM / head) keep the same stack key and
 * must not replace the nested outlet with a spinner.
 */
export function isNestedPredictionNavigation(
  currentPathname: string,
  nextPathname: string | null | undefined,
  navigationState: string,
  parsePath: (
    pathname: string,
  ) => { generations: { model: string; query: string }[] } | null,
): boolean {
  if (navigationState === "idle" || !nextPathname) return false;
  const cur = parsePath(currentPathname);
  const next = parsePath(nextPathname);
  if (!cur || !next) return false;
  return nestedStackKey(cur.generations) !== nestedStackKey(next.generations);
}
