import React from 'react';

interface OpenGraphImageProps {
    name: string;
    model: string;
    depiction: string;
    width?: number;
    height?: number;
}

export default function OpenGraphImage({ name, model, depiction, width, height }: OpenGraphImageProps) {
    const ratio = 600 / 400;
    const w = width ? (width * ratio).toFixed(0).toString() : "400";
    // const h = height ? (height / ratio).toFixed(0).toString() : "267";

    return (
        <div tw="flex flex-col w-full h-full justify-center bg-white">
            <div tw="flex flex-row justify-center">
                <img
                    src={"data:image/svg+xml;utf8," + encodeURIComponent(depiction)}
                    alt=""
                    width={w} // keeps aspect ratio if only width is set
                />
            </div>
            <div tw="flex flex-col text-2xl text-gray-800 text-center max-w-lg mx-auto">
                <div tw="flex text-center justify-center">{`Xenosite - ${model}`}</div>
                <div tw="flex text-center justify-center">{name}</div>
            </div>
      </div>
      );
}