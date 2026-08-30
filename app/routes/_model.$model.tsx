import { MODELS, resolveModelInfo, XenositeModelInfo } from "~/data";
import { Link, Outlet, useMatches } from "@remix-run/react";
import { ModelDescriptions } from "~/components";
import { json} from "@remix-run/node";
import type { MetaFunction, MetaArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { LdJsonParams} from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";
import { SITE_NAME, commonMetaValues, isMetaLeaf, siteUrl } from "~/utils";

export const meta: MetaFunction = ({ matches, params }: MetaArgs) => {
  if (!isMetaLeaf(matches, "routes/_model.$model")) {
    return [];
  }

  const modelInfo = resolveModelInfo(params.model);
  const title = modelInfo ? `${SITE_NAME} | ${modelInfo.model}` : SITE_NAME;
  const description = (params.model !== "_" && modelInfo) ?
    `XenoSite reactivity model of "${params.model}".` :
    "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  const path = `/${params.model}`;

  const results: any[] = [
    ...commonMetaValues({ title, description, path }),
  ];

  const ldJsonParams: LdJsonParams = {
    model: modelInfo as XenositeModelInfo,
    xenositeUrl: siteUrl(path),
    citation: modelInfo ?
      modelInfo.citation : "",
  }
  for (const node of getLdJson(ldJsonParams)) {
    results.push({ "script:ld+json": node });
  }

  return results;
}

export async function loader({
  params
}: LoaderFunctionArgs) {
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
  const { model, query } = matches[matches.length - 1].params;
  const modelinfo = MODELS.find((x) => x.path == model);
  const Heading = query ? "h2" : "h1";

  if (modelinfo || model == "_") {
    if(model == "_" || !model) {
      if(!query) return <ModelDescriptions />
      else return <Outlet />
    }

    return (
      <>
        <Outlet />
        <div className=" flex flex-wrap  justify-evenly items-start pt-20">
          <div className="prose text-sm max-w-prose border p-3 rounded-lg align-top m-3  hover:shadow hover:bg-slate-50">
            {modelinfo && (
              <>
                <Heading>
                  <Link
                    className="no-underline hover:underline"
                    to={`/${modelinfo.path}`}
                    reloadDocument
                  >
                    {modelinfo.model}
                  </Link>
                </Heading>

                {modelinfo.info ? <modelinfo.info /> : null}
              </>
            )}
          </div>
        </div>
      </>
    );

  }
}