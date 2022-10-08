export { headers, default } from "~/routes/__search/_.$smiles";
import { resolve_query_as_name } from "~/search";

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
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } }
  );
}
