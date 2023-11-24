

interface OpenGraphImageProps {
    name: string;
    model: string;
    depiction: string;
}

export default function OpenGraphImage({ name, model, depiction }: OpenGraphImageProps) {
    return (
        <div tw="w-full h-full flex">
            <div tw="flex flex-col justify-center content-center">
                <img
                    className="max-w-full"
                    src={"data:image/svg+xml;utf8," + encodeURIComponent(depiction)}
                    alt=""
                />
                <div tw="text-4xl font-bold text-center absolute bottom-2 left-10">
                    {`${model}: ${name}`}
                </div>
            </div>
        </div>
    );
}