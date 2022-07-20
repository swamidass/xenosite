import { useState, useEffect } from "react";
import axios from "axios";

async function libridassRestCall(model, data) {
  switch (model) {
    case "epoxidation1":
    case "ugt1":
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

  return <div>{JSON.stringify(modelData)}</div>;
}
