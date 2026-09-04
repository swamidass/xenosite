import { useEffect, useRef, useState } from "react";

type LazyMetaboliteImgProps = {
  smiles: string;
  alt: string;
  className?: string;
  /** Called when /depict fails (e.g. RDKit-invalid SMILES). */
  onDepictError?: (error: Error) => void;
};

/**
 * Lazy plain depiction for metabolite cards via /depict proxy.
 * Uses the same CSS sizing as InteractiveMoleculeDepiction (intrinsic SVG size).
 */
export default function LazyMetaboliteImg({
  smiles,
  alt,
  className,
  onDepictError,
}: LazyMetaboliteImgProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const onErrorRef = useRef(onDepictError);
  onErrorRef.current = onDepictError;

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    const url = `/depict?${new URLSearchParams({ query: smiles })}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          let detail = "";
          try {
            detail = (await res.text()).slice(0, 200);
          } catch {
            /* ignore */
          }
          throw new Error(
            detail
              ? `depict ${res.status}: ${detail}`
              : `depict failed with status ${res.status}`,
          );
        }
        const svg = await res.text();
        if (cancelled) return;
        setSrc("data:image/svg+xml;utf8," + encodeURIComponent(svg));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error =
          err instanceof Error ? err : new Error(String(err ?? "depict failed"));
        console.error(
          `[metabolite depict] RDKit/depict failed for SMILES ${smiles}`,
          error,
        );
        setFailed(true);
        onErrorRef.current?.(error);
      });

    return () => {
      cancelled = true;
    };
  }, [smiles]);

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
