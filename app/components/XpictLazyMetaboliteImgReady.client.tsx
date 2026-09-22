import { readXpictPaint } from "~/utils/xpictPaintResource.client";

export type XpictLazyMetaboliteImgReadyProps = {
  smiles: string;
  alt: string;
  className?: string;
  alignToSmiles?: string | null;
};

/**
 * Browser-only metabolite paint. Suspends via {@link readXpictPaint}.
 * Must render under ClientOnly + Suspense (see XpictLazyMetaboliteImg).
 */
export default function XpictLazyMetaboliteImgReady({
  smiles,
  alt,
  className,
  alignToSmiles = null,
}: XpictLazyMetaboliteImgReadyProps) {
  const paint = readXpictPaint(smiles, {
    ...(alignToSmiles ? { alignToSmiles } : {}),
  });
  // charset=utf-8 helps browsers offer a proper .svg "Save image as…" name.
  const src =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(paint.svg);

  return (
    <div className={`interactive-molecule ${className || ""}`.trim()}>
      <img
        className="interactive-molecule__img"
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}
