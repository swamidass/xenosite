import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { MODELS } from "~/data";

import HEADERS from "~/headers";

// export function meta({ params }) {
//   const modelinfo = MODELS.find((x) => x.path == params.model);

//   if (!modelinfo) return {};

//   return {
//     "og:title": "XenoSite | " + modelinfo.model,
//     title: "XenoSite | " + modelinfo.model,
//   };
// }

export async function loader({ params: { model } }) {
  const modelinfo = MODELS.find((x) => x.path == model);

  if (!modelinfo && model != "_") {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return json({}, { headers: HEADERS });
}

export default function Model() {
  return <Outlet />;
}
