/**
 * Shared Remix outlet context for nested hops.
 * Formation site lives on each generation's own mol stub — no child→parent
 * SOM report callback.
 */

export type ChildFormationMeta = {
  pathway?: string | null;
  score?: number | null;
};

export type HopOutletContext = {
  /**
   * Parent fills pathway/score once the child's metabolite matches
   * (CIP-aware against parent som). Child reads this for identity chrome.
   */
  formationForChild?: ChildFormationMeta | null;
  /**
   * Parent molecule SMILES for xpict `align_to` on the child hop depiction.
   * Metabolite cards at this depth align to the *current* generation instead.
   */
  alignToSmiles?: string | null;
};

export const EMPTY_HOP_OUTLET_CONTEXT: HopOutletContext = {
  formationForChild: null,
  alignToSmiles: null,
};
