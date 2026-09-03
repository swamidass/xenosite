import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Loading } from "~/components";
import MoleculeFocus from "~/components/MoleculeFocus";
import { resolveModelInfo, type XenositeModelInfo } from "~/data";
import HEADERS from "~/loaders/headers";
import type { LdJsonParams } from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import { resolve_query } from "~/loaders/backend.server";
import type { SwamidassApiData } from "~/utils";
import {
  capitalize,
  commonMetaValues,
  SITE_NAME,
  MOLECULE_OG_IMAGE_WIDTH,
  MOLECULE_OG_IMAGE_HEIGHT,
  siteUrl,
} from "~/utils";
import {
  focusQuery,
  moleculeFocusUrl,
  parseMoleculeFocusPath,
} from "~/utils/metabolitePath";

function segmentsFromRequest(
  request: Request,
  params: Record<string, string | undefined>,
): string[] {
  const parsed = parseMoleculeFocusPath(new URL(request.url).pathname);
  if (parsed?.segments?.length) return parsed.segments;

  const root = params.query;
  if (!root) return [];

  const splat = params["*"];
  if (!splat) return [root];

  // splat is "smiles" or "smiles/m/smiles2/..." after /m/
  const parts = splat.split("/").filter(Boolean);
  const segments = [root];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "m") continue;
    try {
      segments.push(decodeURIComponent(parts[i]));
    } catch {
      segments.push(parts[i]);
    }
  }
  return segments;
}

export const meta: MetaFunction = ({ params, data, location }: MetaArgs) => {
  const queryData = data as
    | (SwamidassApiData & { segments?: string[] })
    | undefined;
  const segments =
    queryData?.segments ||
    parseMoleculeFocusPath(location.pathname)?.segments ||
    (params.query ? [params.query] : []);
  const focus = focusQuery(segments) || (params.query as string);
  const preferredName = queryData?.resolved_query?.name?.name;
  const path = moleculeFocusUrl({
    model: params.model as string,
    segments:
      preferredName && segments.length === 1
        ? [preferredName]
        : segments.length
          ? segments
          : [focus],
  });
  const slug = focus;
  const imageUrl = `${siteUrl(`/og/${params.model}/${encodeURIComponent(slug)}`)}`;

  const modelInfo = queryData
    ? resolveModelInfo(queryData.model)
    : resolveModelInfo(params.model);

  let molecule = focus;
  let title = `${SITE_NAME} | ${focus}`;
  let description =
    "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";

  if (queryData && modelInfo) {
    molecule = queryData.resolved_query.name
      ? capitalize(queryData.resolved_query.name.name)
      : queryData.resolved_query.smiles;
    title = `${SITE_NAME} | ${capitalize(queryData.model)} | ${molecule}`;
    description =
      queryData.resolved_query.name &&
      queryData.resolved_query.name.name &&
      modelInfo
        ? `XenoSite prediction of the reactivity of "${queryData.resolved_query.name.name}". The reactivity model is "${modelInfo.model}".`
        : description;
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
      smiles: queryData.resolved_query?.smiles
        ? queryData.resolved_query.smiles
        : focus,
      name: queryData.resolved_query?.name
        ? queryData.resolved_query.name.name
        : focus,
      description: queryData.resolved_query?.name
        ? queryData.resolved_query.name.description
        : description,
      xenositeUrl: siteUrl(path),
      ogImageUrl: imageUrl,
      citation: modelInfo ? modelInfo.citation : "",
      chebi: queryData.resolved_query?.name
        ? queryData.resolved_query.name.chebi.toString()
        : "",
      chebiUrl: queryData.resolved_query?.name
        ? queryData.resolved_query.name.chebiUrl
        : "",
      results: queryData.resolved_query?.results
        ? queryData.resolved_query.results.map((result) => result.model)
        : undefined,
    };
    for (const node of getLdJson(ldJsonParams)) {
      results.push({ "script:ld+json": node });
    }
  }

  return results;
};

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const segments = segmentsFromRequest(request, params as Record<string, string | undefined>);
  const focus = focusQuery(segments) || params.query || null;

  const { resolved_query, model } = await resolve_query({
    model: params.model || "",
    query: focus,
  });

  return json(
    {
      params,
      resolved_query,
      model,
      segments,
    },
    { headers: HEADERS },
  );
};

export default function MoleculeFocusRoute() {
  const data = useLoaderData() as {
    resolved_query: any;
    model: any;
    segments: string[];
  };

  if (!data?.resolved_query || !data?.model) {
    return <Loading />;
  }

  return (
    <MoleculeFocus
      resolved_query={data.resolved_query}
      model={data.model}
      segments={data.segments?.length ? data.segments : []}
    />
  );
}
