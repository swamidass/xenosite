import { useNavigate, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import AboutModel from "~/components/AboutModel";
import InteractiveMoleculeDepiction from "~/components/InteractiveMoleculeDepiction";
import MetabolitePanel from "~/components/MetabolitePanel";
import { ModelTabs } from "~/components/ModelTabs";
import { capitalize } from "~/utils";
import { resolveModelInfo } from "~/data";
import {
  appendMetaboliteSegment,
  moleculeFocusUrl,
  parseSomSearchParams,
  somToSearchParams,
} from "~/utils/metabolitePath";
import type { MetaboliteRecord } from "~/utils/metabolites";
import { selectionModeFromResult, type SiteHit } from "~/utils/siteHitTest";
import type { SomHighlight } from "~/utils/somOverlay";

function last_name(name: string) {
  const words = name.split(".");
  let lastName = words[words.length - 1];
  lastName = lastName.replace("_", " ");
  return lastName;
}

function collectMetabolites(results: any[] | undefined): MetaboliteRecord[] {
  const out: MetaboliteRecord[] = [];
  for (const r of results || []) {
    for (const m of r.metabolite || []) {
      if (m?.smiles) out.push(m as MetaboliteRecord);
    }
  }
  return out;
}

export type MoleculeFocusProps = {
  resolved_query: any;
  model: string;
  segments: string[];
};

/**
 * Single page body at every path depth: depiction → tabs → about → metabolites.
 */
export default function MoleculeFocus({
  resolved_query,
  model,
  segments,
}: MoleculeFocusProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [externalHover, setExternalHover] = useState<SomHighlight | null>(null);

  const results = resolved_query?.results || [];
  const metabolites = collectMetabolites(results);

  if (resolved_query?.detail) {
    return (
      <div className="w-fit mx-auto mt-10 relative p-10">
        {resolved_query.detail}
      </div>
    );
  }

  const resolved_name = resolved_query?.name;
  const modelLabel = resolveModelInfo(model)?.model ?? model ?? "XenoSite";
  const moleculeName = resolved_name?.name
    ? capitalize(resolved_name.name)
    : resolved_query?.smiles ?? "Molecule";

  const som = parseSomSearchParams(searchParams);
  const selected: SomHighlight | null = som.atomIdxs?.length
    ? { atomIdxs: som.atomIdxs, bondIdx: som.bondIdx }
    : null;

  const primaryResult = results[0] || {};
  const selectionMode = selectionModeFromResult(primaryResult);

  const siteSelection = selected
    ? { atomIdxs: selected.atomIdxs, bondIdx: selected.bondIdx }
    : null;

  const incompleteSom = !selected;

  const applyHit = (hit: SiteHit | null) => {
    if (!hit) {
      setSearchParams({}, { replace: true });
      return;
    }
    const next = somToSearchParams({
      atomIdxs: hit.atomIdxs,
      bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
    });
    setSearchParams(next, { replace: true });
  };

  const onSelectMetabolite = (m: MetaboliteRecord) => {
    const nextSegments = appendMetaboliteSegment(segments, m.smiles);
    navigate(moleculeFocusUrl({ model, segments: nextSegments }));
  };

  const onHoverMetabolite = (m: MetaboliteRecord | null) => {
    if (!incompleteSom || !m?.atom?.length) {
      setExternalHover(null);
      return;
    }
    setExternalHover({ atomIdxs: m.atom.map(Number) });
  };

  return (
    <div className="mx-auto mt-6 relative w-full">
      <div className="w-fit mx-auto relative px-4 py-6">
        <div className="flex mx-auto mb-5 justify-center flex-wrap gap-4">
          {results.map((r: any, i: number) => (
            <div key={i} className="mx-2">
              {r.depiction ? (
                <InteractiveMoleculeDepiction
                  svg={r.depiction}
                  alt={`${moleculeName} ${
                    results.length > 1 ? last_name(r.model) : modelLabel
                  } prediction`}
                  bondsIdx={resolved_query?.bonds?.idx}
                  selectionMode={selectionMode}
                  selected={selected}
                  externalHover={externalHover}
                  onSelect={applyHit}
                />
              ) : null}
              {results.length > 1 ? (
                <div className="text-center w-100">{last_name(r.model)}</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="prose max-w-prose mx-auto">
          {resolved_name?.name || resolved_query?.smiles ? (
            <>
              {resolved_name?.name ? (
                <h1 className="text-xl font-bold pb-3">
                  {capitalize(resolved_name.name)}
                </h1>
              ) : null}
              <div className="pb-3 text-xs text-gray-500">
                {resolved_query?.smiles}
              </div>
              {resolved_name?.description ? (
                <>
                  {resolved_name.description}
                  {resolved_name.chebi ? (
                    <span>
                      {" "}
                      [
                      <a
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={resolved_name.chebiUrl}
                      >
                        CHEBI
                      </a>
                      ]
                    </span>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="print:hidden p-3 w-fit absolute bottom-0 right-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(resolved_query, null, 2),
              );
            }}
            className="print:hidden text-gray-300 w-fit hover:text-black ml-auto block hover:underline cursor-copy"
          >
            copy
          </button>
        </div>
      </div>

      <ModelTabs segments={segments} />
      <AboutModel model={model} />

      <MetabolitePanel
        metabolites={metabolites}
        selection={siteSelection}
        onSelectMetabolite={onSelectMetabolite}
        onHoverMetabolite={onHoverMetabolite}
      />
    </div>
  );
}
