import { Parser as smilesParser } from "smiles-drawer";

export const resolve_query = async ({ model, query }) => {
  let response, resolved_name;

  if (check_smiles(query).err)
    [response, resolved_name] = await resolve_query_as_name(query, model);
  else {
    [response, resolved_name] = await resolve_query_as_smiles(query, model);
  }

  if (!response) response = {};
  response.resolved_name = resolved_name;

  return {resolved_query: response, model};
};

const XENOSITE_BACKEND =
  process.env.XENOSITE_BACKEND || `http://127.0.0.1:8000`;
function _backend_fetch(url) {
  console.log("FETCH " + url);
  return fetch(url);
}

const backend_api = async (smiles, url) => {
  return await _backend_fetch(
    `${XENOSITE_BACKEND}${url}?` +
      new URLSearchParams({
        smiles: smiles,
        depict: "true",
      })
  )
    .then((x) => x.json())
    .catch((e) => {});
};
function check_smiles(smiles) {
  // throws exception on invalid smiles
  try {
    smilesParser.parse(smiles);
  } catch (e) {
    return { err: e.message };
  }
  return {};
}

async function resolve_query_as_smiles(smiles, model) {
  if (!smiles) return [null, null];


  const url = model != "_" ? "/v0/" + model : "/v1/canonize";
  const [response, name_resolve] = await Promise.all([
    backend_api(smiles, url),
    resolve_smiles_name(smiles).catch((e) => ({ error: e.message })),
  ]);

  return [response, name_resolve];
}

async function resolve_query_as_name(name, model) {
  if (!name) return [null, null];

  const url = `http://localhost:8000/search/${name}`
  const pubchem1 = await fetch(url);
  const j = await pubchem1.json();

  if (j.message || !j.value.description) {
    errmsg = j.message ? j.message : "No molecule found";
    return [null, { name, errmsg }];
  }

  const cid = j.value.chebi;
  const smiles = j.value.smiles;
  const description = j.value.description;

  const model_url = model != "_" ? "/v0/" + model : "/v1/canonize";
  const response = await backend_api(smiles, model_url);

  if(response)
    return [response, { name, description, smiles, cid, errmsg }];

  return [null, { name }];
}

async function resolve_smiles_name(smiles) {
  var url = `http://localhost:8000/search/${encodeURIComponent(
    smiles
  )}`;

  const pubchem1 = await fetch(url);
  const j = await pubchem1.json();

  if (j.message || !j.value.description) {
    errmsg = j.message ? j.message : "No molecule found";
    return [null, { errmsg }];
  }

  const cid = j.value.chebi;
  const description = j.value.description;
  const name = j.value.name;
  let errmsg = j.message ? j.message : null;
  
  return { name, description, cid, smiles, errmsg };
}
