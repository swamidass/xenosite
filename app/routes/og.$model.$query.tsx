import { LoaderFunctionArgs } from "@remix-run/node";
import satori from "satori";
import { SatoriOptions } from "satori";
import svg2img from "svg2img";
import OpenGraphImage from "~/components/OpenGraphImage";
import XDot from "~/components/XDot";
import { resolve_query } from "~/loaders/backend.server";
import { chooseRandom } from "~/utils";


async function getFont(
  font: string,
  weights = [400, 700],
  text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\!@#$%^&*()_+-=<>?[]{}|;:,.`'’\"–—"
) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${font}:wght@${weights.join(
      ";"
    )}&text=${encodeURIComponent(text)}`,
    {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    }
  ).then((response) => response.text());
  const resource = css.matchAll(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/g
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
      }))
  ) as Promise<SatoriOptions["fonts"]>;
}

const fontData = getFont("Roboto");

export async function loader({
  params,
}: LoaderFunctionArgs) {
  console.log(params);

  // Get the depiction.
  let jsx: React.ReactElement | string = <XDot />;
  const response = await resolve_query({
    model: params.model || "_",
    query: params.query || null,
  });
  if(response.resolved_query) {
    // console.log(response);
    // console.log(response.resolved_query);
    // console.log(response.resolved_query.results);
    
    const name = response.resolved_query.name ? response.resolved_query.name.name : response.resolved_query.smiles;
    const majorModel = response.model == "_" ? "All Models" : response.model;
    const choice = chooseRandom(response.resolved_query.results)
    const subModel = choice.model ? choice.model.includes(".") ? choice.model.split(".")[1] : null : null;
    const model = subModel ? `${majorModel}: ${subModel}` : majorModel;
    const depiction = choice.depiction;

    jsx = ( 
      <OpenGraphImage name={name} model={model} depiction={depiction} /> 
    )
  }

  // Create the SVG.
  const svg = await satori(jsx, {
    width: 600,
    height: 400,
    //debug: true,
    fonts: await fontData,
  });

  // Convert the SVG to PNG.
  const { data, error } = await new Promise(
    (
      resolve: (value: { data: Buffer | null; error: Error | null }) => void
    ) => {
      svg2img(
        svg,
        {
          resvg: {
            fitTo: {
              mode: "width", // or height
              value: 1200,
            },
          },
        },
        (error, buffer) => {
          if (error) {
            resolve({ data: null, error });
          } else {
            resolve({ data: buffer, error: null });
          }
        }
      );
    }
  );

  // Return the response.
  if (error) {
    return new Response(error.toString(), {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
  return new Response(data, {
    headers: {
      "Content-Type": "image/png", 
    },
  });
}
