import type {
  LoaderFunctionArgs,
  MetaArgs,
  MetaFunction,
  ShouldRevalidateFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Loading } from "~/components";
import { MoleculeFocusRootLayout } from "~/components/MoleculeFocus";
import { resolveModelInfo, type XenositeModelInfo } from "~/data";
import HEADERS from "~/loaders/headers";
import type { LdJsonParams } from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import { resolve_query } from "~/loaders/backend.server";
import {
  capitalize,
  commonMetaValues,
  SITE_NAME,
  MOLECULE_OG_IMAGE_WIDTH,
  MOLECULE_OG_IMAGE_HEIGHT,
  siteUrl,
} from "~/utils";
import {
  moleculeFocusUrl,
  parseMoleculeFocusPath,
} from "~/utils/metabolitePath";

export type RootMoleculeLoaderData = {
  model: string;
  query: string;
  resolved_query: any;
};

/** Root molecule only — nested /m/* hops load in the child route. */
export async function loader({ params }: LoaderFunctionArgs) {
  const model = params.model || "";
  const query = params.query || "";
  const { resolved_query } = await resolve_query({ model, query });
  return json(
    { model, query, resolved_query: resolved_query || {} } satisfies RootMoleculeLoaderData,
    { headers: HEADERS },
  );
}

/**
 * Skip refetch when only nested /m/* hops or search params change.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
}) => shouldRevalidateRootMolecule(currentParams, nextParams);

export function shouldRevalidateRootMolecule(
  currentParams: { model?: string; query?: string },
  nextParams: { model?: string; query?: string },
): boolean {
  return (
    currentParams.model !== nextParams.model ||
    currentParams.query !== nextParams.query
  );
}

export const meta: MetaFunction = ({ params, data, location }: MetaArgs) => {
  const queryData = data as RootMoleculeLoaderData | undefined;
  const parsed = parseMoleculeFocusPath(location.pathname);
  const rootQuery =
    queryData?.query ||
    parsed?.segments?.[0] ||
    (params.query as string);
  const rootResolved = queryData?.resolved_query;
  const preferredName = rootResolved?.name?.name;
  const generations = parsed?.generations?.length
    ? preferredName && parsed.generations.length === 1
      ? [{ ...parsed.generations[0], query: preferredName }]
      : parsed.generations
    : [
        {
          model: (params.model as string) || queryData?.model || "",
          query: preferredName || rootQuery,
        },
      ];
  const path = moleculeFocusUrl({ generations });
  const imageUrl = `${siteUrl(`/og/${params.model}/${encodeURIComponent(rootQuery)}`)}`;

  const modelInfo = resolveModelInfo(queryData?.model || params.model);

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

export default function MoleculeFocusRootRoute() {
  const data = useLoaderData() as RootMoleculeLoaderData;
  if (!data?.model || !data?.query) return <Loading />;
  return (
    <MoleculeFocusRootLayout
      resolved_query={data.resolved_query}
      model={data.model}
      query={data.query}
    />
  );
}
