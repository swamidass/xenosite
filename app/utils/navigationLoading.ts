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
