import { MODELS, resolveModelInfo, XenositeModelInfo } from "~/data";
import { Outlet, useMatches } from "@remix-run/react";
import { ModelDescriptions } from "~/components";
import { json } from "@remix-run/node";
import type {
  MetaFunction,
  MetaArgs,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "@remix-run/node";
import type { LdJsonParams } from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import { SITE_NAME, commonMetaValues, isMetaLeaf, siteUrl } from "~/utils";

export const meta: MetaFunction = ({ matches, params }: MetaArgs) => {
  if (!isMetaLeaf(matches, "routes/_model.$model")) {
    return [];
  }

  const modelInfo = resolveModelInfo(params.model);
  const title = modelInfo ? `${SITE_NAME} | ${modelInfo.model}` : SITE_NAME;
  const description =
    params.model !== "_" && modelInfo
      ? `XenoSite reactivity model of "${params.model}".`
      : "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  const path = `/${params.model}`;

  const results: any[] = [
    ...commonMetaValues({ title, description, path }),
  ];

  const ldJsonParams: LdJsonParams = {
    model: modelInfo as XenositeModelInfo,
    xenositeUrl: siteUrl(path),
    citation: modelInfo ? modelInfo.citation : "",
  };
  for (const node of getLdJson(ldJsonParams)) {
    results.push({ "script:ld+json": node });
  }

  return results;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const model = params.model;
  const modelInfo = MODELS.find((x) => x.path == model);

  if (!modelInfo && model != "_") {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return json({});
}

/** Model layout is static per `params.model` — skip refetch on nested hops. */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
}) => currentParams.model !== nextParams.model;

export default function Model() {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const { model, query } = leaf?.params ?? {};
  const hasMolecule =
    !!query ||
    (leaf?.id || "").includes("$query") ||
    (leaf?.pathname || "").includes("/m/");

  // Model tabs / about live in root (under search). This layout only hosts content.
  if (model == "_" || !model) {
    if (!query) return <ModelDescriptions />;
    return <Outlet />;
  }

  if (hasMolecule) return <Outlet />;

  return null;
}
