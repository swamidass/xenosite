import { Outlet } from "remix";
import { MODELS } from "~/data";

export async function loader({ params: { model } }) {
  const modelinfo = MODELS.find((x) => x.path == model);

  if (!modelinfo) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return {};
}

export default function Model() {
  return <Outlet />;
}
