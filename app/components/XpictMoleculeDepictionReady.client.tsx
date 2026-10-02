import { useCallback, useMemo, useRef, useState } from "react";
import {
  displayPointToSvg,
  svgPointToDisplay,
  type SvgViewBox,
} from "~/utils/moleculeSvg";
import { resolveHit, type SiteHit } from "~/utils/siteHitTest";
import {
  buildOverlayMarks,
  normalizeBondsIdx,
  somAtomRadius,
  somStrokeWidths,
  type SomHighlight,
} from "~/utils/somOverlay";
import { shadeVector } from "~/utils/xpictShade";
import { readXpictPaint } from "~/utils/xpictPaintResource.client";
import { useImgDisplayLayout } from "~/utils/useImgDisplayLayout";
import type { XpictMoleculeDepictionProps } from "~/components/XpictMoleculeDepiction";

function hitToHighlight(hit: SiteHit | null): SomHighlight | null {
  if (!hit) return null;
  return {
    atomIdxs: hit.atomIdxs,
    bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
  };
}

function OverlayMarks({
  marks,
  scale,
  tone,
  displayScale,
}: {
  marks: ReturnType<typeof buildOverlayMarks>;
  scale: number;
  tone: "selected" | "hover";
  /** CSS shrink of the SVG (user units → display px). */
  displayScale: number;
}) {
  const strokes = somStrokeWidths(scale);
  const r = somAtomRadius(scale) * displayScale;
  return (
    <>
      {marks.map((m, i) => {
        const key = `${tone}-${i}`;
        return (
          <g key={key}>
            <circle
              className={`som-overlay__mark som-overlay__mark--${tone} som-overlay__mark--black`}
              cx={m.x}
              cy={m.y}
              r={r}
              strokeWidth={strokes.black * displayScale}
            />
            <circle
              className={`som-overlay__mark som-overlay__mark--${tone} som-overlay__mark--white`}
              cx={m.x}
              cy={m.y}
              r={r}
              strokeWidth={strokes.white * displayScale}
            />
          </g>
        );
      })}
    </>
  );
}

function marksToDisplay(
  marks: ReturnType<typeof buildOverlayMarks>,
  viewBox: SvgViewBox,
  layout: NonNullable<ReturnType<typeof useImgDisplayLayout>>,
) {
  return marks.map((m) => {
    const p = svgPointToDisplay(m.x, m.y, viewBox, layout);
    return { ...m, x: p.x, y: p.y };
  });
}

/**
 * Browser-only paint + SOM overlay. Suspends via {@link readXpictPaint}.
 * Must render under ClientOnly + Suspense (see XpictMoleculeDepiction).
 */
export default function XpictMoleculeDepictionReady({
  smiles,
  alt,
  atomScores,
  bondScores,
  bondsIdx,
  selectionMode = "atom",
  selected = null,
  externalHover = null,
  onSelect,
  onHover,
  className,
  color,
  alignToSmiles = null,
}: XpictMoleculeDepictionProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [pointerHover, setPointerHover] = useState<SomHighlight | null>(null);

  const atom_shade = useMemo(() => shadeVector(atomScores), [atomScores]);
  const bond_shade = useMemo(() => shadeVector(bondScores), [bondScores]);

  const paint = readXpictPaint(smiles, {
    ...(atom_shade ? { atom_shade } : {}),
    ...(bond_shade ? { bond_shade } : {}),
    ...(color ? { color } : {}),
    ...(alignToSmiles ? { alignToSmiles } : {}),
  });

  const apiBonds = useMemo(() => normalizeBondsIdx(bondsIdx), [bondsIdx]);
  const bonds = apiBonds.length ? apiBonds : paint.bondsIdx;
  const coords = paint.coords;
  const scale = paint.scale;
  const viewBox = useMemo<SvgViewBox>(
    () => ({ x: 0, y: 0, width: paint.width, height: paint.height }),
    [paint.width, paint.height],
  );
  const src =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(paint.svg);

  const layout = useImgDisplayLayout(imgRef, viewBox, src);

  const localPoint = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      if (!(rect.width > 0) || !(rect.height > 0)) return null;
      return displayPointToSvg(
        clientX - rect.left,
        clientY - rect.top,
        { width: rect.width, height: rect.height },
        viewBox,
      );
    },
    [viewBox],
  );

  const hitAt = useCallback(
    (clientX: number, clientY: number): SiteHit | null => {
      if (!coords.length) return null;
      const pt = localPoint(clientX, clientY);
      if (!pt) return null;
      return resolveHit(pt.x, pt.y, {
        coords,
        bondsIdx: bonds,
        scale,
        mode: selectionMode,
      });
    },
    [coords, localPoint, bonds, scale, selectionMode],
  );

  const selectedMarks = useMemo(() => {
    if (!selected) return [];
    return buildOverlayMarks(selected, coords, bonds);
  }, [coords, selected, bonds]);

  const hoverSource =
    onSelect || onHover ? pointerHover || externalHover : externalHover;
  const hoverMarks = useMemo(() => {
    if (!hoverSource) return [];
    if (
      selected &&
      selected.bondIdx === hoverSource.bondIdx &&
      selected.atomIdxs.length === hoverSource.atomIdxs.length &&
      selected.atomIdxs.every((a, i) => a === hoverSource.atomIdxs[i])
    ) {
      return [];
    }
    return buildOverlayMarks(hoverSource, coords, bonds);
  }, [coords, hoverSource, bonds, selected]);

  const selectedDisplay = useMemo(
    () => (layout ? marksToDisplay(selectedMarks, viewBox, layout) : []),
    [layout, selectedMarks, viewBox],
  );
  const hoverDisplay = useMemo(
    () => (layout ? marksToDisplay(hoverMarks, viewBox, layout) : []),
    [layout, hoverMarks, viewBox],
  );

  const interactive = !!(onSelect || onHover);

  // Hit-test on the <img> (not an overlay rect) so right-click "Save image as…"
  // still targets the SVG data URI.
  return (
    <div className={`interactive-molecule ${className || ""}`.trim()}>
      <img
        ref={imgRef}
        className="interactive-molecule__img"
        src={src}
        alt={alt}
        draggable={false}
        style={interactive && onSelect ? { cursor: "crosshair" } : undefined}
        onPointerMove={
          interactive
            ? (e) => {
                const hit = hitAt(e.clientX, e.clientY);
                setPointerHover(hitToHighlight(hit));
                onHover?.(hit);
              }
            : undefined
        }
        onPointerLeave={
          interactive
            ? () => {
                setPointerHover(null);
                onHover?.(null);
              }
            : undefined
        }
        onClick={
          onSelect
            ? (e) => {
                const hit = hitAt(e.clientX, e.clientY);
                onSelect(hit);
              }
            : undefined
        }
      />
      {layout ? (
        <svg
          className="som-overlay"
          width={layout.displayWidth}
          height={layout.displayHeight}
          aria-hidden
        >
          <OverlayMarks
            marks={selectedDisplay}
            scale={scale}
            tone="selected"
            displayScale={layout.scale}
          />
          <OverlayMarks
            marks={hoverDisplay}
            scale={scale}
            tone="hover"
            displayScale={layout.scale}
          />
        </svg>
      ) : null}
    </div>
  );
}
