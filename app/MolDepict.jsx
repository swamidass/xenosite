import { useRef, useEffect } from "react";
import { pure } from "recompose";
import {
  DrawSmilesSvg,
  PackLinearValues,
  PackRandomValues,
  setColor,
  showDots,
} from "./smilesDrawer";
import * as d3 from "d3";

const rand = (N) => Array.from({ length: N }, () => Math.random() ** 3);

export const MolDepict = pure(
  ({
    smi,
    depictData,
    indexString,
    svg = "",
    widthScale,
    className,
    ...props
  }) => {
    const disp = useRef();
    const log = useRef();
    const prediction = depictData.find((el) => el["raw-smi"] === smi);
    console.log(depictData);

    useEffect(() => {
      async function fetchData() {
        try {
          const drawing = DrawSmilesSvg(smi);

          var D = document.createElementNS("http://www.w3.org/2000/svg", "g");
          D.setAttribute("class", "shading");
          drawing.svg.prepend(D);
          // console.log(drawing);

          var finalSvg = setColor(drawing.svg);
          let X = drawing.vcoords.map((i) => i[0]);
          let Y = drawing.vcoords.map((i) => i[1]);
          // console.log(X);
          // console.log(Y);

          var values;
          let packed;
          if (prediction) {
            switch (prediction.model) {
              case "ugt1":
                values = prediction.data.predictions.map(
                  (el) => el["xenosite"]
                );
                packed = PackLinearValues(X, Y, values);
                break;
              default:
                values = rand(10);
                packed = PackRandomValues(X, Y, values);
            }
          } else {
            values = rand(10);
            packed = PackRandomValues(X, Y, values);
          }
          console.log(values);
          console.log(packed);

          showDots(d3.select(finalSvg.firstChild), packed, 8);
          // console.log(finalSvg);

          disp.current.innerHTML = finalSvg.outerHTML;
          log.current.innerHTML = "";
        } catch (e) {
          log.current.innerHTML = e.message;
        }
      }
      fetchData();
    }, [smi, depictData, disp, widthScale]);

    return (
      <>
        <div
          className="text-red-500 text-xs text-center mx-autos mb-5"
          ref={log}
        />
        <div
          className={"moldepict w-fit max-w-full mx-auto " + className}
          ref={disp}
          {...props}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </>
    );
  }
);
