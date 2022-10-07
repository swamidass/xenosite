import { useRef, useEffect } from "react";
import { pure } from "recompose";
import { DrawSmilesSvg } from "../smilesDrawer";

export const MolDepict = pure(
  ({ smi, svg = "", widthScale, className, ...props }) => {
    const disp = useRef();
    const log = useRef();

    useEffect(() => {
      try {
        const { svg } = DrawSmilesSvg(
          smi,
          document,
          "mx-auto max-w-full",
          widthScale
        );
        //  console.log(svg)
        disp.current.innerHTML = svg.outerHTML;
        log.current.innerHTML = "";
      } catch (e) {
        log.current.innerHTML = e.message;
      }
    }, [smi, disp, widthScale]);

    return (
      <div className="">
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
      </div>
    );
  }
);
