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

  return response;
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

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/CanonicalSMILES/json`;

  const pubchem1 = await fetch(url);
  const j1 = await pubchem1.json();
  const cid = j1.PropertyTable?.Properties[0].CID;
  const smiles = j1.PropertyTable?.Properties[0].CanonicalSMILES;
  const errmsg = j1.Fault?.Message;

  if (cid && smiles) {
    const pubchem_url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/json`;
    console.log("FETCH", pubchem_url);

    const model_url = model != "_" ? "/v0/" + model : "/v1/canonize";

    const [response, pubchem2] = await Promise.all([
      backend_api(smiles, model_url),
      fetch(pubchem_url).catch((e) => ({ error: e.message })),
    ]);

    if (pubchem2) {
      const j2 = await pubchem2.json().catch(() => {});
      const description = j2?.InformationList?.Information[1];

      return [response, { name, description, smiles, cid, errmsg }];
    }
  }

  return [null, { name }];
}

async function resolve_smiles_name(smiles) {
  var url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
    smiles
  )}/synonyms/json`;

  console.log("FETCH", url);
  const pubchem1 = await fetch(url);

  const j1 = await pubchem1.json();
  const cid = j1.InformationList?.Information[0].CID;
  const errmsg = j1.Fault?.Message;

  var out = { cid, errmsg };

  if (cid) {
    console.log("FETCH", url);
    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/json`;
    var j2 = await fetch(url)
      .then((x) => x.json())
      .catch((x) => {});
    const name = j2.InformationList?.Information[0].Title;
    const description = j2.InformationList?.Information[1];

    out = { name, description, ...out };
  }
  return out;
}
