import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { MoleculeFocusNestedStack } from "~/components/MoleculeFocus";
import HEADERS from "~/loaders/headers";
import { resolve_query } from "~/loaders/backend.server";
import {
  parseMoleculeFocusPath,
  type FocusGeneration,
} from "~/utils/metabolitePath";

export type NestedMoleculeLoaderData = {
  /** Predictions for generations[1..] (root is the parent route). */
  chain: any[];
  generations: FocusGeneration[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const parsed = parseMoleculeFocusPath(new URL(request.url).pathname);
  const generations = parsed?.generations || [];
  const nested = generations.slice(1);
  const chain = [];
  for (const g of nested) {
    const { resolved_query } = await resolve_query({
      model: g.model,
      query: g.query,
    });
    chain.push(resolved_query || {});
  }
  return json(
    { chain, generations } satisfies NestedMoleculeLoaderData,
    { headers: HEADERS },
  );
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
}) => {
  const cur = parseMoleculeFocusPath(currentUrl.pathname);
  const next = parseMoleculeFocusPath(nextUrl.pathname);
  return nestedGenerationsKey(cur?.generations) !== nestedGenerationsKey(next?.generations);
};

export function nestedGenerationsKey(
  generations: FocusGeneration[] | undefined,
): string {
  return JSON.stringify((generations || []).slice(1));
}

export default function NestedMoleculeRoute() {
  const data = useLoaderData() as NestedMoleculeLoaderData;
  return (
    <MoleculeFocusNestedStack
      chain={data.chain || []}
      generations={data.generations || []}
    />
  );
}
