import { PLOT_DOT_VIEW, plotDotCircles } from "~/utils/plotDot";
import { classNames } from "~/utils";

export type PlotDotProps = {
  /** Scalar in [0, 1] (metabolite score) or [-1, 1] with diverging. */
  value: number;
  /** SVG width/height in CSS pixels. */
  size?: number;
  /** Concentric levels (xenopict default 4). */
  levels?: number;
  diverging?: boolean;
  className?: string;
  title?: string;
};

/**
 * SVG plot-dot for a probability / score (port of xenopict PlotDot + xenosite cmap).
 * Solid opaque fills only — no alpha blending.
 */
export default function PlotDot({
  value,
  size = 120,
  levels = 4,
  diverging = false,
  className,
  title,
}: PlotDotProps) {
  const z = Number.isFinite(value) ? value : 0;
  const circles = plotDotCircles(z, { levels, diverging });
  const view = PLOT_DOT_VIEW;
  const cx = view / 2;
  const cy = view / 2;

  // Fixed CSS pixels — do not let the SVG stretch with its container.
  const px = `${size}px`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${view} ${view}`}
      preserveAspectRatio="xMidYMid meet"
      className={classNames("block shrink-0", className)}
      style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
      role="img"
      aria-label={title ?? `Score ${z.toFixed(2)}`}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {circles.map((c, i) => (
        <circle
          key={`${c.radius}-${c.color}-${i}`}
          cx={cx}
          cy={cy}
          r={c.radius}
          fill={c.fill}
        />
      ))}
    </svg>
  );
}
