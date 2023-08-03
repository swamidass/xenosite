import { useMatches, Link } from "remix";
import { Fragment, useRef } from "react";
import { Menu, Tab, Transition, Popover } from "@headlessui/react";
import { ChevronDownIcon, ArrowLongLeftIcon } from "@heroicons/react/20/solid";
import { MODELS } from "~/data";
import { classNames } from "../root";

export function ModelMenu({children}) {
  const matches = useMatches();
  // const buttonRef = useRef(null);
  // const timeoutDuration = 700;
  // let timeout;
  const model = matches[0].params?.model;
  const query = matches[0].params?.query;
  const modelinfo = MODELS.find((x) => x.path == model);

  // const closePopover = () => {
  //   return buttonRef.current?.dispatchEvent(
  //     new KeyboardEvent("keydown", {
  //       key: "Escape",
  //       bubbles: true,
  //       cancelable: true
  //     })
  //   )
  // }

  // const onMouseEnter = (open) => {
  //   clearTimeout(timeout)
  //   if (open) return
  //   return buttonRef.current?.click()
  // }

  // const onMouseLeave = (open) => {
  //   if (!open) return
  //   timeout = setTimeout(() => closePopover(), timeoutDuration)
  // }

  return (
    <div className="w-full px-2 py-16 sm:px-0">
      <Tab.Group
        as="div"
        selectedIndex={MODELS.findIndex((x) => x.path === model)}
      >
        <Tab.List className="flex space-x-1 rounded-xl p-1 mt-10 justify-center">
          {MODELS.map((x, i) => (

            // <Popover key={`popover-${i}`} className="relative">
            //   {({ open }) => {
            //     return (
            //       <>
            //         <div onMouseLeave={onMouseLeave.bind(null, open)}>
            //           <Popover.Button
            //             ref={buttonRef}
            //             className={`
            //             ${open ? "" : "text-opacity-90"}
            //             text-white group bg-orange-700 px-3 py-2 rounded-md inline-flex items-center text-base font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            //             onMouseEnter={onMouseEnter.bind(null, open)}
            //             onMouseLeave={onMouseLeave.bind(null, open)}
            //           >
                        <Tab as={Fragment} key={`tab-${i}`} 
                          className={({ selected }) =>
                            classNames(
                              x.path === model ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100",
                              "block px-4 py-2 text-sm"
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
            //           </Popover.Button>

            //           <Transition
            //             as={Fragment}
            //             enter="transition ease-out duration-200"
            //             enterFrom="opacity-0 translate-y-1"
            //             enterTo="opacity-100 translate-y-0"
            //             leave="transition ease-in duration-150"
            //             leaveFrom="opacity-100 translate-y-0"
            //             leaveTo="opacity-0 translate-y-1"
            //           >
            //             <Popover.Panel className="absolute z-10 w-screen max-w-sm px-4 mt-0 transform -translate-x-1/2 left-1/2 sm:px-0 lg:max-w-3xl">
            //               <div
            //                 className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
            //                 onMouseEnter={onMouseEnter.bind(null, open)}
            //                 onMouseLeave={onMouseLeave.bind(null, open)}
            //               >
            //                 <div className="relative grid gap-8 bg-white p-7 lg:grid-cols-2">
            //                   {x.info()}
            //                 </div>
            //               </div>
            //             </Popover.Panel>
            //           </Transition>
            //         </div>
            //       </>
            //     )
            //   }}
            // </Popover>
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
