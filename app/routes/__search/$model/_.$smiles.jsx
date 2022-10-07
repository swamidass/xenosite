import { backend_api } from "~/backend.server";
import { useLoaderData, json, redirect } from "remix";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

async function resolve_name(smiles) {
  var url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
    smiles
  )}/synonyms/json`;
  const pubchem1 = await fetch(url);
  console.log("GET", url);

  const j1 = await pubchem1.json();
  const cid = j1.InformationList?.Information[0].CID;
  const errmsg = j1.Fault?.Message;

  var out = { cid, errmsg };

  if (cid) {
    pubchem2 = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/json`
    );
    j2 = await pubchem2.json();
    const name = j2.InformationList.Information[0].Title;
    const description = j2.InformationList.Information[1];

    out = { name, description, ...out };
  }
  return out;
}

function last_name(name) {
  name = name.split(".");
  return name[name.length - 1];
}

export async function loader({ params }) {
  console.log(params.smiles);

  backend_call = backend_api(params.smiles, "/v0/" + params.model);
  name_resolution = resolve_name(params.smiles);

  const [response, resolved_name] = await Promise.all([
    backend_call,
    name_resolution,
  ]);
  const smiles = response?.smiles;
  if (smiles & (params.smiles != smiles))
    return redirect(`/${params.model}/_/` + encodeURIComponent(smiles));

  return json(
    {
      params,
      response,
      resolved_name,
    },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } }
  );
}

export default function Model() {
  const { response, resolved_name } = useLoaderData() || {};
  const results = response?.results || [];

  return (
    <div>
      <div>
        {resolved_name.name ? (
          <div>
            <h1 className="text-xl font-bold text-center">
              {resolved_name.name}
            </h1>
          </div>
        ) : null}
      </div>
      <div className="flex mx-auto my-10 justify-center flex-wrap">
        {results.map((r, i) => (
          <div key={i}>
            <div dangerouslySetInnerHTML={{ __html: r.depiction }} />
            {results.length > 1 ? (
              <div className="text-center">{last_name(r.model)}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="w-full pb-5">
        <a
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
          }}
          className="text-gray-300 w-fit hover:text-black  ml-auto block hover:underline cursor-pointer"
        >
          copy
        </a>
      </div>

      <div>
        {resolved_name.description ? (
          <div>
            {resolved_name.description.Description} [
            <a
              className="underline"
              href={resolved_name.description.DescriptionURL}
            >
              {resolved_name.description.DescriptionSourceName}
            </a>
            ]
          </div>
        ) : null}
      </div>
    </div>
  );
}
