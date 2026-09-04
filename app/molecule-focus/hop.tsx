/**
 * Factories for nested metabolite routes (depth 1…MAX_NESTED_HOPS).
 *
 * Grammar under root `/{model}/{mol}`:
 *   /$metN                 — metabolite identity (no model yet)
 *   /$metN/$mN/$qN         — metabolite + prediction model + mol stub
 */

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useParams } from "@remix-run/react";
import { useMemo } from "react";
import { GenerationView } from "~/components/MoleculeFocus";
import Spinner from "~/components/Spinner";
import HEADERS from "~/loaders/headers";
import { resolve_query } from "~/loaders/backend.server";
import {
  generationsFromParams,
  hasPredictionModel,
  hopParamNames,
  parseMetaboliteSlug,
  smilesFromMolStubParam,
  UNSELECTED_MODEL_PATH,
  type FocusGeneration,
} from "~/utils/metabolitePath";

export type HopLoaderData = {
  depth: number;
  model: string;
  query: string;
  resolved_query: any;
};

export function shouldRevalidateHop(
  depth: number,
  currentParams: Record<string, string | undefined>,
  nextParams: Record<string, string | undefined>,
): boolean {
  const { model: mk, query: qk, met: metKey } = hopParamNames(depth);
  const curSmiles = smilesFromMolStubParam(currentParams[qk || ""]);
  const nextSmiles = smilesFromMolStubParam(nextParams[qk || ""]);
  return (
    currentParams[mk] !== nextParams[mk] ||
    curSmiles !== nextSmiles ||
    (metKey != null && currentParams[metKey] !== nextParams[metKey])
  );
}

function HopRouteView({
  data,
  depth,
  model,
  generations,
}: {
  data: HopLoaderData;
  depth: number;
  model: string;
  generations: FocusGeneration[];
}) {
  if (!data?.resolved_query && !data?.query) return <Spinner />;

  return (
    <GenerationView
      depth={depth}
      resolved_query={data.resolved_query}
      model={model}
      generations={generations}
      showPanel
      nestOutlet
    />
  );
}

/** Metabolite leaf (no model) — identity / canonize only. */
export function createMetaboliteRoute(depth: number) {
  if (depth < 1) {
    throw new Error(`createMetaboliteRoute expects depth >= 1, got ${depth}`);
  }

  const metKey = `met${depth}`;
  const modelKey = `m${depth}`;
  const queryKey = `q${depth}`;

  const loader = async ({ params }: LoaderFunctionArgs) => {
    // When a prediction child is mounted, this layout only passes Outlet.
    if (params[modelKey] && params[queryKey]) {
      return json(
        {
          depth,
          model: UNSELECTED_MODEL_PATH,
          query: "",
          resolved_query: {},
          passthrough: true,
        },
        { headers: HEADERS },
      );
    }
    const raw = params[metKey] || "";
    const query = parseMetaboliteSlug(raw).smiles || raw;
    const model = UNSELECTED_MODEL_PATH;
    const { resolved_query } = await resolve_query({ model, query });
    return json(
      {
        depth,
        model,
        query,
        resolved_query: resolved_query || {},
        passthrough: false,
      },
      { headers: HEADERS },
    );
  };

  const shouldRevalidate = ({
    currentParams,
    nextParams,
  }: {
    currentParams: Record<string, string | undefined>;
    nextParams: Record<string, string | undefined>;
  }) => {
    // Predicting child owns the view — don't refetch identity loader.
    if (nextParams[modelKey] && nextParams[queryKey]) return false;
    if (currentParams[modelKey] && currentParams[queryKey]) return false;
    return currentParams[metKey] !== nextParams[metKey];
  };

  function MetaboliteRoute() {
    const data = useLoaderData() as HopLoaderData & { passthrough?: boolean };
    const params = useParams();
    const generations = useMemo(() => generationsFromParams(params), [params]);

    if (params[modelKey] && params[queryKey]) {
      return <Outlet />;
    }
    if (!data?.resolved_query && !data?.query) return <Spinner />;

    return (
      <HopRouteView
        data={data}
        depth={depth}
        model={UNSELECTED_MODEL_PATH}
        generations={generations}
      />
    );
  }

  return { loader, shouldRevalidate, default: MetaboliteRoute };
}

/** Predicting hop: /$metN/$mN/$qN */
export function createHopRoute(depth: number) {
  if (depth < 1) {
    throw new Error(`createHopRoute expects nested depth >= 1, got ${depth}`);
  }

  const { model: modelKey, query: queryKey } = hopParamNames(depth);

  const loader = async ({ params }: LoaderFunctionArgs) => {
    const model = params[modelKey] || "";
    const rawQuery = params[queryKey] || "";
    const query = smilesFromMolStubParam(rawQuery) || rawQuery;
    const { resolved_query } = await resolve_query({ model, query });
    return json(
      {
        depth,
        model,
        query,
        resolved_query: resolved_query || {},
      } satisfies HopLoaderData,
      { headers: HEADERS },
    );
  };

  const shouldRevalidate = ({
    currentParams,
    nextParams,
  }: {
    currentParams: Record<string, string | undefined>;
    nextParams: Record<string, string | undefined>;
  }) => shouldRevalidateHop(depth, currentParams, nextParams);

  function HopRoute() {
    const data = useLoaderData() as HopLoaderData;
    const params = useParams();
    const generations = useMemo(() => generationsFromParams(params), [params]);
    const gen = generations[depth];
    const model = data.model || gen?.model || "";

    if (!hasPredictionModel(model) && !data.query) return <Spinner />;

    return (
      <HopRouteView
        data={data}
        depth={depth}
        model={model}
        generations={generations}
      />
    );
  }

  return { loader, shouldRevalidate, default: HopRoute };
}
