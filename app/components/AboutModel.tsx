import { Disclosure } from "@headlessui/react";
import { Link } from "@remix-run/react";
import { MODELS, resolveModelInfo } from "~/data";

type AboutModelProps = {
  model?: string | null;
};

/**
 * Collapsed-by-default model description under ModelTabs.
 */
export default function AboutModel({ model }: AboutModelProps) {
  const modelinfo = resolveModelInfo(model) || MODELS.find((x) => x.path === model);
  if (!modelinfo || model === "_") return null;

  return (
    <Disclosure as="div" className="max-w-prose mx-auto my-4 px-2" defaultOpen={false}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full justify-between items-center text-left text-sm text-gray-600 hover:text-gray-900 py-2">
            <span>About this model</span>
            <span className="text-gray-400" aria-hidden>
              {open ? "−" : "+"}
            </span>
          </Disclosure.Button>
          <Disclosure.Panel className="prose text-sm pb-4">
            <h2 className="text-base font-semibold mt-0">
              <Link
                className="no-underline hover:underline"
                to={`/${modelinfo.path}`}
                reloadDocument
              >
                {modelinfo.model}
              </Link>
            </h2>
            {modelinfo.info ? <modelinfo.info /> : null}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
