import { useEffect, useState } from "react";

type LazyMetaboliteImgProps = {
  smiles: string;
  alt: string;
  className?: string;
};

/**
 * Lazy plain depiction for metabolite grid cards via /depict proxy.
 */
export default function LazyMetaboliteImg({
  smiles,
  alt,
  className,
}: LazyMetaboliteImgProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    const url = `/depict?${new URLSearchParams({ query: smiles })}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const svg = await res.text();
        if (cancelled) return;
        setSrc("data:image/svg+xml;utf8," + encodeURIComponent(svg));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [smiles]);

  if (failed) {
    return (
      <div
        className={`text-xs text-gray-400 text-center p-2 ${className || ""}`}
      >
        {smiles}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`min-h-[4rem] bg-gray-50 animate-pulse ${className || ""}`}
        aria-hidden
      />
    );
  }

  return (
    <img
      className={`max-w-full mx-auto ${className || ""}`}
      src={src}
      alt={alt}
      loading="lazy"
    />
  );
}
