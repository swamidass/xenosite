export { headers, default } from "~/routes/__search/_.$smiles";
import { resolve_query_as_name } from "~/search";
import { json } from "remix";

import HEADERS from "~/headers";

export async function loader({ params }) {
  const [response, resolved_name] = await resolve_query_as_name(
    params.name,
    params.model
  );

  return json(
    {
      params,
      response,
      resolved_name,
    },
    { headers: HEADERS }
  );
}
