import { useLoaderData, useLocation } from '@remix-run/react';
import { useEffect } from 'react';
import { sendGoogleAnalyticsPageView } from '~/utils';

/**
 * 
 * A React component that renders the Google Analytics script.
 * 
 * @returns 
 */
export default function Gtag() {
    const { gaTrackingId } = useLoaderData();
    const location = useLocation();
    
    useEffect(() => {
        if (gaTrackingId) {
            sendGoogleAnalyticsPageView(location.pathname, gaTrackingId);
        } else {
            console.debug("PageView", location.pathname);
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