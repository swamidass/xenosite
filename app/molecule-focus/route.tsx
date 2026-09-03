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
    | (SwamidassApiData & { segments?: string[]; chain?: any[] })
    | undefined;
  const segments =
    queryData?.segments ||
    parseMoleculeFocusPath(location.pathname)?.segments ||
    (params.query ? [params.query] : []);
  const rootQuery = segments[0] || (params.query as string);
  const rootResolved =
    queryData?.chain?.[0] || queryData?.resolved_query;
  const preferredName = rootResolved?.name?.name;
  const path = moleculeFocusUrl({
    model: params.model as string,
    segments:
      preferredName && segments.length === 1
        ? [preferredName]
        : segments.length
          ? segments
          : [rootQuery],
  });
  const imageUrl = `${siteUrl(`/og/${params.model}/${encodeURIComponent(rootQuery)}`)}`;

  const modelInfo = queryData
    ? resolveModelInfo(queryData.model)
    : resolveModelInfo(params.model);

  let molecule = rootQuery;
  let title = `${SITE_NAME} | ${rootQuery}`;
  let description =
    "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";

  if (rootResolved && modelInfo) {
    molecule = rootResolved.name
      ? capitalize(rootResolved.name.name)
      : rootResolved.smiles;
    title = `${SITE_NAME} | ${capitalize(queryData!.model)} | ${molecule}`;
    description =
      rootResolved.name && rootResolved.name.name && modelInfo
        ? `XenoSite prediction of the reactivity of "${rootResolved.name.name}". The reactivity model is "${modelInfo.model}".`
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

  if (queryData && rootResolved) {
    const ldJsonParams: LdJsonParams = {
      model: modelInfo as XenositeModelInfo,
      smiles: rootResolved.smiles ? rootResolved.smiles : rootQuery,
      name: rootResolved.name ? rootResolved.name.name : rootQuery,
      description: rootResolved.name
        ? rootResolved.name.description
        : description,
      xenositeUrl: siteUrl(path),
      ogImageUrl: imageUrl,
      citation: modelInfo ? modelInfo.citation : "",
      chebi: rootResolved.name ? rootResolved.name.chebi.toString() : "",
      chebiUrl: rootResolved.name ? rootResolved.name.chebiUrl : "",
      results: rootResolved.results
        ? rootResolved.results.map((result: any) => result.model)
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
  const segments = segmentsFromRequest(
    request,
    params as Record<string, string | undefined>,
  );
  const model = params.model || "";

  // One prediction per path segment so the stack can keep parents on-screen.
  const chain = [];
  for (const seg of segments) {
    const { resolved_query } = await resolve_query({
      model,
      query: seg,
    });
    chain.push(resolved_query);
  }

  return json(
    {
      params,
      model,
      segments,
      chain,
      // Back-compat for any consumers expecting resolved_query (= root).
      resolved_query: chain[0] || {},
    },
    { headers: HEADERS },
  );
};

export default function MoleculeFocusRoute() {
  const data = useLoaderData() as {
    chain: any[];
    model: string;
    segments: string[];
  };

  if (!data?.chain?.length || !data?.model) {
    return <Loading />;
  }

  return (
    <MoleculeFocus
      chain={data.chain}
      model={data.model}
      segments={data.segments?.length ? data.segments : []}
    />
  );
}
