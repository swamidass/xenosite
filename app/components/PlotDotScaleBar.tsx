import { useMemo } from "react";
import { plotDotScaleBarSvg } from "~/utils/plotDot";
import { classNames } from "~/utils";

export type PlotDotScaleBarProps = {
  /** CSS pixel width of one full disc (r = 1). */
  size?: number;
  /** Concentric levels (xenopict default 4). */
  levels?: number;
  diverging?: boolean;
  /** Shade all 9 atoms (`scale.extra.xml`) instead of every other. */
  dense?: boolean;
  className?: string;
};

/**
 * Vertical PlotDot legend — port of xenopict `scale_bar` / `scale.xml`.
 *
 * Rendered as an `<img>` of SVG so the browser image menu can copy / save it.
 */
export default function PlotDotScaleBar({
  size = 32,
  levels = 4,
  diverging = false,
  dense = false,
  className,
}: PlotDotScaleBarProps) {
  const { src, alt, width, height } = useMemo(() => {
    const { svg, alt, width, height } = plotDotScaleBarSvg({
      size,
      levels,
      diverging,
      dense,
    });
    return {
      src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
      alt,
      width,
      height,
    };
  }, [size, levels, diverging, dense]);

  const pxW = `${width}px`;
  const pxH = `${height}px`;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={classNames("block shrink-0", className)}
      style={{ width: pxW, height: pxH, maxWidth: pxW, maxHeight: pxH }}
    />
  );
}
