import {
  generationMarkerLabel,
  generationSectionLabel,
} from "~/utils/generationMarker";
import { classNames } from "~/utils";

export type GenerationMarkerProps = {
  depth: number;
  /** Optional short name beside the gen index. */
  label?: string | null;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Cross-UI marker for metabolite generations (breadcrumb chips, section headers).
 */
export default function GenerationMarker({
  depth,
  label,
  className,
  size = "sm",
}: GenerationMarkerProps) {
  const gen = generationMarkerLabel(depth);
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white text-gray-700",
        size === "sm" ? "px-2 py-0.5 text-[10px] font-medium" : "px-2.5 py-1 text-xs font-medium",
        className,
      )}
      title={generationSectionLabel(depth)}
    >
      <span className="tabular-nums text-gray-500">{gen}</span>
      {label ? (
        <>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <span className="truncate max-w-[12rem] sm:max-w-[16rem]">{label}</span>
        </>
      ) : null}
    </span>
  );
}
