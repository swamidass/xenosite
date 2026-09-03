import type { MetaFunction } from "@remix-run/node";
import { ModelDescriptions, ModelTabs } from "~/components";
import { getLdJson } from "~/loaders/ld-json";
import { commonMetaValues } from "~/utils";

export const meta: MetaFunction = () => {
  const results: any[] = [...commonMetaValues()];
  for (const node of getLdJson()) {
    results.push({ "script:ld+json": node });
  }
  return results;
};

export default function Model() {
  return (
    <ModelTabs>
      <ModelDescriptions />
    </ModelTabs>
  );
}
