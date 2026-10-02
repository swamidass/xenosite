/**
 * Track an ``<img>`` content-box size (CSS shrink of large SVGs) and the
 * matching ``xMidYMid meet`` layout into a viewBox. Updates on resize/load.
 */
import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  displayLayout,
  type DisplayLayout,
  type SvgViewBox,
} from "~/utils/moleculeSvg";

export function useImgDisplayLayout(
  imgRef: RefObject<HTMLImageElement | null>,
  viewBox: SvgViewBox | null | undefined,
  /** Re-bind when the image source changes. */
  observeKey?: string,
): DisplayLayout | null {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const update = () => {
      const rect = img.getBoundingClientRect();
      setSize((prev) => {
        if (
          prev.width === rect.width &&
          prev.height === rect.height
        ) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    update();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    ro?.observe(img);
    img.addEventListener("load", update);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      img.removeEventListener("load", update);
      window.removeEventListener("resize", update);
    };
  }, [imgRef, observeKey]);

  return useMemo(() => {
    if (!viewBox || !(size.width > 0) || !(size.height > 0)) return null;
    if (!(viewBox.width > 0) || !(viewBox.height > 0)) return null;
    return displayLayout(size, viewBox);
  }, [size, viewBox]);
}
