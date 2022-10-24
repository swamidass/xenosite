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

export function meta({ location, params }) {
  console.log(params);
  return {
    charset: "utf-8",
    "og:title": "XenoSite",
    viewport: "width=device-width,initial-scale=1",
    "og:type": "website",
    "og:url": "https://xenosite.org" + location.pathname,
    "og:description":
      "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes",
    "og:image": "https://xenosite.org/favicon.png",
    "twitter:title": "XenoSite",
    "twitter:description":
      "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes",
    "twitter:url": "https://xenosite.org/",
    "twitter:image": "https://xenosite.org/favicon.png",
    "twitter:site": "@xenosite",
  };
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
    if (!smi) {
      return "";
    }
    const smi_ck = check_smiles(smi);
    return smi_ck.msg;
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
          className="placeholder:text-red-400 placeholder:text-sm text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
          name="search"
          placeholder="Type in a molecule name or SMILES string."
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
