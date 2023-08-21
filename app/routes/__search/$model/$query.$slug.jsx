import XDot from "~/components/XDot";
import { resolve_query } from "~/search";
import ReactDOMServer from 'react-dom/server'

export async function loader({ params }) {
    const {slug} = params;
    const { resolved_query } = await resolve_query(params);

    let svgString = null; 
    if(resolved_query?.results && resolved_query.results.length > 0) {
        if(typeof resolved_query.results[slug] !== 'undefined') {
            svgString = resolved_query.results[slug].depiction;
        } 
    }

    if(svgString === null) {
        svgString = ReactDOMServer.renderToString(<XDot />);
    }

    return new Response(svgString, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml",
        },
    })
};
