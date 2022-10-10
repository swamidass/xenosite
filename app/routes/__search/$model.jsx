import { Outlet, json } from "remix";
import { MODELS } from "~/data";

import HEADERS from "~/headers";

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
