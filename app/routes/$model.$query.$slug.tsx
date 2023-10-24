import ReactDOMServer from 'react-dom/server'
import { resolve_query } from "~/loaders/backend.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { XDot } from '~/components';

export async function loader({ params }: LoaderFunctionArgs) {
    const { resolved_query } = await resolve_query({
        model: params.model || "",
        query: params.query || null // add null check here
    });

    const slug = params.slug;
    let svgString = null;
    if (resolved_query?.results && resolved_query.results.length > 0) {
        if (resolved_query.results[slug as string] !== undefined) { // add type assertion here
            svgString = resolved_query.results[slug as string].depiction; // add type assertion here
        }
    }

    if (svgString === null) {
        svgString = ReactDOMServer.renderToString(<XDot />);
    }

    return new Response(svgString, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml",
        },
    })
};
