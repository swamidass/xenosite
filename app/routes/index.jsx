import { MolDepict } from "~/MolDepict";
import axios from "axios";
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
import GridLayout from "react-grid-layout";

// const ResponsiveGridLayout = WidthProvider(Responsive);

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

function libridassRestCall(model, data) {
  switch (model) {
    case "epoxidation1":
    case "ugt1":
    case "reactivity1":
    case "quinone1":
    case "ndealk1":
    case "metabolism1":
    case "metabolite1":
      return new Promise(async (resolve, reject) => {
        try {
          const promises = [];
          for (let i = 0; i < data.length; i++) {
            const url = window.ENV.LIBRIDASS_REST_URL + model + "/" + data[i];
            let p = axios.get(url, {
              headers: {
                Authorization: window.ENV.LIBRIDASS_REST_AUTHORIZATION,
              },
            });
            promises.push(p);
          }
          const responses = await Promise.all(promises);
          let results = responses.map((r) => r.data);
          for (let i = 0; i < results.length; i++) {
            results[i]["raw-smi"] = data[i];
          }
          resolve(results);
        } catch (error) {
          console.log(error);
          resolve([{}]);
        }
      });
    default:
      return [{}];
  }
}

export default function Index() {
  const [modelData, setModelData] = useState({});
  const [depictData, setDepictData] = useState([]);
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
    depict_smi = transition.submission.formData.get("search");
  }

  function handleChange(e) {
    submit(e.currentTarget, { replace: true });
  }

  async function modelClick(model, smi) {
    const data = smi.split(".");
    libridassRestCall(model, data).then((resp) => {
      switch (model) {
        case "ugt1":
          console.log("ugt");
          setDepictData(resp);
          break;
        default:
          console.log("do nothing");
          setDepictData([]);
      }

      setModelData(resp);
    });
  }

  let cansmi_split = cansmi
    ? cansmi.split(".").sort((a, b) => b.length - a.length)
    : [];
  let depict_split = depict_smi
    ? depict_smi.split(".").sort((a, b) => b.length - a.length)
    : [];

  const layout = [
    { i: "a", x: 0, y: 0, w: 10, h: 2, static: true },
    { i: "b", x: 0, y: 1, w: 10, h: 4 },
    { i: "c", x: 0, y: 2, w: 10, h: 2 },
    { i: "d", x: 0, y: 3, w: 10, h: 10 },
  ];

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={30}
      width={1200}
    >
      <div key="a">
        <Form
          action="/"
          replace
          method="GET"
          className="block w-full "
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
      </div>
      <div key="b">
        {!depict_smi ? (
          <div className="mx-auto w-full text-center">
            Enter a SMILES string or a molecule name.
          </div>
        ) : (
          <div className="flex flex-row items-center">
            {depict_split.map((c, Index) => (
              <MolDepict
                key={"c" + Index.toString()}
                className={`basis-1/${depict_split.length} mx-auto mt-5`}
                smi={c}
                indexString={Index.toString()}
                depictData={depictData}
              />
            ))}
          </div>
        )}
      </div>
      <div key="c">
        {!depict_smi ? (
          <></>
        ) : (
          <div className="flex flex-row justify-center items-center">
            {models.map((model) => {
              return (
                <button
                  type="button"
                  key={`button-${model.name}`}
                  className={`basis-1/${models.length} ${model.color.t} hover:text-white border ${model.color.b} ${model.color.hbg} focus:ring-4 focus:outline-none ${model.color.fr} font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 ${model.color.db} ${model.color.dt} dark:hover:text-white ${model.color.dhbg} ${model.color.dfr}`}
                  onClick={() => {
                    modelClick(model.name, depict_smi);
                  }}
                >
                  {model.displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div key="d">
        {" "}
        {!depict_smi ? <></> : <ModelDataDisplay data={modelData} />}
      </div>
    </GridLayout>
  );
}
