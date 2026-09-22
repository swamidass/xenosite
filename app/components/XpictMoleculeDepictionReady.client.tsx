import { useCallback, useMemo, useRef, useState } from "react";
import { displayPointToSvg } from "~/utils/moleculeSvg";
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
}: {
  marks: ReturnType<typeof buildOverlayMarks>;
  scale: number;
  tone: "selected" | "hover";
}) {
  const strokes = somStrokeWidths(scale);
  const r = somAtomRadius(scale);
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
              strokeWidth={strokes.black}
            />
            <circle
              className={`som-overlay__mark som-overlay__mark--${tone} som-overlay__mark--white`}
              cx={m.x}
              cy={m.y}
              r={r}
              strokeWidth={strokes.white}
            />
          </g>
        );
      })}
    </>
  );
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
  const viewBox = { x: 0, y: 0, width: paint.width, height: paint.height };
  const src =
    "data:image/svg+xml;utf8," + encodeURIComponent(paint.svg);

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

  const interactive = !!(onSelect || onHover);

  return (
    <div className={`interactive-molecule ${className || ""}`.trim()}>
      <img
        ref={imgRef}
        className="interactive-molecule__img"
        src={src}
        alt={alt}
        draggable={false}
      />
      <svg
        className="som-overlay"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <OverlayMarks marks={selectedMarks} scale={scale} tone="selected" />
        <OverlayMarks marks={hoverMarks} scale={scale} tone="hover" />
        {interactive ? (
          <rect
            className="som-overlay__hit"
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.width}
            height={viewBox.height}
            fill="transparent"
            style={{ cursor: onSelect ? "crosshair" : "default" }}
            onPointerMove={(e) => {
              const hit = hitAt(e.clientX, e.clientY);
              setPointerHover(hitToHighlight(hit));
              onHover?.(hit);
            }}
            onPointerLeave={() => {
              setPointerHover(null);
              onHover?.(null);
            }}
            onClick={
              onSelect
                ? (e) => {
                    const hit = hitAt(e.clientX, e.clientY);
                    onSelect(hit);
                  }
                : undefined
            }
          />
        ) : null}
      </svg>
    </div>
  );
}
