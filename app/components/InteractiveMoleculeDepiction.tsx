import { useCallback, useMemo, useRef, useState } from "react";
import {
  displayPointToSvg,
  parseDepictionMetadata,
  type DepictionMetadata,
} from "~/utils/moleculeSvg";
import {
  resolveHit,
  type SelectionMode,
  type SiteHit,
} from "~/utils/siteHitTest";
import {
  buildOverlayMarks,
  normalizeBondsIdx,
  somAtomRadius,
  somStrokeWidths,
  type SomHighlight,
} from "~/utils/somOverlay";

export type InteractiveMoleculeDepictionProps = {
  svg: string;
  alt: string;
  bondsIdx?: unknown;
  selectionMode?: SelectionMode;
  /** Controlled selected SOM (URL / path). */
  selected?: SomHighlight | null;
  /** External hover (e.g. metabolite card) — drawn as hover when no pointer hover. */
  externalHover?: SomHighlight | null;
  onSelect?: (hit: SiteHit | null) => void;
  onHover?: (hit: SiteHit | null) => void;
  className?: string;
};

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
 * Keeps API SVG as &lt;img&gt;; transparent overlay for SOM hit-test + highlights.
 * When depiction lacks embedded coords (API without embed_script), falls back to plain img.
 */
export default function InteractiveMoleculeDepiction({
  svg,
  alt,
  bondsIdx,
  selectionMode = "atom",
  selected = null,
  externalHover = null,
  onSelect,
  onHover,
  className,
}: InteractiveMoleculeDepictionProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [pointerHover, setPointerHover] = useState<SomHighlight | null>(null);

  const meta: DepictionMetadata | null = useMemo(
    () => parseDepictionMetadata(svg),
    [svg],
  );
  const bonds = useMemo(() => normalizeBondsIdx(bondsIdx), [bondsIdx]);
  const src = useMemo(
    () => "data:image/svg+xml;utf8," + encodeURIComponent(svg),
    [svg],
  );

  /** Overlay when we have coords — hit layer only if onSelect provided. */
  const showOverlay = !!meta;

  const localPoint = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      if (!img || !meta) return null;
      const rect = img.getBoundingClientRect();
      if (!(rect.width > 0) || !(rect.height > 0)) return null;
      return displayPointToSvg(
        clientX - rect.left,
        clientY - rect.top,
        { width: rect.width, height: rect.height },
        meta.viewBox,
      );
    },
    [meta],
  );

  const hitAt = useCallback(
    (clientX: number, clientY: number): SiteHit | null => {
      if (!meta) return null;
      const pt = localPoint(clientX, clientY);
      if (!pt) return null;
      return resolveHit(pt.x, pt.y, {
        coords: meta.coords,
        bondsIdx: bonds,
        scale: meta.scale,
        mode: selectionMode,
      });
    },
    [meta, localPoint, bonds, selectionMode],
  );

  const selectedMarks = useMemo(() => {
    if (!meta || !selected) return [];
    return buildOverlayMarks(selected, meta.coords, bonds);
  }, [meta, selected, bonds]);

  const hoverSource = pointerHover || externalHover;
  const hoverMarks = useMemo(() => {
    if (!meta || !hoverSource) return [];
    return buildOverlayMarks(hoverSource, meta.coords, bonds);
  }, [meta, hoverSource, bonds]);

  const vb = meta?.viewBox;

  return (
    <div className={`interactive-molecule ${className || ""}`.trim()}>
      <img
        ref={imgRef}
        className="interactive-molecule__img"
        src={src}
        alt={alt}
        draggable={false}
      />
      {showOverlay && vb ? (
        <svg
          className="som-overlay"
          viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <OverlayMarks marks={selectedMarks} scale={meta!.scale} tone="selected" />
          <OverlayMarks marks={hoverMarks} scale={meta!.scale} tone="hover" />
          {onSelect ? (
            <rect
              className="som-overlay__hit"
              x={vb.x}
              y={vb.y}
              width={vb.width}
              height={vb.height}
              fill="transparent"
              onPointerMove={(e) => {
                const hit = hitAt(e.clientX, e.clientY);
                setPointerHover(hitToHighlight(hit));
                onHover?.(hit);
              }}
              onPointerLeave={() => {
                setPointerHover(null);
                onHover?.(null);
              }}
              onClick={(e) => {
                const hit = hitAt(e.clientX, e.clientY);
                onSelect(hit);
              }}
            />
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
