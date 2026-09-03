import { Link, useLocation, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import { MODELS } from "~/data";
import { classNames } from "~/utils";
import {
  moleculeFocusUrl,
  parseMoleculeFocusPath,
} from "~/utils/metabolitePath";

export interface ModelMenuProps {
  children?: ReactNode;
  /** Path segments after model (root query + /m/ hops). Preserved across tab changes. */
  segments?: string[];
  /** Compact nested menu under a selected metabolite. */
  nested?: boolean;
}

export function ModelTabs({
  children,
  segments,
  nested = false,
}: ModelMenuProps): JSX.Element {
  const matches = useMatches();
  const location = useLocation();
  const leafParams = matches[matches.length - 1]?.params ?? {};
  const parsed = parseMoleculeFocusPath(location.pathname);
  const model = parsed?.model ?? leafParams.model;
  const segs =
    segments ??
    parsed?.segments ??
    (leafParams.query ? [leafParams.query] : []);
  const selectedIndex = MODELS.findIndex((x) => x.path === model);

  return (
    <div
      className={classNames(
        "w-full sm:px-0",
        nested ? "px-2 py-2" : "px-2 py-4",
      )}
    >
      <Tab.Group
        as="div"
        {...(selectedIndex >= 0 ? { selectedIndex } : {})}
      >
        <Tab.List
          className={classNames(
            "flex flex-wrap space-x-1 rounded-xl p-1 justify-center",
            nested && "bg-gray-50",
          )}
        >
          {MODELS.map((x, i) => (
            <div
              className={classNames(
                x.path === model
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100",
                nested
                  ? "block px-3 py-1.5 text-xs sm:m-0.5"
                  : "block px-4 py-2 text-sm sm:m-1",
              )}
              key={`tab-${nested ? "n" : "p"}-${i}`}
            >
              <Tab as={Fragment}>
                <Link
                  to={
                    segs.length
                      ? moleculeFocusUrl({ model: x.path, segments: segs })
                      : `/${x.path}`
                  }
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
                <Tab.Panel key={`tab-panel-${nested ? "n" : "p"}-${i}`}>
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
