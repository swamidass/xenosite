import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
  useParams,
  useOutlet,
  useOutletContext,
  useSearchParams,
} from "@remix-run/react";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import AboutModel from "~/components/AboutModel";
import GenerationBanner from "~/components/GenerationBanner";
import InteractiveMoleculeDepiction from "~/components/InteractiveMoleculeDepiction";
import LazyMetaboliteImg from "~/components/LazyMetaboliteImg";
import MetabolitePanel from "~/components/MetabolitePanel";
import MoleculeIdentity from "~/components/MoleculeIdentity";
import { ModelTabs } from "~/components/ModelTabs";
import Spinner from "~/components/Spinner";
import { resolveModelInfo } from "~/data";
import {
  EMPTY_HOP_OUTLET_CONTEXT,
  type HopOutletContext,
} from "~/molecule-focus/hopOutletContext";
import {
  canAppendMetaboliteHop,
  generationsFromParams,
  hasPredictionModel,
  moleculeFocusUrl,
  parseMoleculeFocusPath,
  parseSomSearchParams,
  resolveHeadIndex,
  encodeHeadParam,
  somToSearchParams,
  type FocusGeneration,
} from "~/utils/metabolitePath";
import {
  collectMetabolites,
  findMetaboliteBySmiles,
  formatPathwayLabel,
  matchFormationEdge,
  metaboliteMatchIndex,
  validateChildFormationEdge,
  type MetaboliteRecord,
  type SiteSelection,
} from "~/utils/metabolites";
import { moleculeDisplayName } from "~/utils/moleculeIdentity";
import { isNestedPredictionNavigation } from "~/utils/navigationLoading";
import {
  selectionModeFromResult,
  type SelectionMode,
  type SiteHit,
} from "~/utils/siteHitTest";
import {
  applyPairAtomClick,
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
import { classNames } from "~/utils";

type FormationMeta = {
  pathway?: string | null;
  score?: number | null;
};

function last_name(name: string) {
  const words = name.split(".");
  let lastName = words[words.length - 1];
  lastName = lastName.replace("_", " ");
  return lastName;
}

/**
 * Map a metabolite's parent atoms to an overlay highlight.
 * Bond midpoint only for bond / atom+bond models — pair (multisite) models
 * keep a circle on each atom.
 */
export function somFromMetabolite(
  m: MetaboliteRecord | null | undefined,
  bondsIdx: unknown,
  mode?: SelectionMode | null,
): SomHighlight | null {
  if (!m?.atom?.length) return null;
  const atomIdxs = m.atom
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0);
  if (!atomIdxs.length) return null;
  if (mode === "pair" || mode === "atom") {
    return { atomIdxs };
  }
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
  /** @deprecated Prefer nestOutlet — nested hops use Remix Outlet. */
  children?: ReactNode;
  /** Show metabolite panel under this generation. */
  showPanel?: boolean;
  /**
   * Formation pathway/score for this hop (URL search and/or parent list).
   */
  formationMeta?: FormationMeta | null;
  /**
   * When true, identity is rendered by the app shell (root under search).
   * Nested generations always render their own identity.
   */
  identityInShell?: boolean;
  /** Render Remix `<Outlet context={…} />` for the next hop (default true). */
  nestOutlet?: boolean;
  /** First paint while navigating into a child hop that is not mounted yet. */
  pendingChild?: boolean;
};

/**
 * One generation at any depth — shared by root and every nested hop route.
 */
