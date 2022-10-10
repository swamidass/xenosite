import { json } from "react";
import { Link } from "remix";
import { MODELS } from "~/data";

export default function Model() {
  return (
    <>
      <div className="prose max-w-prose py-20 mx-auto text-sm">
        <h2>What is XenoSite?</h2>
        <p>
          <b>XenoSite</b> predicts how small-molecules become toxic after
          metabolism by liver enzymes.
        </p>

        <h2> Getting Help </h2>
        <p>
          Post comments, questions or problems on the{" "}
          <a target="_blank" href="https://discourse.xenosite.org">
            forum
          </a>
          .
        </p>

        <h2> Terms of Use </h2>
        <p>
          This website and the results it reports are free for all academic and
          non-commercial use. Licenses are available for secure commercial
          access and access to the programatic API.
        </p>

        <h2>More to Come</h2>

        <p>
          This site is under active development. More models and features will
          be available soon.{" "}
          <a
            target="_blank"
            href={
              "https://scholar.google.com/citations?user=oWGEj78AAAAJ&hl=en&oi=sra"
            }
          >
            What
          </a>{" "}
          should we prioritize? Tell us on the{" "}
          <a target="_blank" href="https://discourse.xenosite.org">
            forum
          </a>
          .
        </p>
      </div>
      <div className=" flex flex-wrap  justify-evenly items-start">
        {MODELS.map((x) => (
          <div
            className="prose text-sm max-w-prose border p-3 rounded-lg align-top m-3  hover:shadow hover:bg-slate-50"
            key={x.path}
          >
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
          </div>
        ))}
      </div>
    </>
  );
}
