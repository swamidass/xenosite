import type { SVGProps } from "react";
import type { JSX } from "react/jsx-runtime";

/**
 * 
 * This is the XDot component. It is a React component that renders 
 * the Xenosite SVG.
 * 
 * @param props
 * @returns 
 */
const XDot = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        xmlSpace="preserve"
        width="60.0"
        height="60.0"
        viewBox="-10 -10 38.0 38.0"
        {...props}
    >
        <circle r="18.0" cx="9" cy="9" style={{ fill: "rgb(23,90,254)" }}></circle>
        <circle r="15.6" cx="9" cy="9" style={{ fill: "rgb(12,204,0)" }}></circle>
        <circle r="12.7" cx="9" cy="9" style={{ fill: "rgb(205,202,0)" }}></circle>
        <circle r="9.0" cx="9" cy="9" style={{ fill: "rgb(254,0,0)" }}></circle>
    </svg>);


XDot.displayName = "XDot";

export default XDot;