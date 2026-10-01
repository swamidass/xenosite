import type { HeadersFunction } from "@remix-run/node";

/**
 * Cache-Control for prediction / canonize loader JSON (`?_data=…`).
 *
 * - `max-age=600` — browser may reuse the response for 10 minutes (no refetch)
 * - `s-maxage=6000` — shared/CDN cache TTL
 * - `stale-while-revalidate` — serve stale while revalidating after max-age
 *
 * Must use hyphenated `max-age`. Bare `maxage` is ignored (live bug).
 */
export const PREDICTION_CACHE_CONTROL =
  "public, max-age=600, s-maxage=6000, stale-while-revalidate=86400";

/** Default HTML shell when no loader sets Cache-Control. */
export const DOCUMENT_CACHE_CONTROL =
  "public, max-age=60, s-maxage=600, stale-while-revalidate=86400";

/** Pass to `json(data, { headers: HEADERS })` from prediction loaders. */
export default {
  "Cache-Control": PREDICTION_CACHE_CONTROL,
};

/**
 * Remix only puts loader Cache-Control on document HTML when a route exports
 * `headers`. Lift the loader value (or keep a parent/document default).
 */
export const predictionHeaders: HeadersFunction = ({
  loaderHeaders,
  parentHeaders,
}) => ({
  "Cache-Control":
    loaderHeaders.get("Cache-Control") ||
    parentHeaders.get("Cache-Control") ||
    PREDICTION_CACHE_CONTROL,
});
