import { Link, useLocation, useParams } from "@remix-run/react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import { MODELS } from "~/data";
import { classNames } from "~/utils";
import {
  generationsFromParams,
  moleculeFocusUrl,
  modelTabSearchFromLocation,
  parseMoleculeFocusPath,
  withGenerationModel,
  type FocusGeneration,
} from "~/utils/metabolitePath";

export interface ModelMenuProps {
  children?: ReactNode;
  /** Full generation stack; tab changes `depth`'s model and clears hops below. */
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
  const params = useParams();
  const location = useLocation();
  const fromParams = generationsFromParams(params);
  const parsed = parseMoleculeFocusPath(location.pathname);
  const gens: FocusGeneration[] =
    generations ??
    (fromParams.length
      ? fromParams
      : parsed?.generations?.length
        ? parsed.generations
        : segments?.length
          ? segments.map((query) => ({
              model: parsed?.model ?? params.model ?? "",
              query,
            }))
          : params.query
            ? [
                {
                  model: params.model ?? "",
                  query: params.query,
                },
              ]
            : []);
  const model = gens[depth]?.model ?? parsed?.model ?? params.model;
  const selectedIndex = MODELS.findIndex((x) => x.path === model);
  const tabSearch = modelTabSearchFromLocation(location.search);

  return (
    <div className="w-full px-2 py-3 sm:px-0">
      <Tab.Group as="div" selectedIndex={selectedIndex >= 0 ? selectedIndex : -1}>
        <Tab.List className="flex flex-wrap gap-1 justify-center">
          {MODELS.map((x, i) => {
            const selected = x.path === model;
            return (
              <Tab as={Fragment} key={`tab-p-${depth}-${i}`}>
                <Link
                  preventScrollReset
                  to={
                    gens.length
                      ? moleculeFocusUrl({
                          generations: withGenerationModel(
                            gens,
                            depth,
                            x.path,
                          ),
                          search: tabSearch || undefined,
                        })
                      : `/${x.path}`
                  }
                  aria-pressed={selected}
                  className={classNames(
                    "inline-flex items-center justify-center text-center text-xs min-h-[2rem] px-3 sm:px-4 rounded",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                    selected
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  {x.model}
                </Link>
              </Tab>
            );
          })}
        </Tab.List>
        {children != null ? (
          selectedIndex < 0 ? (
            children
          ) : (
            <Tab.Panels>
              {MODELS.map((_x, i) => (
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
