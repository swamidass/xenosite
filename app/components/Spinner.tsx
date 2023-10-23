import XDot from "./XDot"

/**
 * 
 * This is the Spinner component. It is a React component that renders
 * the Xenosite SVG as a spinner.
 * 
 */
const Spinner = () => {
    return (
        <div className="w-full pt-20 opacity-50">
            <div className="mx-auto animate-ping block w-fit">
                <XDot className="w-8" />
            </div>
        </div> 
    )
}

export default Spinner;