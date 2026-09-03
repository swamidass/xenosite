import type { LoaderFunctionArgs } from "@remix-run/node";

const XENOSITE_BACKEND =
  process.env.XENOSITE_BACKEND || `http://localhost:8000`;

const XENOSITE_BACKEND_KEY = process.env.XENOSITE_BACKEND_KEY || null;

/**
 * Proxy plain molecule depictions from the API (/v1/depict) for lazy metabolite cards.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || url.searchParams.get("smiles");
  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  const headers: Record<string, string> = {};
  if (XENOSITE_BACKEND_KEY) {
    headers.Authorization = "Bearer " + XENOSITE_BACKEND_KEY;
  }

  const upstream =
    `${XENOSITE_BACKEND}/v1/depict?` +
    new URLSearchParams({ query, depict: "true" });

  const res = await fetch(upstream, { headers });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
