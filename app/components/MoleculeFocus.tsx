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
  encodeHeadParam,
  moleculeFocusUrl,
  parseSomSearchParams,
  resolveHeadIndex,
  somToSearchParams,
} from "~/utils/metabolitePath";
import {
  collectMetabolites,
  findMetaboliteBySmiles,
  type MetaboliteRecord,
} from "~/utils/metabolites";
import { selectionModeFromResult, type SiteHit } from "~/utils/siteHitTest";
import {
  normalizeBondsIdx,
  type SomHighlight,
} from "~/utils/somOverlay";

function last_name(name: string) {
  const words = name.split(".");
  let lastName = words[words.length - 1];
  lastName = lastName.replace("_", " ");
  return lastName;
}

/** Map a metabolite's parent atoms to an overlay highlight (bond if possible). */
export function somFromMetabolite(
  m: MetaboliteRecord | null | undefined,
  bondsIdx: unknown,
): SomHighlight | null {
  if (!m?.atom?.length) return null;
  const atomIdxs = m.atom
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0);
  if (!atomIdxs.length) return null;
  const bonds = normalizeBondsIdx(bondsIdx);
  if (atomIdxs.length === 2 && bonds.length) {
    const [a, b] = atomIdxs;
    const bondIdx = bonds.findIndex(
      ([x, y]) => (x === a && y === b) || (x === b && y === a),
    );
    if (bondIdx >= 0) return { atomIdxs, bondIdx };
  }
  return { atomIdxs };
}

export type MoleculeFocusProps = {
  /** Prediction for each path segment (root … leaf), same model. */
  chain: any[];
  model: string;
  segments: string[];
};

type GenerationProps = {
  depth: number;
  chain: any[];
  model: string;
  segments: string[];
};

