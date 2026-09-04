import { Disclosure } from "@headlessui/react";
import { Link } from "@remix-run/react";
import { MODELS, resolveModelInfo } from "~/data";

type AboutModelProps = {
  model?: string | null;
};

/**
 * Collapsed-by-default model blurb — quiet under the tabs at every depth.
 */
export default function AboutModel({ model }: AboutModelProps) {
  const modelinfo = resolveModelInfo(model) || MODELS.find((x) => x.path === model);
  if (!modelinfo || model === "_") return null;

  return (
    <Disclosure
      as="div"
      className="max-w-prose mx-auto mt-0 mb-2 px-2"
      defaultOpen={false}
    >
      {({ open }) => (
        <>
          <Disclosure.Button className="mx-auto flex items-center gap-1 text-[11px] tracking-wide text-gray-500 hover:text-gray-700 py-1 min-h-[2rem]">
            <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500">
              i
            </span>
            <span>{open ? "Hide about this model" : "About this model"}</span>
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
