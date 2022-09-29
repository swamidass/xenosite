import { useState, useEffect } from "react";
import loadable from "@loadable/component";

const ReactJson = loadable(
  () =>
    new Promise((r, c) =>
      import("react-json-view").then((result) => r(result.default), c)
    )
);

export default function ModelDataDisplay({ data }) {
  const [modelData, setModelData] = useState([{}]);

  useEffect(() => {
    setModelData(data);
  }, [data]);

  return (
    <>
      {" "}
      {!modelData ? (
        <></>
      ) : (
        <div className={"h-screen"}>
          <ReactJson
            name="Libridass-Json-Display"
            src={JSON.parse(JSON.stringify(data))}
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
