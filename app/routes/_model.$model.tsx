import { MODELS, XenositeModelInfo } from "~/data";
import { Link, Outlet, useMatches } from "@remix-run/react";
import { ModelDescriptions } from "~/components";
import { json} from "@remix-run/node";
import type { MetaFunction, MetaArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { LdJsonParams} from "~/loaders/ld-json";
import { getLdJson } from "~/loaders/ld-json";

export const meta: MetaFunction = ({ matches, params }: MetaArgs) => {

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
        meta.name !== "og:url"
      )
    ));
  // console.log(parentMeta)
  
  // Get new values for title, description, etc.
  const modelInfo = MODELS.find((x) => x.path == params.model);
  const title = modelInfo ? `Xenosite | ${modelInfo.model}` : "Xenosite";
  const description = (params.model !== "_" && modelInfo) ?
    `XenoSite reactivity model of "${params.model}".` :
    "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  const url = `https://xenosite.org/${params.model}`;

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
  ];

  // Add ld+json
  const ldJsonParams: LdJsonParams = {
    model: modelInfo as XenositeModelInfo,
    xenositeUrl: url,
    citation: modelInfo ? 
      modelInfo.citation : "",
  }
  const ldJson = getLdJson(ldJsonParams)
  if (ldJson.length > 0) {
    results.push({
      "script:ld+json": ldJson  // @ts-ignore
    });
  }

  // console.log(results);
  return results
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
  const { model, query } = useMatches()[0].params;
  const modelinfo = MODELS.find((x) => x.path == model);

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
                <h2>
                  <Link
                    className="no-underline hover:underline"
                    to={`/${modelinfo.path}`}
                    reloadDocument
                  >
                    {modelinfo.model}
                  </Link>
                </h2>

                {modelinfo.info ? <modelinfo.info /> : null}
              </>
            )}
          </div>
        </div>
      </>
    );

  }
}