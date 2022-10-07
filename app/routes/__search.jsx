// import { MolDepict } from "~/MolDepict";
import { backend_api } from "~/backend.server";
import {
  Link,
  useMatches,
  Form,
  redirect,
  json,
  useSubmit,
  Outlet,
} from "remix";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export async function loader({ params, request }) {
  const query = new URL(request.url).searchParams;

  const search = query.get("search");
  const model = query.get("model");

  if (search) {
    if (model || search) {
      const url =
        "/" +
        (model ? model + "/" : "") +
        (search ? `_/${encodeURIComponent(search)}` : "");

      return redirect(url);
    }
  }
  return json(params, {
    headers: {
      "Cache-Control": "max-age=10, stale-while-revalidate, s-maxage=72000",
    },
  });
}

export default function Search() {
  // const {  } = useLoaderData() || {};
  const matches = useMatches();
  const smiles = matches[matches.length - 1].params?.smiles;
  const model = matches[matches.length - 1].params?.model;

  const submit = useSubmit();

  function handleChange(e) {
    submit(e.currentTarget);
  }

  const cansmi = smiles || "";
  const default_search = smiles || "";

  let cansmi_split = cansmi
    ? cansmi.split(".").sort((a, b) => b.length - a.length)
    : [];

  return (
    <>
      <Form
        action="/"
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
        <input
          type="text"
          className="hidden"
          name="model"
          defaultValue={model}
        />
        <input className="hidden" type="submit" />
      </Form>
      <div className="h-8 text-blue-600 text-center  py-3">
        {cansmi_split.length > 1
          ? cansmi_split.map(
              (c) => (
                // <Link
                //   key={c}
                //   to={`./${encodeURIComponent(c)}`}
                //   className="hover:underline inline-block mx-1"
                // >
                <div>{c}</div>
              )

              //  </Link>
            )
          : null}
      </div>

      {/* {!depict_smi ? (
        <div className="mx-auto w-full text-center">
          Enter a SMILES string or a molecule name.
        </div>
      ) : (
        depict_split.map((c) => (
          <MolDepict key="c" className="mx-auto mt-5" smi={c} />
        ))
      )} */}
      <Outlet />
    </>
  );
}