export function GenerationView({
  depth,
  resolved_query,
  model,
  generations,
  children,
  showPanel = false,
  formationMeta = null,
  identityInShell = false,
  nestOutlet = true,
  pendingChild = false,
}: GenerationViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const parentCtx =
    useOutletContext<HopOutletContext>() || EMPTY_HOP_OUTLET_CONTEXT;

  const [hover, setHover] = useState<{
    highlight: SomHighlight;
    headIndex: number;
  } | null>(null);
  const [siteHover, setSiteHover] = useState<SiteSelection | null>(null);

  const results = resolved_query?.results || [];
  const metabolites = collectMetabolites(results);
  const childQuery = generations[depth + 1]?.query || null;
  const childGen = generations[depth + 1] || null;
  const cipRank = resolved_query?.atoms?.cipRank;
  const selfGen = generations[depth] || null;

  // Child edge: metabolite segment + this generation's mol-stub SOM (no callback).
  const edgeForChild = childGen
    ? {
        smiles: childGen.query,
        headIndex: childGen.headIndex,
        atomIdxs: selfGen?.som,
        matchIndex: childGen.matchIndex,
      }
    : null;
  const childMet = edgeForChild
    ? matchFormationEdge(
        metabolites,
        {
          smiles: edgeForChild.smiles,
          headIndex: edgeForChild.headIndex,
          atomIdxs: edgeForChild.atomIdxs,
          matchIndex: edgeForChild.matchIndex,
        },
        cipRank,
      )
    : findMetaboliteBySmiles(metabolites, childQuery);

  const hopOutletContext = useMemo<HopOutletContext>(
    () => ({
      formationForChild: childMet
        ? { pathway: childMet.pathway, score: childMet.score }
        : null,
    }),
    [childMet],
  );

  // Late validation: smiles+head+parent-som (CIP-aware) must match.
  useEffect(() => {
    if (!childQuery || !resolved_query || resolved_query.detail) return;
    if (!hasPredictionModel(model)) return;
    if (!Array.isArray(resolved_query.results)) return;
    if (!edgeForChild) return;

    const parentMets = collectMetabolites(resolved_query.results);
    const result = validateChildFormationEdge(
      parentMets,
      {
        smiles: edgeForChild.smiles,
        headIndex: edgeForChild.headIndex,
        atomIdxs: edgeForChild.atomIdxs,
        matchIndex: edgeForChild.matchIndex,
      },
      resolved_query?.atoms?.cipRank,
    );
    if (result.ok) return;

    const parentUrl = moleculeFocusUrl({
      generations: generations.slice(0, depth + 1),
    });
    console.warn(
      `[xenosite] invalid nested hop at depth ${depth + 1}; redirecting to ${parentUrl}:`,
      result.reason,
    );
    navigate(parentUrl, { replace: true, preventScrollReset: true });
  }, [
    childQuery,
    edgeForChild?.smiles,
    edgeForChild?.headIndex,
    edgeForChild?.atomIdxs?.join(","),
    edgeForChild?.matchIndex,
    model,
    resolved_query,
    generations,
    depth,
    navigate,
  ]);

  if (!resolved_query) return null;

  if (resolved_query.detail) {
    return (
      <div className="w-fit mx-auto mt-6 relative p-6 text-sm text-gray-600">
        {resolved_query.detail}
      </div>
    );
  }

  const modelLabel = resolveModelInfo(model)?.model ?? model ?? "XenoSite";
  const moleculeName =
    moleculeDisplayName(resolved_query?.name) ||
    resolved_query?.smiles ||
    "Molecule";

  const somFromSearch = parseSomSearchParams(searchParams);
  const searchHeadIndex = resolveHeadIndex(somFromSearch.head, results);

  const modeForHead = (i: number | null | undefined) =>
    typeof i === "number" ? selectionModeFromResult(results[i] || {}) : null;

  const childHighlight = somFromMetabolite(
    childMet,
    resolved_query?.bonds?.idx,
    modeForHead(childMet?.headIndex),
  );
  // Own mol stub encodes SOM — parent highlights without child JS.
  const stubHighlight: SomHighlight | null = selfGen?.som?.length
    ? {
        atomIdxs: selfGen.som,
        bondIdx:
          modeForHead(
            childMet?.headIndex ?? searchHeadIndex,
          ) === "pair" ||
          modeForHead(childMet?.headIndex ?? searchHeadIndex) === "atom"
            ? null
            : selfGen.bondIdx ?? null,
      }
    : null;

  const selectedHighlight = childHighlight || stubHighlight;
  const selectedHeadIndex = childMet
    ? typeof childMet.headIndex === "number"
      ? childMet.headIndex
      : null
    : searchHeadIndex;

  const committedSelection: SiteSelection | null = (() => {
    if (childMet) return { metaboliteSmiles: childMet.smiles };
    if (selectedHeadIndex == null && !selectedHighlight) return null;
    return {
      atomIdxs: selectedHighlight?.atomIdxs,
      bondIdx: selectedHighlight?.bondIdx ?? null,
      headIndex: selectedHeadIndex,
    };
  })();

  const panelSelection = effectiveMetabolitePanelSelection({
    childQuery,
    committed: committedSelection,
    hover: siteHover,
  });

  // Formation chrome for *this* hop: parent matches metabolite + parent som.
  const formationPathway =
    formationMeta?.pathway ?? parentCtx.formationForChild?.pathway ?? null;
  const formationScore =
    typeof formationMeta?.score === "number"
      ? formationMeta.score
      : typeof parentCtx.formationForChild?.score === "number"
        ? parentCtx.formationForChild.score
        : null;

  const hrefForMetabolite = (m: MetaboliteRecord) => {
    if (!canAppendMetaboliteHop(depth) && !childQuery) {
      return location.pathname + location.search;
    }
    const site = (m.atom || [])
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 0);
    const matchIndex = metaboliteMatchIndex(metabolites, m, cipRank);
    return metaboliteSelectUrl({
      generations,
      depth,
      metaboliteSmiles: m.smiles,
      childQuery,
      headIndex: typeof m.headIndex === "number" ? m.headIndex : null,
      site: site.length ? site : undefined,
      matchIndex: matchIndex > 0 ? matchIndex : null,
    });
  };

  const clearHref = childQuery
    ? metaboliteSelectUrl({
        generations,
        depth,
        metaboliteSmiles: childQuery,
        childQuery,
      })
    : null;

  const toggleHeadFilter = (headIndex: number) => {
    if (childQuery) return;
    if (selectedHeadIndex === headIndex) {
      navigate(
        { pathname: location.pathname, search: "" },
        { replace: true, preventScrollReset: true },
      );
      return;
    }
    const search = somToSearchParams({
      head: encodeHeadParam(headIndex, results),
    }).toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true, preventScrollReset: true },
    );
  };

  const navigateSom = (
    highlight: SomHighlight | null,
    headIndex: number,
  ) => {
    const head = encodeHeadParam(headIndex, results);
    navigate(
      somSelectUrl({
        generations,
        depth,
        atomIdxs: highlight?.atomIdxs,
        bondIdx: highlight?.bondIdx,
        head: highlight ? head : undefined,
      }),
      { replace: !childQuery },
    );
  };

  const applyHit = (hit: SiteHit | null, headIndex: number) => {
    const mode = modeForHead(headIndex);

    if (mode === "pair") {
      const current = childQuery ? null : selectedHighlight;
      const next = applyPairAtomClick(current, hit);
      navigateSom(next, headIndex);
      return;
    }

    const nextHighlight: SomHighlight | null = hit
      ? {
          atomIdxs: hit.atomIdxs,
          bondIdx: hit.kind === "bond" ? hit.bondIdx : null,
        }
      : null;

    if (childQuery) {
      navigateSom(nextHighlight, headIndex);
      return;
    }

    const toggled = toggleSomHighlight(selectedHighlight, nextHighlight);
    navigateSom(toggled, headIndex);
  };

  const onHoverMetabolite = (m: MetaboliteRecord | null) => {
    if (!m?.atom?.length || typeof m.headIndex !== "number") {
      setHover(null);
      return;
    }
    const highlight = somFromMetabolite(
      m,
      resolved_query?.bonds?.idx,
      modeForHead(m.headIndex),
    );
    if (!highlight) {
      setHover(null);
      return;
    }
    setHover({ highlight, headIndex: m.headIndex });
  };

  const showIdentity = depth > 0 || !identityInShell;
  const predictionReady = depth === 0 || hasPredictionModel(model);
  const hopSmiles =
    generations[depth]?.query || resolved_query?.smiles || "";

  const predictionBlock = predictionReady ? (
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
                  onHover={(hit) => {
                    const sel = hitToSiteSelection(hit);
                    setSiteHover(sel ? { ...sel, headIndex: i } : null);
                  }}
                />
              ) : null}
              {results.length > 1 ? (
                <button
                  type="button"
                  className={classNames(
                    "block mx-auto text-center w-100 text-xs mt-1 min-h-[2rem] px-2 rounded",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                    isSelectedHead
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                  )}
                  aria-pressed={isSelectedHead}
                  title={
                    isSelectedHead
                      ? "Click to show all metabolites"
                      : "Show metabolites from this model"
                  }
                  onClick={() => toggleHeadFilter(i)}
                >
                  {last_name(r.model)}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const plainStructure =
    depth > 0 && !predictionReady && hopSmiles ? (
      <div className="w-fit max-w-full mx-auto relative px-2 py-3 sm:px-4">
        <LazyMetaboliteImg smiles={hopSmiles} alt={moleculeName} />
      </div>
    ) : null;

  const identityBlock = showIdentity ? (
    <div className={depth > 0 ? "px-2 pb-2 mt-6" : "px-2 pb-2"}>
      <MoleculeIdentity
        resolved_query={resolved_query}
        showCopy
        headingLevel={depth === 0 ? 1 : 2}
      />
      {depth > 0 && (formationPathway || formationScore != null) ? (
        <div className="mt-1 text-center text-xs text-gray-600">
          {formationPathway ? formatPathwayLabel(formationPathway) : null}
          {formationPathway && formationScore != null ? " · " : null}
          {formationScore != null ? formationScore.toFixed(2) : null}
        </div>
      ) : null}
    </div>
  ) : null;

  const nestedOutlet = nestOutlet ? (
    <Suspense fallback={<Spinner />}>
      {pendingChild ? <Spinner /> : <Outlet context={hopOutletContext} />}
    </Suspense>
  ) : (
    children
  );

  return (
    <div className="mx-auto relative w-full">
      {identityBlock}

      {depth > 0 ? (
        <>
          <ModelTabs depth={depth} generations={generations} />
          {predictionReady ? <AboutModel model={model} /> : null}
          {predictionReady ? predictionBlock : plainStructure}
        </>
      ) : (
        predictionBlock
      )}

      {showPanel && predictionReady ? (
        <>
          {metabolites.length > 0 ? (
            <GenerationBanner depth={depth} className="mt-2 mb-2" />
          ) : null}
          <MetabolitePanel
            metabolites={metabolites}
            selection={panelSelection}
            cipRank={cipRank}
            selectedSmiles={childQuery}
            depth={depth}
            lockLayout={!!siteHover}
            canSelectNextGeneration={
              canAppendMetaboliteHop(depth) || !!childQuery
            }
            hrefForMetabolite={hrefForMetabolite}
            clearHref={clearHref}
            onHoverMetabolite={onHoverMetabolite}
          />
        </>
      ) : null}

      {nestedOutlet}
    </div>
  );
}

/**
 * Root layout: generation 0 + Outlet for nested hops.
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
  const navigation = useNavigation();
  const params = useParams();
  const generations = useMemo(() => {
    const fromParams = generationsFromParams(params);
    if (fromParams.length) return fromParams;
    const parsed = parseMoleculeFocusPath(location.pathname);
    return parsed?.generations?.length
      ? parsed.generations
      : [{ model, query }];
  }, [params, location.pathname, model, query]);

  const hasNested = generations.length > 1;
  const nestedPredictionPending = isNestedPredictionNavigation(
    location.pathname,
    navigation.location?.pathname,
    navigation.state,
    parseMoleculeFocusPath,
  );

  return (
    <GenerationView
      depth={0}
      resolved_query={resolved_query}
      model={model}
      generations={generations}
      showPanel
      identityInShell
      nestOutlet={hasNested || nestedPredictionPending}
      pendingChild={nestedPredictionPending && !hasNested}
    />
  );
}

/** @deprecated Prefer MoleculeFocusRootLayout + hop routes. */
export default function MoleculeFocus({
  chain,
  model,
  segments,
}: {
  chain: any[];
  model: string;
  segments: string[];
}) {
  const generations = (segments || []).map((q) => ({ model, query: q }));
  if (!chain?.length) return null;
  return (
    <GenerationView
      depth={0}
      resolved_query={chain[0]}
      model={model}
      generations={generations}
      showPanel
      nestOutlet={false}
    />
  );
}
