export type SvgViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DepictionMetadata = {
  coords: [number, number][];
  scale: number;
  viewBox: SvgViewBox;
};

const VIEWBOX_RE = /viewBox\s*=\s*["']\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)\s*["']/i;
const WIDTH_HEIGHT_RE =
  /<svg[^>]*\bwidth\s*=\s*["']?\s*([-\d.]+)\s*["']?[^>]*\bheight\s*=\s*["']?\s*([-\d.]+)\s*["']?/i;
const HEIGHT_WIDTH_RE =
  /<svg[^>]*\bheight\s*=\s*["']?\s*([-\d.]+)\s*["']?[^>]*\bwidth\s*=\s*["']?\s*([-\d.]+)\s*["']?/i;
const JSON_SCRIPT_RE =
  /<script[^>]*type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i;

function parseViewBox(svgString: string): SvgViewBox | null {
  const vb = svgString.match(VIEWBOX_RE);
  if (vb) {
    return {
      x: Number(vb[1]),
      y: Number(vb[2]),
      width: Number(vb[3]),
      height: Number(vb[4]),
    };
  }

  const wh = svgString.match(WIDTH_HEIGHT_RE);
  if (wh) {
    return { x: 0, y: 0, width: Number(wh[1]), height: Number(wh[2]) };
  }

  const hw = svgString.match(HEIGHT_WIDTH_RE);
  if (hw) {
    return { x: 0, y: 0, width: Number(hw[2]), height: Number(hw[1]) };
  }

  return null;
}

/**
 * Parse xenopict-embedded JSON coords/scale and the SVG viewBox from a depiction string.
 * Xenopict may HTML-escape quotes inside the script body (&quot;).
 */
export function parseDepictionMetadata(
  svgString: string,
): DepictionMetadata | null {
  if (!svgString) return null;

  const viewBox = parseViewBox(svgString);
  if (!viewBox || !(viewBox.width > 0) || !(viewBox.height > 0)) return null;

  const script = svgString.match(JSON_SCRIPT_RE);
  if (!script) return null;

  try {
    const raw = script[1]
      .trim()
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const parsed = JSON.parse(raw) as {
      coords?: unknown;
      scale?: unknown;
    };
    if (!Array.isArray(parsed.coords) || typeof parsed.scale !== "number") {
      return null;
    }
    const coords: [number, number][] = [];
    for (const pair of parsed.coords) {
      if (
        !Array.isArray(pair) ||
        pair.length < 2 ||
        typeof pair[0] !== "number" ||
        typeof pair[1] !== "number"
      ) {
        return null;
      }
      coords.push([pair[0], pair[1]]);
    }
    return { coords, scale: parsed.scale, viewBox };
  } catch {
    return null;
  }
}

/**
 * Map a pointer position in the displayed image (CSS pixels relative to the img)
 * into SVG user-space coordinates using the depiction viewBox.
 */
export function displayPointToSvg(
  localX: number,
  localY: number,
  displaySize: { width: number; height: number },
  viewBox: SvgViewBox,
): { x: number; y: number } {
  const dw = displaySize.width || 1;
  const dh = displaySize.height || 1;
  return {
    x: viewBox.x + (localX / dw) * viewBox.width,
    y: viewBox.y + (localY / dh) * viewBox.height,
  };
}
