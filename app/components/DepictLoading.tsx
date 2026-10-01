import XDot from "~/components/XDot";
import { classNames } from "~/utils";

/**
 * Compact Suspense / ClientOnly fallback for a single molecule image slot
 * while xpict + RDKit WASM load or paint.
 */
export default function DepictLoading({
  className,
  label = "Loading structure",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={classNames("interactive-molecule", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="h-[6.5rem] w-[8rem] flex flex-col items-center justify-center gap-1.5 bg-gray-50">
        <div className="animate-ping">
          <XDot className="w-6 opacity-50" />
        </div>
        <span className="text-[10px] leading-none text-gray-400">Loading…</span>
      </div>
    </div>
  );
}
