import type { SatoriOptions } from "satori";
// import satori from "satori";
// import svg2img from "svg2img";
// import { XDot } from "~/components";

/**
 *
 * Capitalize the first letter of a word in a string.
 *
 * @param word The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(word: string) {
  const lower = word.toLowerCase();

  return word.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 *
 * Augmenting the global Window interface to recognize the
 * gtag method, which is often injected into web pages when
 * using Google Analytics. By adding this declaration, you
 * can call window.gtag(...) in your TypeScript code without
 * the compiler complaining that gtag does not exist on the
 * Window object.
 *
 */
declare global {
  interface Window {
    gtag: (
      option: string,
      gaTrackingId: string,
      options: Record<string, unknown>,
    ) => void;
  }
}

/**
 *
 * Send a PageView event to Google Analytics.
 * Read more about the gtag function here:
 * https://developers.google.com/analytics/devguides/collection/gtagjs/pages
 *
 * @param url The URL of the page to track
 * @param trackingId The Google Analytics tracking ID
 * @returns void
 */
export function sendGoogleAnalyticsPageView(url: string, trackingId: string) {
  if (!window.gtag) {
    console.warn(
      "Window.gtag is not defined. Did you forget to add the Google Analytics script to your page?",
    );
    return;
  }
  window.gtag("config", trackingId, {
    page_path: url,
  });
}

/**
 *
 * Send an event to Google Analytics.
 * Read more about the gtag function here:
 * https://developers.google.com/analytics/devguides/collection/gtagjs/events
 *
 * @param action The value that will appear as the event action in Google Analytics Event reports.
 * @param category The category of the event.
 * @param label The label of the event.
 * @param value A non-negative integer that will appear as the event value.
 * @returns void
 */
export function sendGoogleAnalyticsEvent(
  action: string,
  category: string,
  label: string,
  value: number,
) {
  if (!window.gtag) {
    console.warn(
      "Window.gtag is not defined. Did you forget to add the Google Analytics script to your page?",
    );
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
    // send_to: trackingId,
  });
}

/**
 *
 * Retrieve a font from Google Fonts.
 *
 * @param font
 * @param weights
 * @param text
 * @returns
 */
export async function getFont(
  font: string,
  weights = [400, 700],
  text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\!@#$%^&*()_+-=<>?[]{}|;:,.`'’\"–—",
) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${font}:wght@${weights.join(
      ";",
    )}&text=${encodeURIComponent(text)}`,
    {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
  ).then((response) => response.text());

  const resource = css.matchAll(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/g,
  );

  return Promise.all(
    [...resource]
      .map((match) => match[1])
      .map((url) => fetch(url).then((response) => response.arrayBuffer()))
      .map(async (buffer, i) => ({
        name: font,
        style: "normal",
        weight: weights[i],
        data: await buffer,
      })),
  ) as Promise<SatoriOptions["fonts"]>;
}

export type QueryParameters = {
  model: string;
  query: string | null;
};

/**
 *
 * Get the query URL for a given model and query.
 *
 * @param params QueryParameters, containing the model and query
 * @returns The query URL
 */
export function getQueryUrl(params: QueryParameters) {
  const { model, query } = params;

  if (!query) {
    if (!model || model == "_") return "/";
    return `/${model}`;
  }

  return `/${model ? model : "_"}/${encodeURIComponent(query)}`;
}

/**
 * Return a string of class names, filtering out any falsy values.
 */
export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Data type for Swamidass Api Data
 */

export type SwamidassApiData = {
  params: string[],
  resolved_query: {
    smiles: string,
    results: {
      name: string,
      description: string,
      chebi: number,
      chebiUrl: string
    }[],
    atoms: {
      num: number
    },
    bonds: {
      idx: number[]
    },
    name?: {
      name: string,
      description: string,
      chebi: number,
      chebiUrl: string
    }
  },
  model: string
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    tw?: string;
  }
}

/**
 * 
 * Get the SVG for the og image.
 * 
 * @returns The SVG for the og image in a Response object
 */
// export async function getSvg() {

//   // Get font data
//   const fontData = await getFont("Roboto");
  
//   // Create jsx
//   const jsx = (
//     <div tw="w-full h-full flex">
//         <div tw=" absolute bottom-0 left-0 flex align-text-bottom ">
//             <h1 tw="text-4xl font-bold px-3 flex inline">
//                 <div tw="inset-0 absolute -top-2 -z-10 flex">
//                     <div tw="w-[4em] mx-auto opacity-25 flex">
//                         <XDot />
//                     </div>
//                 </div>
//                 XenoSite
//             </h1>
//         </div>
//     </div>
//   );

//   // Create svg
//   const svg = await satori(jsx, {
//     width: 600,
//     height: 400,
//     //debug: true,
//     fonts: fontData,
//   });

//   // Convert svg to png
//   const { data, error } = await new Promise(
//     (
//       resolve: (value: { data: Buffer | null; error: Error | null }) => void
//     ) => {
//       svg2img(
//         svg,
//         {
//           resvg: {
//             fitTo: {
//               mode: "width", // or height
//               value: 1200,
//             },
//           },
//         },
//         (error, buffer) => {
//           if (error) {
//             resolve({ data: null, error });
//           } else {
//             resolve({ data: buffer, error: null });
//           }
//         }
//       );
//     }
//   );

//   // Return response
//   if (error) {
//     return new Response(error.toString(), {
//       status: 500,
//       headers: {
//         "Content-Type": "text/plain",
//       },
//     });
//   }

//   return new Response(data, {
//     headers: {
//       "Content-Type": "image/png", 
//     },
//   });
// }

export function commonMetaValues() {
  let description = "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
  let url = `https://xenosite.org`;

  let results = [
    { charSet: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: `Xenosite` },
    {
      name: "description",
      content: description,
    },
    {
      name: "robots",
      content: "index, follow",
    },
    {
      tagName: "link",
      rel: "canonical",
      href: "https://xenosite.org",
    },
    {
      name: "author",
      content: "Dr. Josh Swamidass",
    },
    {
      name: "og:title",
      content: `Xenosite`,
    },
    {
      name: "og:type",
      content: "website",
    },
    {
      name: "og:url",
      content: url,
    },
    {
      name: "og:site_name",
      content: "Xenosite",
    },
    {
      name: "og:image",
      content: `/favicon.png`,
    },
    { 
      name: "og:description",
      content: description,
    },
    {
      name: "og:canonical",
      content: "https://xenosite.org",
    },
    {
      name: "twitter:title",
      content: `Xenosite`,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: `/favicon.png`,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:site",
      content: "@xenosite",
    },
    {
      name: "twitter:creator",
      content: "Dr. Josh Swamidass",
    }
  ];

  return results;
}
