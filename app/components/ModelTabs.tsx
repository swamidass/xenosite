import { Link, useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import GenerationMarker from "~/components/GenerationMarker";
import { MODELS } from "~/data";
import { classNames } from "~/utils";
import {
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  withGenerationModel,
  type FocusGeneration,
} from "~/utils/metabolitePath";

export interface ModelMenuProps {
  children?: ReactNode;
  /** Full generation stack; tab changes only `depth`'s model. */
  generations?: FocusGeneration[];
  /** Which generation's model this menu controls (0 = root). */
  depth?: number;
  /** @deprecated Prefer generations. */
  segments?: string[];
}

export function ModelTabs({
  children,
  generations,
  depth = 0,
  segments,
}: ModelMenuProps): JSX.Element {
  const matches = useMatches();
  const location = useLocation();
  const leafParams = matches[matches.length - 1]?.params ?? {};
  const parsed = parseMoleculeFocusPath(location.pathname);
  const gens: FocusGeneration[] =
    generations ??
    parsed?.generations ??
    (segments?.length
      ? segments.map((query) => ({
          model: parsed?.model ?? leafParams.model ?? "",
          query,
        }))
      : leafParams.query
        ? [
            {
              model: leafParams.model ?? "",
              query: leafParams.query,
            },
          ]
        : []);
  const model = gens[depth]?.model ?? parsed?.model ?? leafParams.model;
  const selectedIndex = MODELS.findIndex((x) => x.path === model);
  const showGenMarker = depth > 0 || gens.length > 1;

  return (
    <div className="w-full px-2 py-3 sm:px-0">
      {showGenMarker ? (
        <div className="flex justify-center mb-2">
          <GenerationMarker depth={depth} label="Model" />
        </div>
      ) : null}
      <Tab.Group
        as="div"
        {...(selectedIndex >= 0 ? { selectedIndex } : {})}
      >
        <Tab.List className="flex flex-wrap gap-1 rounded-xl p-1 justify-center">
          {MODELS.map((x, i) => (
            <div
              className={classNames(
                x.path === model
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100",
                "block px-3 py-2 text-sm sm:px-4 sm:m-0.5 rounded-lg",
              )}
              key={`tab-p-${depth}-${i}`}
            >
              <Tab as={Fragment}>
                <Link
                  to={
                    gens.length
                      ? moleculeFocusUrl({
                          generations: withGenerationModel(
                            gens,
                            depth,
                            x.path,
                          ),
                        })
                      : `/${x.path}`
                  }
                  className="min-h-[2rem] inline-flex items-center"
                >
                  {x.model}
                </Link>
              </Tab>
            </div>
          ))}
        </Tab.List>
        {children != null ? (
          selectedIndex < 0 ? (
            children
          ) : (
            <Tab.Panels>
              {MODELS.map((x, i) => (
                <Tab.Panel key={`tab-panel-p-${depth}-${i}`}>
                  {children}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          )
        ) : null}
      </Tab.Group>
    </div>
  );
}
