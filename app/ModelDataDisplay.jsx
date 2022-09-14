import { useState, useEffect } from "react";
import axios from "axios";
import loadable from "@loadable/component";

const ReactJson = loadable(
  () =>
    new Promise((r, c) =>
      import("react-json-view").then((result) => r(result.default), c)
    )
);

async function libridassRestCall(model, data) {
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
          const results = responses.map((r) => r.data);
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

export default function ModelDataDisplay({ model, data }) {
  const [modelData, setModelData] = useState([{}]);

  useEffect(() => {
    async function fetchData() {
      console.log(model, data);
      if (model) {
        await libridassRestCall(model, data).then((resp) => setModelData(resp));
      }
    }
    fetchData();
  }, [model, data]);

  return (
    <>
      {" "}
      {!modelData ? (
        <></>
      ) : (
        <div className={"h-screen"}>
          <ReactJson
            name="Libridass-Json-Display"
            src={JSON.parse(JSON.stringify(modelData))}
            quotesOnKeys={false}
            displayDataTypes={false}
            collapseStringsAfterLength={30}
            indentWidth={2}
            displayObjectSize={false}
            groupArraysAfterLength={10}
          />
        </div>
      )}
    </>
  );
}
