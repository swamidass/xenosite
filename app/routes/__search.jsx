import {
  useMatches,
  useFetcher,
  Outlet,
  useNavigate,
  redirect,
  useTransition,
} from "remix";
import { useState, useEffect } from "react";
import HEADERS from "~/headers";
import Spinner from "~/components/Spinner";
export function headers() {
  return HEADERS;
}

function query_url(model, query) {
  if (!query) {
    if (!model || model == "_") return "/";
    return `/${model}`;
  }
  return `/${model ? model : "_"}/${encodeURIComponent(query)}`;
}

export async function loader({ request }) {
  const query = new URL(request.url).searchParams;

  const search = query.get("search");
  const model = query.get("model");

  if (model || search) {
    const url = query_url(model, search);
    throw redirect(url);
  }
  return {};
}

export default function Search() {
  const fetcher = useFetcher();
  const matches = useMatches();
  const query = matches[matches.length - 1].params?.query;
  const model = matches[matches.length - 1].params?.model || (query ? "_" : "");
  const navigate = useNavigate();
  const transition = useTransition();
  const [new_query, setNewQuery] = useState(query);

  useEffect(() => {
    if (new_query == query) return;

    const debounced = setTimeout(() => {
      navigate(query_url(model, new_query));
    }, 300);
    return () => {
      clearTimeout(debounced);
    };
  }, [new_query, model]);

  const message = "";
  return (
    <>
      <fetcher.Form
        method="GET"
        className="mt-10 pt-10 block w-full "
        onChange={(e) => {
          const query = e.target.value;
          setNewQuery(query);
        }}
      >
        <input
          type="text"
          className="placeholder:text-red-400 placeholder:text-sm text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
          name="search"
          placeholder="Type in a molecule name or SMILES string."
          defaultValue={query}
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

      {transition.state != "idle" && new_query ? <Spinner /> : <Outlet />}
    </>
  );
}
