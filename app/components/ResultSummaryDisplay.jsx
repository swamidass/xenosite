import { useLoaderData } from "remix";

function last_name(name) {
  name = name.split(".");
  return name[name.length - 1];
}

export function ResultSummaryDisplay() {
  const { response, resolved_name } = useLoaderData() || {};
  const results = response?.results || [];

  return (
    <div className="flex flex-wrap">
      <div className="flex mx-auto my-10 justify-center flex-wrap">
        {results.map((r, i) => (
          <div key={i}>
            <div dangerouslySetInnerHTML={{ __html: r.depiction }} />
            {results.length > 1 ? (
              <div className="text-center">{last_name(r.model)}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="w-full pb-5">
        <a
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
          }}
          className="text-gray-300 w-fit hover:text-black  ml-auto block hover:underline cursor-pointer"
        >
          copy
        </a>
      </div>

      <div className="prose max-w-prose mx-auto">
        {resolved_name?.description ? (
          <>
            {resolved_name?.name ? (
              <div>
                <h1 className="text-xl font-bold pb-3">{resolved_name.name}</h1>
              </div>
            ) : null}
            {resolved_name.description.Description} [
            <a
              className="underline"
              href={resolved_name.description.DescriptionURL}
            >
              {resolved_name.description.DescriptionSourceName}
            </a>
            ]
          </>
        ) : null}
      </div>
    </div>
  );
}
