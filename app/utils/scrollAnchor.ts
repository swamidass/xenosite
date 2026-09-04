/**
 * Keep a layout anchor fixed in the viewport after a height-changing update
 * (e.g. metabolite grid filtering on SOM hover).
 */
export function compensateScrollForAnchorShift(
  previousTop: number | null | undefined,
  nextTop: number,
): number {
  if (previousTop == null || !Number.isFinite(previousTop)) return nextTop;
  if (!Number.isFinite(nextTop)) return previousTop;
  const delta = nextTop - previousTop;
  if (Math.abs(delta) < 0.5) return nextTop;
  if (typeof window !== "undefined") {
    window.scrollBy(0, delta);
  }
  return nextTop;
}
