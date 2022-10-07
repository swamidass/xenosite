import { backend_api } from "~/backend.server";
import { useLoaderData, json, redirect } from "remix";

export function headers() {
  return {
    // "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export async function loader({ params }) {
  const response = await backend_api(params.smiles, "/v0/canonize");
  const smiles = response?.smiles;
  if (smiles && params.smiles != smiles)
    return redirect(`/${params.model}/_/` + encodeURIComponent(smiles));
  return json({
    params,
    response,
  });
}

export default function Model({ history }) {
  const { response, params } = useLoaderData() || {};
  const results = response?.results || [];

  return (
    <div>
      <div className="flex mx-auto my-20 justify-center flex-wrap">
        {response.depiction}
      </div>
    </div>
  );
}
