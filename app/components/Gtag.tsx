import { useRouteLoaderData, useLocation } from "@remix-run/react";
import { useEffect } from "react";
import { sendGoogleAnalyticsPageView } from "~/utils";

type RootLoaderData = {
  gaTrackingId?: string | null;
};

/**
 * Google Analytics — reads the tracking id from the root loader so nested
 * molecule routes still get pageviews (leaf useLoaderData has no ga id).
 */
export default function Gtag() {
  const root = useRouteLoaderData("root") as RootLoaderData | undefined;
  const gaTrackingId = root?.gaTrackingId;
  const location = useLocation();

  useEffect(() => {
    if (gaTrackingId) {
      sendGoogleAnalyticsPageView(
        location.pathname + location.search,
        gaTrackingId,
      );
    } else {
      console.debug("PageView", location.pathname + location.search);
    }
  }, [location.pathname, location.search, gaTrackingId]);

  return !gaTrackingId ? null : (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
      />
      <script
        async
        id="gtag-init"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaTrackingId}', {
            page_path: window.location.pathname + window.location.search,
          });
        `,
        }}
      />
    </>
  );
}
