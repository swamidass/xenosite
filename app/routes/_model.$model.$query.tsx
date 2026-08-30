import type { LoaderFunction, LoaderFunctionArgs, MetaArgs, MetaFunction} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import HEADERS from "~/loaders/headers";
import { Loading, MoleculeSummary } from "~/components";
import { resolve_query } from "~/loaders/backend.server";
import { resolveModelInfo, XenositeModelInfo } from "~/data";
import type { LdJsonParams} from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import type { SwamidassApiData} from "~/utils";
import {
  capitalize,
  commonMetaValues,
  moleculePath,
  SITE_NAME,
  MOLECULE_OG_IMAGE_WIDTH,
  MOLECULE_OG_IMAGE_HEIGHT,
  siteUrl,
} from "~/utils";


export const meta: MetaFunction = ({ params, data }: MetaArgs) => {
  const queryData = data as SwamidassApiData | undefined;
  const requestedQuery = params.query as string;
  const preferredName = queryData?.resolved_query?.name?.name;
  const path = moleculePath(params.model as string, requestedQuery, preferredName);
  const slug = path.split("/").pop() || requestedQuery;
  const imageUrl = `${siteUrl(`/og/${params.model}/${slug}`)}`;

  const modelInfo = queryData ? resolveModelInfo(queryData.model) : resolveModelInfo(params.model);

  let molecule = requestedQuery;
  let title = `${SITE_NAME} | ${requestedQuery}`;
  let description = "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";

  if (queryData && modelInfo) {
    molecule = queryData.resolved_query.name ?
      capitalize(queryData.resolved_query.name.name) :
      queryData.resolved_query.smiles;
    title = `${SITE_NAME} | ${capitalize(queryData.model)} | ${molecule}`;
    description = (
      queryData.resolved_query.name &&
      queryData.resolved_query.name.name &&
      modelInfo
    ) ?
      `XenoSite prediction of the reactivity of "${queryData.resolved_query.name.name}". The reactivity model is "${modelInfo.model}".` :
      "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  }

  const results: any[] = [
    ...commonMetaValues({
      title,
      description,
      path,
      image: imageUrl,
      imageWidth: MOLECULE_OG_IMAGE_WIDTH,
      imageHeight: MOLECULE_OG_IMAGE_HEIGHT,
    }),
  ];

  if (queryData) {
    const ldJsonParams: LdJsonParams = {
      model: modelInfo as XenositeModelInfo,
      smiles: queryData.resolved_query?.smiles ?
        queryData.resolved_query.smiles :
        requestedQuery,
      name: queryData.resolved_query?.name ?
        queryData.resolved_query.name.name :
        requestedQuery,
      description: queryData.resolved_query?.name ?
        queryData.resolved_query.name.description :
        description,
      xenositeUrl: siteUrl(path),
      ogImageUrl: imageUrl,
      citation: modelInfo ?
        modelInfo.citation : "",
      chebi: queryData.resolved_query?.name ?
        queryData.resolved_query.name.chebi.toString() :
        "",
      chebiUrl: queryData.resolved_query?.name ?
        queryData.resolved_query.name.chebiUrl :
        "",
      results: queryData.resolved_query?.results ?
        queryData.resolved_query.results.map((result) => result.model) :
        undefined,
    }
    for (const node of getLdJson(ldJsonParams)) {
      results.push({ "script:ld+json": node });
    }
  }

  return results;
}

export const loader: LoaderFunction = async ({ params }: LoaderFunctionArgs) => {
  const { resolved_query, model } = await resolve_query({
    model: params.model || "",
    query: params.query || null // add null check here
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
  const { resolved_query, model } = 
    useLoaderData() as { resolved_query: any, model: any } || 
    { resolved_query: null, model: null };

  return (
    <>
      {resolved_query && model ? (
        <MoleculeSummary resolved_query={resolved_query} model={model} />
      ) : (
        <Loading />
      )}
    </>
  );
}