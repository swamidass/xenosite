import { MODELS, resolveModelInfo, XenositeModelInfo } from "~/data";
import { Outlet, useMatches } from "@remix-run/react";
import AboutModel from "~/components/AboutModel";
import { ModelDescriptions, ModelTabs } from "~/components";
import { json } from "@remix-run/node";
import type { MetaFunction, MetaArgs, LoaderFunctionArgs } from "@remix-run/node";
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

export default function Model() {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const { model, query } = leaf?.params ?? {};
  const hasMolecule =
    !!query ||
    (leaf?.id || "").includes("$query") ||
    (leaf?.pathname || "").includes("/m/");

  if (model == "_" || !model) {
    if (!query) {
      return (
        <ModelTabs>
          <ModelDescriptions />
        </ModelTabs>
      );
    }
    return <Outlet />;
  }

  if (hasMolecule) {
    return <Outlet />;
  }

  return (
    <>
      <ModelTabs />
      <AboutModel model={model} />
    </>
  );
}
