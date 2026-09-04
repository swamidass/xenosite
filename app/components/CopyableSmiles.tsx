import { useState } from "react";
import { classNames } from "~/utils";

export const COPY_SMILES_HINT = "Copy to clipboard";
export const COPIED_SMILES_HINT = "Copied";

export type CopyableSmilesProps = {
  smiles: string;
  className?: string;
};

/**
 * Inline SMILES: hover hints copy, click writes to the clipboard.
 */
export default function CopyableSmiles({
  smiles,
  className,
}: CopyableSmilesProps) {
  const [copied, setCopied] = useState(false);
  const hint = copied ? COPIED_SMILES_HINT : COPY_SMILES_HINT;

  if (!smiles) return null;

  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      className={classNames(
        "font-mono text-[11px] sm:text-xs text-gray-600 break-all max-w-full",
        "hover:text-gray-900 cursor-copy underline-offset-2 hover:underline",
        "bg-transparent border-0 p-0 m-0 text-left",
        className,
      )}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(smiles);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {smiles}
    </button>
  );
}
