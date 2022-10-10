import { Fragment } from "react";
import { Link } from "remix";
import { MODELS } from "~/data";

export default function Model() {
  return (
    <div className="prose max-w-prose py-20 mx-auto text-sm">
      <p>
        XenoSite predicts how small-molecules are metabolized by liver enzymes,
        and if they are prone to covalently attach to biological molecules.
      </p>

      {MODELS.map((x) => (
        <Fragment key={x.path}>
          <h2>
            <Link className="no-underline hover:underline" to={`/${x.path}`}>
              {x.model}
            </Link>
          </h2>

          {x.info ? <x.info /> : null}
        </Fragment>
      ))}
    </div>
  );
}
