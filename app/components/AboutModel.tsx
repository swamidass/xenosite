import { Disclosure } from "@headlessui/react";
import { Link } from "@remix-run/react";
import { MODELS, resolveModelInfo } from "~/data";

type AboutModelProps = {
  model?: string | null;
  /** Tighter styling when nested under a selected metabolite. */
  nested?: boolean;
};

/**
 * Collapsed-by-default model blurb — intentionally quiet under the tabs.
 */
export default function AboutModel({ model, nested = false }: AboutModelProps) {
  const modelinfo = resolveModelInfo(model) || MODELS.find((x) => x.path === model);
  if (!modelinfo || model === "_") return null;

  return (
    <Disclosure
      as="div"
      className={
        nested
          ? "max-w-prose mx-auto mt-1 mb-2 px-2"
          : "max-w-prose mx-auto mt-0 mb-2 px-2"
      }
      defaultOpen={false}
    >
      {({ open }) => (
        <>
          <Disclosure.Button className="mx-auto flex items-center gap-1 text-[11px] tracking-wide text-gray-400 hover:text-gray-600 py-0.5">
            <span>{open ? "Hide model info" : "Model info"}</span>
            <span aria-hidden className="text-gray-300">
              {open ? "▴" : "▾"}
            </span>
          </Disclosure.Button>
          <Disclosure.Panel className="prose prose-sm text-xs text-gray-600 pb-3 pt-1">
            <p className="font-medium text-gray-700 mt-0 mb-1">
              <Link
                className="no-underline hover:underline text-gray-700"
                to={`/${modelinfo.path}`}
                reloadDocument
              >
                {modelinfo.model}
              </Link>
            </p>
            {modelinfo.info ? <modelinfo.info /> : null}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
