import { Disclosure } from "@headlessui/react";
import CopyJsonButton from "~/components/CopyJsonButton";
import { moleculeDisplayName } from "~/utils/moleculeIdentity";
import { classNames } from "~/utils";

export type MoleculeIdentityProps = {
  resolved_query: {
    smiles?: string;
    name?: {
      name?: string;
      description?: string;
      chebi?: string | number;
      chebiUrl?: string;
    } | null;
    detail?: string;
  } | null;
  /** Include Copy JSON for this generation's API payload. */
  showCopy?: boolean;
  /** Root uses h1; nested generations use h2. */
  headingLevel?: 1 | 2;
  className?: string;
};

/**
 * Shared identity chrome for parent + selected metabolite generations.
 * Name is blank when unresolved (SMILES stays on its own line, never as the title).
 */
export default function MoleculeIdentity({
  resolved_query,
  showCopy = true,
  headingLevel = 1,
  className,
}: MoleculeIdentityProps) {
  if (!resolved_query || resolved_query.detail) return null;

  const displayName = moleculeDisplayName(resolved_query.name);
  const smiles = resolved_query.smiles || "";
  const description = resolved_query.name?.description;
  const chebi = resolved_query.name?.chebi;
  const chebiUrl = resolved_query.name?.chebiUrl;
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  if (!displayName && !smiles && !description) return null;

  return (
    <div
      className={classNames(
        "w-full max-w-prose mx-auto text-center px-2",
        className,
      )}
    >
      {displayName ? (
        <HeadingTag className="text-lg sm:text-xl font-bold text-gray-900 m-0 leading-snug">
          {displayName}
        </HeadingTag>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
        {smiles ? (
          <code
            className="font-mono text-[11px] sm:text-xs text-gray-600 break-all"
            title={smiles}
          >
            {smiles}
          </code>
        ) : null}
        {chebi && chebiUrl ? (
          <a
            className="underline text-gray-700 hover:text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
            href={chebiUrl}
          >
            CHEBI
          </a>
        ) : null}
        {showCopy ? <CopyJsonButton value={resolved_query} /> : null}
      </div>

      {description ? (
        <Disclosure as="div" className="mt-2 text-left" defaultOpen={false}>
          {({ open }) => (
            <>
              <Disclosure.Button className="mx-auto flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 py-0.5">
                <span>{open ? "Hide description" : "Description"}</span>
                <span aria-hidden className="text-gray-400">
                  {open ? "▴" : "▾"}
                </span>
              </Disclosure.Button>
              <Disclosure.Panel className="prose prose-sm max-w-none text-xs text-gray-600 pt-1 pb-1">
                <p className="m-0">{description}</p>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ) : null}
    </div>
  );
}
