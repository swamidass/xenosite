import { generationMarkerLabel } from "~/utils/generationMarker";
import { classNames } from "~/utils";

export type GenerationBannerProps = {
  depth: number;
  className?: string;
};

/**
 * Full-bleed black bar announcing a generation split across the page.
 */
export default function GenerationBanner({
  depth,
  className,
}: GenerationBannerProps) {
  return (
    <div
      role="separator"
      aria-label={generationMarkerLabel(depth)}
      className={classNames(
        "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-black text-white",
        className,
      )}
    >
      <div className="max-w-screen-xl mx-auto px-3 py-2 text-center text-sm font-semibold tracking-wide">
        {generationMarkerLabel(depth)}
      </div>
    </div>
  );
}
