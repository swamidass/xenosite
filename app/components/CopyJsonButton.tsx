import { useState } from "react";
import { classNames } from "~/utils";

export type CopyJsonButtonProps = {
  value: unknown;
  className?: string;
};

/**
 * Conventional "Copy JSON" control for API response payloads.
 */
export default function CopyJsonButton({
  value,
  className,
}: CopyJsonButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={classNames(
        "print:hidden text-xs text-gray-500 hover:text-gray-900 underline-offset-2 hover:underline cursor-copy",
        className,
      )}
      aria-label={copied ? "Copied JSON" : "Copy JSON"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            JSON.stringify(value, null, 2),
          );
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? "Copied" : "Copy JSON"}
    </button>
  );
}
