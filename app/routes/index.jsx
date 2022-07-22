import { MolDepict } from "~/MolDepict";
import { cansmi, name2smiles } from "~/backend.server";
import {
  Link,
  Form,
  useLoaderData,
  useTransition,
  json,
  useSubmit,
} from "remix";
import { useState } from "react";
import ModelDataDisplay from "../ModelDataDisplay";

export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}

export async function loader({ request }) {
  const sparams = new URL(request.url).searchParams;

  if (!sparams.get("search")) return {};

  var response = {};
  response.search = sparams.get("search") || "";

  await resolveSearch(response);

  return json(response, {
    headers: {
      "Cache-Control": "max-age=10, stale-while-revalidate, s-maxage=72000",
    },
  });
}

async function resolveSearch(response) {
  if (response.search != "") {
    // response.cansmi = await cansmi(response.search.trim());

    if (!response.cansmi) {
      let name = response.search.trim();

      // response.cansmi = await name2smiles(name)
      //   .then(cansmi)
      //   .then((x) => {
      //     if (!x) return undefined;
      //     response.name = name;
      //     return x;
      //   });
    }
  }
}

function generateTWButtonStyles(modelColor) {
  return {
    t: `text-${modelColor}-700`,
    b: `border-${modelColor}-700`,
    hbg: `hover:bg-${modelColor}-800`,
    fr: `focus:ring-${modelColor}-300`,
    db: `dark:border-${modelColor}-500`,
    dt: `dark:text-${modelColor}-500`,
    dhbg: `dark:hover:bg-${modelColor}-600`,
    dfr: `dark:focus:ring-${modelColor}-800`,
  };
}

export default function Index() {
  const [modelData, setModelData] = useState({ model: null, smi: [] });
  var { search, name, cansmi } = useLoaderData() || {};

  const submit = useSubmit();

  const transition = useTransition();

  let depict_smi = name ? cansmi : search;
  let init_search = search || name || cansmi || "";
  const models = [
    {
      name: "epoxidation1",
      displayName: "Epoxidation",
      color: generateTWButtonStyles("blue"),
    },
    {
      name: "ugt1",
      displayName: "Ugt",
      color: generateTWButtonStyles("orange"),
    },
    {
      name: "reactivity1",
      displayName: "Reactivity",
      color: generateTWButtonStyles("green"),
    },
    {
      name: "quinone1",
      displayName: "Quinone",
      color: generateTWButtonStyles("purple"),
    },
    {
      name: "ndealk1",
      displayName: "N-Dealkylation",
      color: generateTWButtonStyles("red"),
    },
    {
      name: "metabolism1",
      displayName: "Metabolism",
      color: generateTWButtonStyles("fuchsia"),
    },
    {
      name: "metabolite1",
      displayName: "Metabolite",
      color: generateTWButtonStyles("amber"),
    },
  ];

  if (transition.state == "submitting") {
    // console.log(transition.submission)
    depict_smi = transition.submission.formData.get("search");
  }

  function handleChange(e) {
    submit(e.currentTarget, { replace: true });
  }

  let cansmi_split = cansmi
    ? cansmi.split(".").sort((a, b) => b.length - a.length)
    : [];
  let depict_split = depict_smi
    ? depict_smi.split(".").sort((a, b) => b.length - a.length)
    : [];

  return (
    <>
      <Form
        action="/"
        replace
        method="GET"
        className="mt-10 pt-10 block w-full "
        onChange={handleChange}
      >
        <input
          type="text"
          className=" text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0"
          name="search"
          defaultValue={init_search}
        />
        <input className="hidden" type="submit" />
      </Form>
      <div className="h-8 text-blue-600 text-center  py-3">
        {cansmi
          ? cansmi_split.map((c) => (
              <Link
                key={c}
                to={`?search=${encodeURIComponent(c)}`}
                className="hover:underline inline-block mx-1"
              >
                {c}
              </Link>
            ))
          : null}
      </div>

      {!depict_smi ? (
        <div className="mx-auto w-full text-center">
          Enter a SMILES string or a molecule name.
        </div>
      ) : (
        depict_split.map((c, Index) => (
          <MolDepict
            key={"c" + Index.toString()}
            className="mx-auto mt-5"
            smi={c}
          />
        ))
      )}

      {!depict_smi ? (
        <></>
      ) : (
        <>
          {models.map((model) => {
            return (
              <button
                type="button"
                key={`button-${model.name}`}
                className={`${model.color.t} hover:text-white border ${model.color.b} ${model.color.hbg} focus:ring-4 focus:outline-none ${model.color.fr} font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 ${model.color.db} ${model.color.dt} dark:hover:text-white ${model.color.dhbg} ${model.color.dfr}`}
                onClick={() => {
                  setModelData({ model: model.name, smi: depict_split });
                }}
              >
                {model.displayName}
              </button>
            );
          })}
          <ModelDataDisplay model={modelData.model} data={modelData.smi} />
        </>
      )}
    </>
  );
}
