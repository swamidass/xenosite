import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { useState, type ReactNode } from "react";
import AboutModel from "~/components/AboutModel";
import InteractiveMoleculeDepiction from "~/components/InteractiveMoleculeDepiction";
import MetabolitePanel from "~/components/MetabolitePanel";
import { ModelTabs } from "~/components/ModelTabs";
import { capitalize } from "~/utils";
import { resolveModelInfo } from "~/data";
import {
  appendMetaboliteGeneration,
  encodeHeadParam,
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  somToSearchParams,
  type FocusGeneration,
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

export type GenerationViewProps = {
  depth: number;
  resolved_query: any;
  model: string;
  generations: FocusGeneration[];
  /** Nested Remix outlet / deeper stack. Suppresses this generation's panel. */
  children?: ReactNode;
  /** Show metabolite panel under this generation (leaf). */
  showPanel?: boolean;
};

/**
 * One generation: depiction(s), optional nested model tabs, then children or panel.
 */
export function GenerationView({
  depth,
  resolved_query,
  model,
  generations,
  children,
  showPanel = false,
}: GenerationViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [hover, setHover] = useState<{
    highlight: SomHighlight;
    headIndex: number;
  } | null>(null);

  if (!resolved_query) return null;

  if (resolved_query.detail) {
    return (
      <div className="w-fit mx-auto mt-6 relative p-6 text-sm text-gray-600">
        {resolved_query.detail}
      </div>
    );
  }

  const results = resolved_query?.results || [];
  const metabolites = collectMetabolites(results);
  const childQuery = generations[depth + 1]?.query || null;
  const childMet = findMetaboliteBySmiles(metabolites, childQuery);

  const resolved_name = resolved_query?.name;
  const modelLabel = resolveModelInfo(model)?.model ?? model ?? "XenoSite";
  const moleculeName = resolved_name?.name
    ? capitalize(resolved_name.name)
    : resolved_query?.smiles ?? "Molecule";

  const somFromSearch = parseSomSearchParams(searchParams);
  const searchHeadIndex = resolveHeadIndex(somFromSearch.head, results);

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
    if (childQuery) return;
    // Replace the search string entirely so a new SOM never stacks on the prior one.
    if (!hit) {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
      return;
    }
    const search = somToSearchParams({
      atomIdxs: hit.atomIdxs,
      bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
      head: encodeHeadParam(headIndex, results),
    }).toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true },
    );
  };

  const onSelectMetabolite = (m: MetaboliteRecord) => {
    const base = generations.slice(0, depth + 1);
    const next = appendMetaboliteGeneration(base, m.smiles);
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
        generations: next,
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
                      childQuery ? undefined : (hit) => applyHit(hit, i)
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
          <ModelTabs nested depth={depth} generations={generations} />
          <AboutModel nested model={model} />
        </>
      ) : null}

      {children}
      {showPanel && !childQuery ? (
        <MetabolitePanel
          metabolites={metabolites}
          selection={siteSelection}
          onSelectMetabolite={onSelectMetabolite}
          onHoverMetabolite={onHoverMetabolite}
        />
      ) : null}
    </div>
  );
}

/**
 * Root layout: generation 0 depiction + Outlet for /m/* (panel when no nested hops).
 */
export function MoleculeFocusRootLayout({
  resolved_query,
  model,
  query,
}: {
  resolved_query: any;
  model: string;
  query: string;
}) {
  const location = useLocation();
  const parsed = parseMoleculeFocusPath(location.pathname);
  const generations =
    parsed?.generations?.length
      ? parsed.generations
      : [{ model, query }];
  const hasNested = generations.length > 1;

  return (
    <GenerationView
      depth={0}
      resolved_query={resolved_query}
      model={model}
      generations={generations}
      showPanel={!hasNested}
    >
      {hasNested ? <Outlet /> : null}
    </GenerationView>
  );
}

/**
 * Nested /m/* stack after the root. Leaf generation shows its metabolite panel.
 */
export function MoleculeFocusNestedStack({
  chain,
  generations,
}: {
  chain: any[];
  generations: FocusGeneration[];
}) {
  if (!chain.length) return null;

  return (
    <>
      {chain.map((resolved, i) => {
        const depth = i + 1;
        const gen = generations[depth];
        if (!gen) return null;
        const isLeaf = i === chain.length - 1;
        return (
          <div
            key={`${gen.model}:${gen.query}:${depth}`}
            className="border-t border-gray-100"
          >
            <GenerationView
              depth={depth}
              resolved_query={resolved}
              model={gen.model}
              generations={generations}
              showPanel={isLeaf}
            />
          </div>
        );
      })}
    </>
  );
}

/** @deprecated Prefer MoleculeFocusRootLayout / NestedStack. */
export default function MoleculeFocus({
  chain,
  model,
  segments,
}: {
  chain: any[];
  model: string;
  segments: string[];
}) {
  const generations = (segments || []).map((query) => ({ model, query }));
  if (!chain?.length) return null;
  return (
    <GenerationView
      depth={0}
      resolved_query={chain[0]}
      model={model}
      generations={generations}
      showPanel={chain.length === 1}
    >
      {chain.length > 1 ? (
        <MoleculeFocusNestedStack
          chain={chain.slice(1)}
          generations={generations}
        />
      ) : null}
    </GenerationView>
  );
}
