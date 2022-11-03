import { MODELS } from "~/data";
import { Link, useMatches } from "remix";

export default function Model() {
  const { model, query } = useMatches()[0].params;
  const modelinfo = MODELS.find((x) => x.path == model);

  return (
    <div className="prose max-w-prose py-20 mx-auto text-sm">
      <h2>
        <Link
          className="no-underline hover:underline"
          to={`/${modelinfo.path}`}
        >
          {modelinfo.model}
        </Link>
      </h2>

      {modelinfo.info ? <modelinfo.info /> : null}
    </div>
  );
}
