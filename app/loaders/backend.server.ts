import "dotenv/config";
import type { QueryParameters } from "~/utils";

const XENOSITE_BACKEND =
  process.env.XENOSITE_BACKEND || `http://localhost:8000`;

const XENOSITE_BACKEND_KEY =
  process.env.XENOSITE_BACKEND_KEY || null;

const XENOSITE_HEADERS: { [key: string]: string } = {};

if (XENOSITE_BACKEND_KEY)
  XENOSITE_HEADERS["Authorization"] = "Bearer " + XENOSITE_BACKEND_KEY;

export type QueryResult = {
  resolved_query: any;
  model: string;
};

console.log("XENOSITE_BACKEND:", XENOSITE_BACKEND);
/**
 *
 * Call the XenoSite backend API
 *
 * @param smiles The SMILES string to send to the backend
 * @param url The URL to send the request to
 * @returns
 */
export const backend_api = async (smiles: string | null, url: string) => {
  if (!smiles) return {};

  const req =
    `${XENOSITE_BACKEND}${url}?` +
    new URLSearchParams({
      query: decodeURIComponent(smiles),
      depict: "true",
      detailed: "false",
    });
  console.log("Fetching " + req);

  return (await fetch(req, { headers: XENOSITE_HEADERS })).json().catch((_e) => null);
};

/**
 *
 * Submit a query to the XenoSite backend
 *
 * @param params QueryParameters The query parameters
 * @returns QueryResult
 */
export const resolve_query = async (
  params: QueryParameters,
): Promise<QueryResult> => {
  const { model, query } = params;
  const url = model != "_" ? "/v0/" + model : "/v1/canonize";
  let response = await backend_api(query, url);

  if (response && response.name && response.name.chebi) {
    const chebi_url = `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:${response.name.chebi.toString()}`;
    response.name["chebiUrl"] = chebi_url;
  }

  if (!response) response = {};

  return { resolved_query: response, model };
};
