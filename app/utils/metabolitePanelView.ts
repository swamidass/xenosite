/**
 * Pure view-model helpers for the expandable metabolite panel.
 */

export type MetabolitePanelChrome = {
  /** Show Show/Hide metabolites control. */
  showToggle: boolean;
  /** Render the ranked card grid. */
  showGrid: boolean;
  /** Show Clear while browsing a selection. */
  showClear: boolean;
  /** Label for the expand/collapse control. */
  toggleLabel: "Show metabolites" | "Hide metabolites" | null;
};

/**
 * Default expanded state when selection presence flips:
 * open with no selection; collapsed after the first select.
 * Replacing the selected metabolite should not use this to force-collapse
 * an already open browse grid (see MetabolitePanel effect deps).
 */
export function metabolitesExpandedByDefault(hasSelection: boolean): boolean {
  return !hasSelection;
}

/**
 * Chrome for the panel given selection + user expand state + whether any
 * ranked metabolites exist to show.
 */
export function metabolitePanelChrome(opts: {
  hasSelection: boolean;
  expanded: boolean;
  hasMetabolites: boolean;
}): MetabolitePanelChrome {
  const { hasSelection, expanded, hasMetabolites } = opts;
  const showGrid = (!hasSelection || expanded) && hasMetabolites;
  return {
    showToggle: hasSelection,
    showGrid,
    showClear: hasSelection && expanded,
    toggleLabel: hasSelection
      ? expanded
        ? "Hide metabolites"
        : "Show metabolites"
      : null,
  };
}
