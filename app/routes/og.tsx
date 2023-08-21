import satori from "satori";
import { SatoriOptions } from "satori";
// import { join } from "path";
// import { readFile } from "node:fs/promises";
import svg2img from "svg2img";
import XDot from "~/components/XDot";

declare module "react" {
  interface HTMLAttributes<T> {
    tw?: string;
  }
}

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

export async function loader({ request }) {
  const jsx = (
    <div tw="w-full h-full flex">
      <div tw=" absolute bottom-0 left-0 flex align-text-bottom ">
        <h1 tw="text-4xl font-bold px-3 flex inline">
          <div tw="inset-0 absolute -top-2 -z-10 flex">
            <XDot tw="w-[4em] mx-auto opacity-25 flex" />
          </div>
          XenoSite
        </h1>
<div tw="my-auto text-xl"> Epoxidation </div>
      </div>
      <div tw=" w-full h-full text-white float-left"> Here </div>
      <div tw=" w-full h-full text-white float-left"> Here </div>
    </div>
  );

  const svg = await satori(jsx, {
    width: 600,
    height: 400,
    //debug: true,
    fonts: await fontData,
  });
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