function Generation({ depth, chain, model, segments }: GenerationProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hover, setHover] = useState<{
    highlight: SomHighlight;
    headIndex: number;
  } | null>(null);

  const resolved_query = chain[depth];
  if (!resolved_query) return null;

  if (resolved_query.detail) {
    return (
      <div className="w-fit mx-auto mt-6 relative p-6 text-sm text-gray-600">
        {resolved_query.detail}
      </div>
    );
  }

  const results = resolved_query?.results || [];
  // Metabolites from every head, each tagged with headIndex / headModel.
  const metabolites = collectMetabolites(results);
  const childSmiles = segments[depth + 1] || null;
  const childMet = findMetaboliteBySmiles(metabolites, childSmiles);

  const resolved_name = resolved_query?.name;
  const modelLabel = resolveModelInfo(model)?.model ?? model ?? "XenoSite";
  const moleculeName = resolved_name?.name
    ? capitalize(resolved_name.name)
    : resolved_query?.smiles ?? "Molecule";

  const somFromSearch = parseSomSearchParams(searchParams);
  const searchHeadIndex = resolveHeadIndex(somFromSearch.head, results);

  // Path-selected metabolite owns the highlight head; else URL ?head= + atoms/bond.
  const pathHighlight = somFromMetabolite(childMet, resolved_query?.bonds?.idx);
  const searchHighlight: SomHighlight | null =
    !childMet &&
    depth === 0 &&
    searchHeadIndex != null &&
    (somFromSearch.atomIdxs?.length || somFromSearch.bondIdx != null)
      ? {
          atomIdxs: somFromSearch.atomIdxs || [],
          bondIdx: somFromSearch.bondIdx,
        }
      : null;

  const selectedHighlight = pathHighlight || searchHighlight;
  const selectedHeadIndex = childMet
    ? typeof childMet.headIndex === "number"
      ? childMet.headIndex
      : null
    : searchHeadIndex;

  const siteSelection = childMet
    ? { metaboliteSmiles: childMet.smiles }
    : selectedHighlight && selectedHeadIndex != null
      ? {
          atomIdxs: selectedHighlight.atomIdxs,
          bondIdx: selectedHighlight.bondIdx,
        }
      : null;

  const applyHit = (hit: SiteHit | null, headIndex: number) => {
    if (childSmiles) return;
    if (!hit) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams(
      somToSearchParams({
        atomIdxs: hit.atomIdxs,
        bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
        head: encodeHeadParam(headIndex, results),
      }),
      { replace: true },
    );
  };

  const onSelectMetabolite = (m: MetaboliteRecord) => {
    const base = segments.slice(0, depth + 1);
    const nextSegments = appendMetaboliteSegment(base, m.smiles);
    // Carry the source head into the URL so the parent SOM stays scoped.
    const head =
      typeof m.headIndex === "number"
        ? encodeHeadParam(m.headIndex, results)
        : m.headModel
          ? encodeHeadParam(
              resolveHeadIndex(m.headModel, results) ?? 0,
              results,
            )
          : null;
    const som = somFromMetabolite(m, resolved_query?.bonds?.idx);
    const search = somToSearchParams({
      atomIdxs: som?.atomIdxs,
      bondIdx: som?.bondIdx,
      head,
    }).toString();
    navigate(
      moleculeFocusUrl({
        model,
        segments: nextSegments,
        search: search || undefined,
      }),
    );
  };

  const onHoverMetabolite = (m: MetaboliteRecord | null) => {
    if (!m?.atom?.length || typeof m.headIndex !== "number") {
      setHover(null);
      return;
    }
    const highlight = somFromMetabolite(m, resolved_query?.bonds?.idx);
    if (!highlight) {
      setHover(null);
      return;
    }
    setHover({ highlight, headIndex: m.headIndex });
  };

  const segmentsThroughHere = segments.slice(0, depth + 1);

  return (
    <div
      className={
        depth === 0 ? "mx-auto relative w-full" : "mx-auto relative w-full mt-2"
      }
    >
      <div
        className={
          depth === 0
            ? "w-fit mx-auto relative px-4 py-6"
            : "w-fit mx-auto relative px-4 py-3"
        }
      >
        <div className="flex mx-auto mb-4 justify-center flex-wrap gap-4">
          {results.map((r: any, i: number) => {
            const mode = selectionModeFromResult(r);
            const isSelectedHead = selectedHeadIndex === i;
            const isHoverHead = hover?.headIndex === i;
            return (
              <div key={r.model || i} className="mx-2">
                {r.depiction ? (
                  <InteractiveMoleculeDepiction
                    svg={r.depiction}
                    alt={`${moleculeName} ${
                      results.length > 1 ? last_name(r.model) : modelLabel
                    } prediction`}
                    bondsIdx={resolved_query?.bonds?.idx}
                    selectionMode={mode}
                    selected={isSelectedHead ? selectedHighlight : null}
                    externalHover={isHoverHead ? hover?.highlight : null}
                    onSelect={
                      childSmiles ? undefined : (hit) => applyHit(hit, i)
                    }
                  />
                ) : null}
                {results.length > 1 ? (
                  <div className="text-center w-100 text-xs text-gray-500">
                    {last_name(r.model)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {depth === 0 ? (
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
        ) : (
          <div className="text-center text-xs text-gray-500 pb-1">
            {resolved_name?.name
              ? capitalize(resolved_name.name)
              : resolved_query?.smiles}
          </div>
        )}

        {depth === 0 ? (
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
        ) : null}
      </div>

      {depth > 0 ? (
        <>
          <ModelTabs nested segments={segmentsThroughHere} />
          <AboutModel nested model={model} />
        </>
      ) : null}

      {childSmiles ? (
        <div className="border-t border-gray-100">
          <Generation
            depth={depth + 1}
            chain={chain}
            model={model}
            segments={segments}
          />
        </div>
      ) : (
        <MetabolitePanel
          metabolites={metabolites}
          selection={siteSelection}
          onSelectMetabolite={onSelectMetabolite}
          onHoverMetabolite={onHoverMetabolite}
        />
      )}
    </div>
  );
}

/**
 * Generational stack: root stays visible; /m/ hops nest below with SOM on the
 * producer and a nested model menu under each selected metabolite.
 */
export default function MoleculeFocus({
  chain,
  model,
  segments,
}: MoleculeFocusProps) {
  if (!chain?.length) return null;
  return (
    <Generation depth={0} chain={chain} model={model} segments={segments} />
  );
}
