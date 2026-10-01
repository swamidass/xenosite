/**
 * Metabolic Rainbow backbone colors (Wong / Okabe–Ito), matching
 * xenosite-api `backbone_color_for_model` / xenosite-forest rulesets.
 *
 * Used as xpict `color` so Phase I multi-head depictions keep black shade
 * plot-dots but tint bond/label ink per reaction class.
 */

const FOREST_RAINBOW_HEX = {
  SO: "#D55E00",
  UO: "#E69F00",
  DH: "#009E73",
  HD: "#56B4E9",
  RD: "#CC79A7",
} as const;

const MODEL_RAINBOW_CLASS: Record<string, keyof typeof FOREST_RAINBOW_HEX> = {
  "phase1.stable_oxygenation": "SO",
  "phase1.unstable_oxygenation": "UO",
  "phase1.dehydrogenation": "DH",
  "phase1.hydrolysis": "HD",
  "phase1.reduction": "RD",
};

/** Forest Rainbow hex for a result model id, or undefined if none. */
export function backboneColorForModel(model: string | null | undefined): string | undefined {
  if (!model) return undefined;
  const rainbow = MODEL_RAINBOW_CLASS[model];
  if (!rainbow) return undefined;
  return FOREST_RAINBOW_HEX[rainbow];
}
