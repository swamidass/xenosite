import { MODELS } from "~/data";
import { Link } from "@remix-run/react";

function last_name(name) {
  name = name.split(".");
  name = name[name.length - 1];
  name = name.replace("_", " ");
  return name;
}

function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

export function ResultSummaryDisplay({ resolved_query, model }) {
  const results = resolved_query?.results || [];
  const resolved_name = resolved_query?.name;
  const modelInfo = model ? MODELS.find((x) => x.path == model) : undefined;

  return (
    <div >
      <div className="w-fit mx-auto hover:border rounded mt-10 relative p-10">
        <div className="flex mx-auto mb-5 justify-center flex-wrap">
          {results.map((r, i) => (
            <div key={i} className=" mx-2">
              <img
                className="max-w-full mx-auto "
                src={"data:image/svg+xml;utf8," + encodeURIComponent(r.depiction)}
              />
              {results.length > 1 ? (
                <div className="text-center w-100">{last_name(r.model)}</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="prose max-w-prose mx-auto">
          {resolved_name?.description ? (
            <>
              {resolved_name?.name ? (
                <div>
                  <h1 className="text-xl font-bold pb-3">{capitalize(resolved_name.name)}</h1>
                </div>
              ) : null}

              {/* Description */}
              <div className="pb-3 text-xs  text-gray-500">
                {resolved_query?.smiles}
              </div>
              {resolved_name.description} 

              {/* Chebi Id */}
              {resolved_name.chebi ? (
                <div>
                  {' '}Chebi:{' '}
                    <a
                      className="underline"
                      target="_blank"
                      rel="nofollow"
                      href={resolved_name.chebiUrl}
                    >
                      {resolved_name.chebi}
                    </a>
                  </div>
              ): null}
            </>
          ) : null}
        </div>

        <div className="print:hidden p-3 w-fit absolute bottom-0 right-0">
          <a
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(resolved_query, null, 2)
              );
            }}
            className="print:hidden text-gray-300 w-fit hover:text-black  ml-auto block hover:underline cursor-copy"
          >
            copy{/* <ClipboardDocumentIcon alt="copy" className="w-6" /> */}
          </a>
        </div>
      </div>
      {modelInfo ? (
        <div
          className="w-fit mx-auto prose relative text-sm p-10 mt-10 rounded-lg hover:border justify-center flex-wrap"
          key={modelInfo.path}
        >
          <h2>
            <Link
              className="no-underline hover:underline"
              to={`/${modelInfo.path}`}
              rel="prefetch"
            >
              {modelInfo.model}
            </Link>
          </h2>

          {modelInfo.info ? <modelInfo.info /> : null}
        </div>
      ): null}

    </ div>
  );
}
