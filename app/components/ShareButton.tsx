import { useCallback, useEffect, useState } from "react";

/**
 * Fixed lower-right share control. Prefers `navigator.share` (OS share sheet);
 * falls back to copying the URL when the Web Share API is unavailable.
 */
export default function ShareButton() {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 2500);
    return () => window.clearTimeout(t);
  }, [hint]);

  const share = useCallback(async () => {
    const url = window.location.href;
    const title = document.title || "XenoSite";
    const data: ShareData = { title, text: title, url };

    try {
      if (typeof navigator.share === "function") {
        if (
          typeof navigator.canShare === "function" &&
          !navigator.canShare(data)
        ) {
          const urlOnly: ShareData = { url };
          if (navigator.canShare(urlOnly)) {
            await navigator.share(urlOnly);
            return;
          }
        } else {
          await navigator.share(data);
          return;
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setHint("Link copied");
        return;
      }
      setHint("Copy this page URL to share");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.warn("[share]", err);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setHint("Link copied");
          return;
        }
      } catch {
        /* ignore */
      }
      setHint("Unable to share");
    }
  }, []);

  return (
    <div className="fixed right-0 bottom-0 z-50 p-4 flex flex-col items-end gap-2">
      {hint ? (
        <p
          role="status"
          className="rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
        >
          {hint}
        </p>
      ) : null}
      <button
        type="button"
        onClick={share}
        aria-label="Share this page"
        title="Share"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        {/* Standard share glyph: up arrow rising from a tray. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
    </div>
  );
}
