import { useEffect, useRef, useState } from "react";

type XpictLazyMetaboliteImgProps = {
  smiles: string;
  alt: string;
  className?: string;
  /**
   * Parent (current generation) SMILES — metabolites are template-aligned
   * to this frame via xpict `align_to`.
   */
  alignToSmiles?: string | null;
  /** Called when client depict fails (e.g. RDKit-invalid SMILES). */
  onDepictError?: (error: Error) => void;
};

/**
 * Lazy plain metabolite depiction via client-side xpict (no `/depict` proxy).
 * Aligns to {@link alignToSmiles} when provided.
 * Legacy server path: {@link LazyMetaboliteImg}.
 */
export default function XpictLazyMetaboliteImg({
  smiles,
  alt,
  className,
  alignToSmiles = null,
  onDepictError,
}: XpictLazyMetaboliteImgProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onErrorRef = useRef(onDepictError);
  onErrorRef.current = onDepictError;

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    import("~/utils/xpictClient.client")
      .then(({ paintSmiles }) =>
        paintSmiles(smiles, {
          ...(alignToSmiles ? { alignToSmiles } : {}),
        }),
      )
      .then((painted) => {
        if (cancelled) return;
        setSrc(
          "data:image/svg+xml;utf8," + encodeURIComponent(painted.svg),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error =
          err instanceof Error ? err : new Error(String(err ?? "xpict failed"));
        console.error(
          `[metabolite xpict] depict failed for SMILES ${smiles}`,
          error,
        );
        setFailed(true);
        onErrorRef.current?.(error);
      });

    return () => {
      cancelled = true;
    };
  }, [smiles, alignToSmiles]);

  if (failed) {
    return null;
  }

  if (!src) {
    return (
      <div
        className={`interactive-molecule ${className || ""}`.trim()}
        aria-hidden
      >
        <div className="h-[6.5rem] w-[8rem] animate-pulse bg-gray-50" />
      </div>
    );
  }

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
