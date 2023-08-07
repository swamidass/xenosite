import { useLoaderData, useLocation } from "@remix-run/react";
import { useEffect } from "react";
import * as gtag from "~/gtags.client";

export function Gtag() {
  const { gaTrackingId } = useLoaderData();
  const location = useLocation();

  useEffect(() => {
    if (gaTrackingId) {
      gtag.pageview(location.pathname, gaTrackingId);
    } else {
      console.log("pageview", location.pathname);
    }
  }, [location, gaTrackingId]);

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
            page_path: window.location.pathname,
          });
        `,
        }}
      />
    </>
  );
}
