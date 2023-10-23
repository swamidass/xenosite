import type { LoaderFunction, LoaderFunctionArgs, MetaArgs, MetaFunction} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import HEADERS from "~/loaders/headers";
import { MoleculeSummary } from "~/components";
import { resolve_query } from "~/loaders/backend.server";
import { MODELS } from "~/data";
import type { LdJsonParams} from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import type { SwamidassApiData} from "~/utils";
import { capitalize } from "~/utils";


export const meta: MetaFunction = ({ matches, params, data }: MetaArgs) => {
  const queryData = data as SwamidassApiData;

  // Get parent route's meta data & filter out changed fields
  // ref: https://remix.run/docs/en/main/route/meta#merging-with-parent-meta
  const parentMeta = matches
    .flatMap((match) => match.meta ?? [])
    .filter((meta) => !("title" in meta))
    .filter((meta) => !("script:ld+json" in meta))
    .filter((meta): meta is { name: string, content: string } => ("name" in meta &&
      (
        meta.name !== "og:title" &&
        meta.name !== "twitter:title" &&
        meta.name !== "description" &&
        meta.name !== "og:description" &&
        meta.name !== "twitter:description" && 
        meta.name !== "og:url" &&
        meta.name !== "og:image"&&
        meta.name !== "twitter:image"
      )
    ));
  // console.log(parentMeta)
  
  // Get new values for title, description, etc.
  const modelInfo = MODELS.find((x) => x.path == queryData.model);
  const molecule = queryData.resolved_query.name ? 
    capitalize(queryData.resolved_query.name.name) : 
    queryData.resolved_query.smiles;
  const title = modelInfo ? 
    `Xenosite | ${capitalize(queryData.model)} | ${molecule}` : 
    "Xenosite";
  const description = (
    queryData.resolved_query.name &&
    queryData.resolved_query.name.name &&
    modelInfo
  ) ?
    `XenoSite prediction of the reactivity of "${queryData.resolved_query.name.name}". The reactivity model is "${modelInfo.model}".` :
    "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  const url = `https://xenosite.org/${params.model}/${encodeURIComponent(params.query as string)}`;

  // Add changed results
  let results = [
    ... parentMeta,
    { title: title },
    { name: 'og:title', content: title },
    { name: 'twitter:title', content: title },
    { name: 'description', content: description },
    { name: 'og:description', content: description },
    { name: 'twitter:description', content: description },
    { name: 'og:url', content: url },
    { name: 'og:image', content: `${url}/0` },
    { name: 'twitter:image', content: `${url}/0` },
  ];

  // Add ld+json
  const ldJsonParams: LdJsonParams = {
    model: modelInfo ? 
      modelInfo.path as string : 
      params.model as string,
    smiles: queryData.resolved_query.smiles,
    name: queryData.resolved_query.name ?
      queryData.resolved_query.name.name :
      "",
    description: queryData.resolved_query.name ?
      queryData.resolved_query.name.description :
      description,
    xenositeUrl: url,
    citation: modelInfo ? 
      modelInfo.citation : "",
    chebi: queryData.resolved_query.name ?
      queryData.resolved_query.name.chebi.toString() :
      "",
    chebiUrl: queryData.resolved_query.name ?
      queryData.resolved_query.name.chebiUrl :
      "",
  }
  // console.log(ldJsonParams);
  const ldJson = getLdJson(ldJsonParams)
  if (ldJson.length > 0) {
    for (let i = 0; i < ldJson.length; i++) {
      results.push({
        "script:ld+json": ldJson[i]  // @ts-ignore
      });
    }
  }

  // console.log(results);
  return results
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).pathname.split("/");
  const pathModel = params[1];

  const { resolved_query, model } = await resolve_query({
    model: pathModel,
    query: params[2]
  });

  // console.log(`$query: ${resolved_query} $model: ${model} $params: ${params}`);
  return json(
    {
      params,
      resolved_query,
      model,
    },
    { headers: HEADERS }
  );
}

export default function Query() {
  const { resolved_query, model } = useLoaderData() || {};

  return <MoleculeSummary resolved_query={resolved_query} model={model} />;
}