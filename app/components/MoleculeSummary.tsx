import { capitalize } from "~/utils";

function last_name(name: string) {
    const words = name.split(".");
    let lastName = words[words.length - 1];
    lastName = lastName.replace("_", " ");

    return lastName;
}

interface ResultSummaryDisplayProps {
    resolved_query: {
        results?: any[];
        name?: {
            name?: string;
            description?: string;
            chebi?: string;
            chebiUrl?: string;
        };
        smiles?: string;
        description?: string;
        detail?: string;
    };
    model?: string;
}

export default function MoleculeSummary({ resolved_query }: ResultSummaryDisplayProps) {
  if(resolved_query.detail) {
    return (
      <div className="w-fit mx-auto mt-10 relative p-10">
        {resolved_query.detail}
      </div>
    );
  }
  
  const results = resolved_query?.results || [];
  const resolved_name = resolved_query?.name;
  // console.log(resolved_query);

  return (
    <div className="w-fit mx-auto hover:border rounded mt-10 relative p-10">

        <div className="flex mx-auto mb-5 justify-center flex-wrap">
            {results.map((r, i) => (
                <div key={i} className="mx-2">
                    <img
                        className="max-w-full mx-auto "
                        src={"data:image/svg+xml;utf8," + encodeURIComponent(r.depiction)}
                        alt=""
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
                <span>
                  {' '}[
                    <a
                      className="underline"
                      target="_blank"
                      rel="nofollow noreferrer"
                      href={resolved_name.chebiUrl}
                    >
                      CHEBI
                    </a>
                  ]
                </span>
              ): null}
            </>
          ) : null}
        </div>

        <div className="print:hidden p-3 w-fit absolute bottom-0 right-0">
            <button
                onClick={() => {
                    navigator.clipboard.writeText(
                        JSON.stringify(resolved_query, null, 2)
                    );
                }}
                className="print:hidden text-gray-300 w-fit hover:text-black  ml-auto block hover:underline cursor-copy"
            >
                copy{/* <ClipboardDocumentIcon alt="copy" className="w-6" /> */}
            </button>
        </div>
    </div>
  );
}
