import { useMatches, Link } from "remix";
import { Fragment } from "react";
import { Tab } from "@headlessui/react";
import { MODELS } from "~/data";
import { classNames } from "../root";

export function ModelMenu({children}) {
  const matches = useMatches();
  const model = matches[0].params?.model;
  const query = matches[0].params?.query;
  // const modelinfo = MODELS.find((x) => x.path == model);

  return (
    <div className="w-full px-2 py-4 sm:px-0">
      <Tab.Group
        as="div"
        selectedIndex={MODELS.findIndex((x) => x.path === model)}
      >
        <Tab.List className="flex flex-wrap space-x-1 rounded-xl p-1 justify-center">
          {MODELS.map((x, i) => (
            <Tab as={Fragment} key={`tab-${i}`} 
              className={({ selected }) =>
                classNames(
                  x.path === model ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100",
                  "block px-4 py-2 text-sm sm:m-1"
                )
              }
            >
              <Link
                to={`/${x.path}${
                  query ? "/" + encodeURIComponent(query) : ""
                }`}
              >
                {x.model}
              </Link>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {MODELS.map((x, i) => (
            <Tab.Panel key={`tab-panel-${i}`}>{children}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
