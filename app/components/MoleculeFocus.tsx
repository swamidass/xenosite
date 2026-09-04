import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { useState, type ReactNode } from "react";
import AboutModel from "~/components/AboutModel";
import GenerationBanner from "~/components/GenerationBanner";
import InteractiveMoleculeDepiction from "~/components/InteractiveMoleculeDepiction";
import MetabolitePanel from "~/components/MetabolitePanel";
import MoleculeIdentity from "~/components/MoleculeIdentity";
import { ModelTabs } from "~/components/ModelTabs";
import { resolveModelInfo } from "~/data";
import {
  encodeHeadParam,
  moleculeFocusUrl,
  parseMetaboliteMetaParams,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  somToSearchParams,
  withMetaboliteMetaParams,
  type FocusGeneration,
} from "~/utils/metabolitePath";
import {
  collectMetabolites,
  findMetaboliteBySmiles,
  formatPathwayLabel,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";
import { moleculeDisplayName } from "~/utils/moleculeIdentity";
import { selectionModeFromResult, type SiteHit } from "~/utils/siteHitTest";
import {
  effectiveMetabolitePanelSelection,
  hitToSiteSelection,
  metaboliteSelectUrl,
  somSelectUrl,
  toggleSomHighlight,
} from "~/utils/somInteraction";
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
  /** Nested Remix outlet / deeper stack. */
  children?: ReactNode;
  /** Show metabolite panel under this generation. */
  showPanel?: boolean;
  /**
   * When true, identity is rendered by the app shell (root under search).
   * Nested generations always render their own identity.
   */
  identityInShell?: boolean;
};

/**
 * One generation: identity (unless shelled), model tabs, depictions, panel.
 */
export function GenerationView({
  depth,
  resolved_query,
  model,
  generations,
  children,
  showPanel = false,
  identityInShell = false,
}: GenerationViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [hover, setHover] = useState<{
    highlight: SomHighlight;
    headIndex: number;
  } | null>(null);
  const [siteHover, setSiteHover] = useState<SiteSelection | null>(null);

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

  const modelLabel = resolveModelInfo(model)?.model ?? model ?? "XenoSite";
  const moleculeName =
    moleculeDisplayName(resolved_query?.name) ||
    resolved_query?.smiles ||
    "Molecule";

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

  const committedSelection: SiteSelection | null = childMet
    ? { metaboliteSmiles: childMet.smiles }
    : selectedHighlight && selectedHeadIndex != null
      ? {
          atomIdxs: selectedHighlight.atomIdxs,
          bondIdx: selectedHighlight.bondIdx,
        }
      : null;

  const panelSelection = effectiveMetabolitePanelSelection({
    childQuery,
    committed: committedSelection,
    hover: childQuery ? null : siteHover,
  });

  const metaboliteMeta = parseMetaboliteMetaParams(searchParams);

  const applyHit = (hit: SiteHit | null, headIndex: number) => {
    const nextHighlight: SomHighlight | null = hit
      ? {
          atomIdxs: hit.atomIdxs,
          bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
        }
      : null;

    // Metabolite hop active: SOM click leaves the hop and filters the list.
    if (childQuery) {
      if (!nextHighlight) {
        navigate(somSelectUrl({ generations, depth }));
        return;
      }
      navigate(
        somSelectUrl({
          generations,
          depth,
          atomIdxs: nextHighlight.atomIdxs,
          bondIdx: nextHighlight.bondIdx,
          head: encodeHeadParam(headIndex, results),
        }),
      );
      return;
    }

    const toggled = toggleSomHighlight(selectedHighlight, nextHighlight);
    if (!toggled) {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
      return;
    }
    const search = somToSearchParams({
      atomIdxs: toggled.atomIdxs,
      bondIdx: toggled.bondIdx,
      head: encodeHeadParam(headIndex, results),
    }).toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true },
    );
  };

  const onSelectMetabolite = (m: MetaboliteRecord) => {
    if (childQuery && childQuery === m.smiles) {
      navigate(
        metaboliteSelectUrl({
          generations,
          depth,
          metaboliteSmiles: m.smiles,
          childQuery,
        }),
      );
      return;
    }
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
    const search = withMetaboliteMetaParams(
      somToSearchParams({
        atomIdxs: som?.atomIdxs,
        bondIdx: som?.bondIdx,
        head,
      }),
      { pathway: m.pathway, score: m.score },
    ).toString();
    navigate(
      moleculeFocusUrl({
        generations: [
          ...generations.slice(0, depth + 1),
          {
            model: generations[depth]?.model || model,
            query: m.smiles,
          },
        ],
        search: search || undefined,
      }),
    );
  };

  const onHoverMetabolite = (m: MetaboliteRecord | null) => {
    if (childQuery) {
      setHover(null);
      return;
    }
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

  const showIdentity = depth > 0 || !identityInShell;

  return (
    <div
      className={
        depth === 0 ? "mx-auto relative w-full" : "mx-auto relative w-full"
      }
    >
      {depth > 0 ? <GenerationBanner depth={depth} className="mt-6 mb-4" /> : null}

      {showIdentity ? (
        <div className="px-2 pb-2">
          <MoleculeIdentity
            resolved_query={resolved_query}
            showCopy
            headingLevel={depth === 0 ? 1 : 2}
          />
          {depth > 0 &&
          (metaboliteMeta.pathway || metaboliteMeta.score != null) ? (
            <div className="mt-1 text-center text-xs text-gray-600">
              {metaboliteMeta.pathway
                ? formatPathwayLabel(metaboliteMeta.pathway)
                : null}
              {metaboliteMeta.pathway && metaboliteMeta.score != null
                ? " · "
                : null}
              {metaboliteMeta.score != null
                ? metaboliteMeta.score.toFixed(2)
                : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {depth > 0 ? (
        <>
          <ModelTabs depth={depth} generations={generations} />
          <AboutModel model={model} />
        </>
      ) : null}

      <div
        className={
          depth === 0
            ? "w-fit max-w-full mx-auto relative px-2 py-4 sm:px-4"
            : "w-fit max-w-full mx-auto relative px-2 py-3 sm:px-4"
        }
      >
        <div className="flex mx-auto mb-4 justify-center flex-wrap gap-4">
          {results.map((r: any, i: number) => {
            const mode = selectionModeFromResult(r);
            const isSelectedHead = selectedHeadIndex === i;
            const isHoverHead = hover?.headIndex === i;
            return (
              <div key={r.model || i} className="mx-2 max-w-full">
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
                    onSelect={(hit) => applyHit(hit, i)}
                    onHover={
                      childQuery
                        ? undefined
                        : (hit) => {
                            setSiteHover(hitToSiteSelection(hit));
                          }
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
      </div>

      {showPanel ? (
        <MetabolitePanel
          metabolites={metabolites}
          selection={panelSelection}
          selectedSmiles={childQuery}
          depth={depth}
          onSelectMetabolite={onSelectMetabolite}
          onHoverMetabolite={onHoverMetabolite}
        />
      ) : null}

      {/* Nested generations render after this generation's metabolite panel. */}
      {children}
    </div>
  );
}

/**
 * Root layout: generation 0 depiction + Outlet for /m/* .
 * Identity for depth 0 is rendered in the app shell under the search box.
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
      showPanel
      identityInShell
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
          <GenerationView
            key={`${gen.model}:${gen.query}:${depth}`}
            depth={depth}
            resolved_query={resolved}
            model={gen.model}
            generations={generations}
            showPanel={isLeaf}
          />
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
