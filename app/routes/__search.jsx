import { resolve_query } from "~/search";
import Spinner from "~/components/Spinner";
import { useMatches, useFetcher, redirect, Outlet, useTransition } from "remix";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

const HEADERS = {
  headers: {
    "Cache-Control": "max-age=10, stale-while-revalidate, s-maxage=72000",
  },
};

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

export default function Search() {
  const matches = useMatches();
  const fetcher = useFetcher();

  const transition = useTransition();
  const response = matches[matches.length - 1].data?.response;

  const smiles = matches[matches.length - 1].params?.smiles;
  const model = matches[matches.length - 1].params?.model;
  const name = matches[matches.length - 1].params?.name;

  const default_search = smiles || name || "";

  function handleChange(e) {
    const formData = new FormData(e.target.form);
    fetcher.submit(formData);
  }

  const cansmi = smiles || response?.smiles || "";

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
        {default_search ? null : (
          <div className="text-red-400 text-sm">
            Type in a molecule name or SMILES string.
          </div>
        )}
        <div className="text-xs text-gray-500">
          {cansmi_split.length > 0
            ? cansmi_split.map((c, i) => <div key={i}>{c}</div>)
            : null}
        </div>
      </div>

      {transition.state !== "idle" ? <Spinner /> : <Outlet />}
    </>
  );
}
