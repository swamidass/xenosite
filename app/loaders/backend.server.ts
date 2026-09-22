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

export type BackendQueryOptions = {
  /**
   * When true, ask the API for SVG depictions.
   * Default false — interactive UI paints with client xpict.
   * Open Graph still sets this true until server xpict is wired on Vercel.
   */
  depict?: boolean;
};

/** Query string for prediction / canonize requests. */
export function backendQueryParams(
  smiles: string,
  options: BackendQueryOptions = {},
): URLSearchParams {
  return new URLSearchParams({
    query: decodeURIComponent(smiles),
    depict: options.depict ? "true" : "false",
    // atoms.cipRank for topological equivalence when matching pair sites.
    detailed: "true",
    // Forest metabolites for the site panel (capped/ranked in the UI).
    metabolites: "true",
  });
}

/**
 *
 * Call the XenoSite backend API
 *
 * @param smiles The SMILES string to send to the backend
 * @param url The URL to send the request to
 * @returns
 */
export const backend_api = async (
  smiles: string | null,
  url: string,
  options: BackendQueryOptions = {},
) => {
  if (!smiles) return {};

  const req = `${XENOSITE_BACKEND}${url}?` + backendQueryParams(smiles, options);
  console.log("Fetching " + req);

  return (await fetch(req, { headers: XENOSITE_HEADERS })).json().catch((_e) => null);
};

export type ResolveQueryParams = QueryParameters & BackendQueryOptions;

/**
 *
 * Submit a query to the XenoSite backend
 *
 * @param params QueryParameters The query parameters
 * @returns QueryResult
 */
export const resolve_query = async (
  params: ResolveQueryParams,
): Promise<QueryResult> => {
  const { model, query, depict = false } = params;
  const url = model != "_" ? "/v1/" + model : "/v1/canonize";
  let response = await backend_api(query, url, { depict });

  if (response && response.name && response.name.chebi) {
    const chebi_url = `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:${response.name.chebi.toString()}`;
    response.name["chebiUrl"] = chebi_url;
  }

  // Best-effort metabolite name links when API attaches name.chebi
  if (response?.results) {
    for (const r of response.results) {
      for (const m of r.metabolite || []) {
        if (m?.name?.chebi && !m.name.chebiUrl) {
          m.name.chebiUrl = `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:${m.name.chebi.toString()}`;
        }
      }
    }
  }

  if (!response) response = {};

  return { resolved_query: response, model };
};
