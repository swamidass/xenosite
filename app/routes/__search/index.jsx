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
      <p>
        This website is free for all academic and evaluative use. Licenses are
        available for secure commercial access and access to the programatic
        API.
      </p>
      <p>
        Tell us what you think. Post any comments, questions or problems on the{" "}
        <a target="_blank" href="https://discourse.xenosite.org">
          forum
        </a>
        .
      </p>

      {MODELS.map((x) => (
        <Fragment key={x.path}>
          <h2>
            <Link
              className="no-underline hover:underline"
              to={`/${x.path}`}
              rel="prefetch"
            >
              {x.model}
            </Link>
          </h2>

          {x.info ? <x.info /> : null}
        </Fragment>
      ))}

      <h2>Coming soon...</h2>

      <p>
        {" "}
        This website is under active development. More models will be available
        soon. Tell us what to prioritize on the{" "}
        <a target="_blank" href="https://discourse.xenosite.org">
          forum
        </a>
        .
      </p>
    </div>
  );
}
