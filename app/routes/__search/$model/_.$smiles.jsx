import { backend_api } from "~/backend.server";
import { useLoaderData, json, redirect } from "remix";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

function last_name(name) {
  name = name.split(".");
  return name[name.length - 1];
}

export async function loader({ params }) {
  console.log(params.smiles);
  const response = await backend_api(params.smiles, "/v0/" + params.model);
  const smiles = response?.smiles;

  if (smiles & (params.smiles != smiles))
    return redirect(`/${params.model}/_/` + encodeURIComponent(smiles));
  return json(
    {
      params,
      response,
    },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } }
  );
}

export default function Model() {
  const { response, params } = useLoaderData() || {};
  const results = response?.results || [];

  return (
    <div>
      <div className="flex mx-auto my-20 justify-center flex-wrap">
        {results.map((r, i) => (
          <div key={i}>
            <div dangerouslySetInnerHTML={{ __html: r.depiction }} />
            {results.length > 1 ? (
              <div className="text-center">{last_name(r.model)}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="w-full">
        <a
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
          }}
          className="text-gray-300 w-fit hover:text-black  ml-auto block hover:underline cursor-pointer"
        >
          copy
        </a>
      </div>
    </div>
  );
}
