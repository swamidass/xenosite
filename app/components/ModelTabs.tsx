import { Link, useMatches } from "@remix-run/react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import { MODELS } from "~/data";
import { classNames } from "~/utils";

export interface ModelMenuProps {
    children: ReactNode;
}

export function ModelTabs({ children }: ModelMenuProps): JSX.Element {
    const matches = useMatches();
    const { model, query } = matches[matches.length - 1]?.params ?? {};
    const selectedIndex = MODELS.findIndex((x) => x.path === model);

    return (
        <div className="w-full px-2 py-4 sm:px-0">
            <Tab.Group
                as="div"
                {...(selectedIndex >= 0 ? { selectedIndex } : {})}
            >
                <Tab.List className="flex flex-wrap space-x-1 rounded-xl p-1 justify-center">
                    {MODELS.map((x, i) => (
                        <div className={
                            classNames(
                                x.path === model ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100",
                                "block px-4 py-2 text-sm sm:m-1"
                            )
                        } key={`tab-${i}`}>
                            <Tab as={Fragment}>
                                <Link
                                    to={`/${x.path}${query ? "/" + encodeURIComponent(query) : ""}`}
                                >
                                    {x.model}
                                </Link>
                            </Tab>
                        </div>
                    ))}
                </Tab.List>
                {selectedIndex < 0 ? (
                    children
                ) : (
                    <Tab.Panels>
                        {MODELS.map((x, i) => (
                            <Tab.Panel key={`tab-panel-${i}`}>{children}</Tab.Panel>
                        ))}
                    </Tab.Panels>
                )}
            </Tab.Group>
        </div>
    );
}
