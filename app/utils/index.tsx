import type { SatoriOptions } from "satori";
// import satori from "satori";
// import svg2img from "svg2img";
// import { XDot } from "~/components";

/**
 *
 * Capitalize the first letter of a word in a string
 * & trims the string.
 *
 * @param word The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(word: string) {
  const lower = word.toLowerCase().trim();

  return word.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Return a string with underscores replaced with spaces.
 * 
 * @param word - The string to replace underscores in, (e.g. "foo_bar")
 * @returns The string with underscores replaced with spaces (e.g. "foo bar")
 */
export function replaceUnderscores(word: string) {
  if(word && !word.includes("_")) return word;
  return word.replace(/_/g, " ");
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
      name?: string,
      description?: string,
      depiction?: string,
      chebi?: number,
      chebiUrl?: string,
      model?: string,
      atom?: number[],
      bond?: number[],
      metabolite?: {
        smiles: string,
        atom?: number[],
        pathway?: string,
        score?: number,
        name?: {
          name?: string,
          chebi?: number,
          chebiUrl?: string,
          description?: string,
        },
      }[],
    }[],
    atoms: {
      num: number
    },
    bonds: {
      idx: [number, number][] | number[][]
    },
    name?: {
      name: string,
      description: string,
      chebi: number,
      chebiUrl: string
    }
  },
  model: string,
  segments?: string[],
}

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    tw?: string;
  }
}

export const SITE_ORIGIN = "https://xenosite.org";
export const SITE_NAME = "XenoSite";
export const DEFAULT_DESCRIPTION =
  "XenoSite predicts how small molecules become toxic after metabolism by liver enzymes.";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/xenosite.png`;
export const DEFAULT_OG_IMAGE_WIDTH = 2400;
export const DEFAULT_OG_IMAGE_HEIGHT = 1350;
export const MOLECULE_OG_IMAGE_WIDTH = 1200;
export const MOLECULE_OG_IMAGE_HEIGHT = 800;

export function siteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_ORIGIN;
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${withSlash}`;
}

/** True when a name is a sitemap-safe slug (not a systematic CHEBI label). */
export function isSitemapSlug(rawName?: string | null) {
  const name = String(rawName || "")
    .trim()
    .toLowerCase();
  if (!name) return false;
  if (name.length < 3 || name.length > 40) return false;
  if (!/^[a-z]/.test(name)) return false;
  if (/\d/.test(name)) return false;
  if (/[()]/.test(name)) return false;
  if (/,/.test(name)) return false;
  return true;
}

/**
 * Canonical path for a molecule page.
 * Use the resolved name only when it is a drug-like slug; never follow
 * CHEBI systematic labels the API may redirect to.
 */
export function moleculePath(
  model: string,
  requestedQuery: string,
  preferredName?: string | null,
) {
  const requested = String(requestedQuery || "").trim();
  const preferred = preferredName?.trim();
  const slug =
    preferred && isSitemapSlug(preferred) ? preferred : requested;
  return `/${model}/${encodeURIComponent(slug)}`;
}

export type PageMetaOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
};

/**
 * Page-level meta (title, canonical, Open Graph, Twitter).
 * Charset and viewport stay on the root route so they are not duplicated.
 */
export function commonMetaValues(options: PageMetaOptions = {}) {
  const title = options.title ?? SITE_NAME;
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const url = siteUrl(options.path ?? "/");
  const image = options.image ?? DEFAULT_OG_IMAGE;
  const imageWidth = String(options.imageWidth ?? DEFAULT_OG_IMAGE_WIDTH);
  const imageHeight = String(options.imageHeight ?? DEFAULT_OG_IMAGE_HEIGHT);

  return [
    { title },
    {
      name: "description",
      content: description,
    },
    {
      name: "robots",
      content: "index, follow",
    },
    {
      tagName: "link" as const,
      rel: "canonical",
      href: url,
    },
    {
      name: "author",
      content: "Dr. Josh Swamidass",
    },
    {
      name: "og:title",
      content: title,
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
      content: SITE_NAME,
    },
    {
      name: "og:image",
      content: image,
    },
    {
      name: "og:image:width",
      content: imageWidth,
    },
    {
      name: "og:image:height",
      content: imageHeight,
    },
    {
      name: "og:description",
      content: description,
    },
    {
      name: "twitter:title",
      content: title,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: image,
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
    },
  ];
}

/** True when this route is the leaf of the current match (avoids duplicate canonicals). */
export function isMetaLeaf(
  matches: { id: string }[],
  routeId: string,
) {
  const leafId = matches.at(-1)?.id ?? "";
  return leafId === routeId || leafId.endsWith(routeId);
}

/**
 * 
 * Choose a random element from an array.
 * 
 * @param array The array to choose from
 * @returns A random element from the array
 */
export function chooseRandom(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}
