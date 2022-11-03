import { useMatches, Link } from "remix";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, ArrowLongLeftIcon } from "@heroicons/react/20/solid";
import { MODELS } from "~/data";
import { classNames } from "../root";

export function ModelMenu() {
  const matches = useMatches();
  const model = matches[0].params?.model;
  const query = matches[0].params?.query;
  const modelinfo = MODELS.find((x) => x.path == model);

  return (
    <>
      <Menu
        as="div"
        className="relative inline-block align-bottom w-50 text-left"
      >
        <div className="w-50">
          <Menu.Button className="inline-flex w-50 text-left rounded-md border border-gray-300 bg-white px-4 py-2  font-medium shadow-sm hover:bg-gray-50 focus:outline-none ">
            {modelinfo?.model}
            <ChevronDownIcon
              className="-mr-1 ml-auto h-5 w-5"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {MODELS.map((x, i) => (
                <Menu.Item key={i}>
                  {({ active }) => (
                    <Link
                      to={`/${x.path}${
                        query ? "/" + encodeURIComponent(query) : ""
                      }`}
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "block px-4 py-2 text-sm"
                      )}
                    >
                      {x.model}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {model ? null : (
        <div className="inline-block whitespace-nowrap px-3 align-bottom py-2 text-sm text-red-400">
          <ArrowLongLeftIcon
            className="mx-1 h-5 w-5 inline"
            aria-hidden="true"
          />
          select model.
        </div>
      )}
    </>
  );
}
