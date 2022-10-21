import { resolve_query, check_smiles, resolve_query_as_smiles } from "~/search";
import Spinner from "~/components/Spinner";
import { useMatches, useFetcher, redirect, Outlet, useTransition } from "remix";
import { useState } from "react";
import HEADERS from "~/headers";

export function headers() {
  return HEADERS;
}

export async function loader({ params, request }) {
  const query = new URL(request.url).searchParams;

  const search = query.get("search");
  const model = query.get("model");
  const { smiles, name } = await resolve_query(search);

  if (name) {
    const url =
      "/" + (model ? model + "/" : "") + `n/${encodeURIComponent(name)}`;
    return redirect(url, HEADERS);
  }

  if (smiles) {
    const url =
      "/" + (model ? model + "/" : "") + `_/${encodeURIComponent(smiles)}`;
    return redirect(url, HEADERS);
  }

  if (model) {
    const url = "/" + model;
    return redirect(url, HEADERS);
  }
  return null;
}

export async function meta({ params }) {
  console.log("inside results summary");
  console.log(params);

  if (JSON.stringify(params) !== "{}") {
    const [response, resolved_name] = await resolve_query_as_smiles(
      params.smiles,
      params.model
    );

    // Need to change it at each place that controls data
    // for each relevant meta tag. Default tab will be on index/root, somehow
    console.log(response);

    return {
      charset: "utf-8",
      "og:title": params.model ? "XenoSite | " + params.model : "XenoSite",
      viewport: "width=device-width,initial-scale=1",
      "og:type": "website",
      "og:url": params.smiles
        ? "https://xenosite.org/" + params.model + "/_/" + params.smiles
        : "https://xenosite.org/",
      "og:description":
        "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes",
      "og:image":
        response.results.length > 0
          ? response.results[0].depiction !== undefined
            ? response.results[0].depiction
            : "https://xenosite.org/favicon.png"
          : "https://xenosite.org/favicon.png",
      "twitter:title":
        params.model !== undefined ? "XenoSite | " + params.model : "XenoSite",
      "twitter:description":
        "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes",
      "twitter:url": "https://xenosite.org/",
      "twitter:image": "https://xenosite.org/favicon.png",
      "twitter:site": "@xenosite",
    };
  } else {
    return {};
  }
}

export default function Search() {
  const matches = useMatches();
  const fetcher = useFetcher();

  const transition = useTransition();
  const response = matches[matches.length - 1].data?.response;

  const smiles = matches[matches.length - 1].params?.smiles;
  const model = matches[matches.length - 1].params?.model;
  const name = matches[matches.length - 1].params?.name;

  const default_search = smiles || name || null;

  const cansmi = smiles || response?.smiles || "";

  function smiles_msg(smi) {
    const smi_ck = check_smiles(smi);
    return !default_search
      ? "Type in a molecule name or SMILES string."
      : smi_ck.msg;
  }

  const msg = smiles ? smiles_msg(cansmi) : "";
  const [message, setMessage] = useState(msg);

  function handleChange(e) {
    const formData = new FormData(e.target.form);

    const search = formData.get("search");
    const msg = smiles ? smiles_msg(search) : "";
    setMessage(msg);

    fetcher.submit(formData);
  }

  let cansmi_split = cansmi
    ? cansmi.split(".").sort((a, b) => b.length - a.length)
    : [];

  return (
    <>
      <fetcher.Form
        method="GET"
        className="mt-10 pt-10 block w-full "
        onChange={handleChange}
      >
        <input
          type="text"
          className=" text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
          name="search"
          defaultValue={default_search}
        />
        {model ? (
          <input
            type="text"
            className="hidden"
            name="model"
            defaultValue={model}
          />
        ) : null}
        <input className="hidden" type="submit" />
      </fetcher.Form>
      <div className="h-8 text-center  py-3">
        {message ? <div className="text-red-400 text-sm">{message}</div> : null}
      </div>

      {transition.submission ? <Spinner /> : <Outlet />}
    </>
  );
}
