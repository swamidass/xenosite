import { Outlet, json } from "remix";
import { MODELS } from "~/data";

import HEADERS from "~/headers";

export function meta({ location, params }) {
  const modelinfo = MODELS.find((x) => x.path == params.model);

  console.log(params);
  return {
    charset: "utf-8",
    "og:title": "XenoSite | " + modelinfo.model,
    title: "XenoSite | " + modelinfo.model,
  };
}

export async function loader({ params: { model } }) {
  const modelinfo = MODELS.find((x) => x.path == model);

  if (!modelinfo) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return json({}, { headers: HEADERS });
}

export default function Model() {
  return <Outlet />;
}
