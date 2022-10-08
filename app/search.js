import { backend_api } from "~/backend.server";

export async function resolve_query(query, model) {
  if (!query) return {};

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${query}/property/CanonicalSMILES/json`;

  const [backend, pubchem1] = await Promise.all([
    backend_api(query, "/v1/canonize"),
    fetch(url),
  ]);
  if (backend.smiles) return backend;

  const j1 = await pubchem1.json();
  const smiles = j1.PropertyTable?.Properties[0].CanonicalSMILES;

  if (smiles) return { name: query };

  return {};
}

export async function resolve_query_as_smiles(smiles, model) {
  if (!smiles) return [null, null];

  const url = model ? "/v0/" + model : "/v1/canonize";
  const [response, name_resolve] = await Promise.all([
    backend_api(smiles, url),
    resolve_smiles_name(smiles),
  ]);

  return [response, name_resolve];
}

export async function resolve_query_as_name(name, model) {
  if (!name) return [null, null];

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/CanonicalSMILES/json`;

  const pubchem1 = await fetch(url);
  const j1 = await pubchem1.json();
  const cid = j1.PropertyTable?.Properties[0].CID;
  const smiles = j1.PropertyTable?.Properties[0].CanonicalSMILES;
  const errmsg = j1.Fault?.Message;

  console.log(name);

  if (cid && smiles) {
    const pubchem_url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/json`;
    console.log("FETCH", pubchem_url);

    const model_url = model ? "/v0/" + model : "/v1/canonize";

    const [response, pubchem2] = await Promise.all([
      backend_api(smiles, model_url),
      fetch(pubchem_url),
    ]);

    j2 = await pubchem2.json();
    const description = j2.InformationList?.Information[1];

    return [response, { name, description, smiles, cid, errmsg }];
  }

  return [null, { name }];
}

async function resolve_smiles_name(smiles) {
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
