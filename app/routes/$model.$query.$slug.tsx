import ReactDOMServer from 'react-dom/server'
import { resolve_query } from "~/loaders/backend.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { XDot } from '~/components';

export async function loader({ request }: LoaderFunctionArgs) {
    const params = new URL(request.url).pathname.split("/");
    const slug = params[3];
    const { resolved_query } = await resolve_query({
        model: params[1],
        query: params[2]
      });

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
