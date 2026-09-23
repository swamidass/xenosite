import {
  Component,
  Suspense,
  lazy,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { ClientOnly } from "~/utils/clientOnly";
import type { SelectionMode, SiteHit } from "~/utils/siteHitTest";
import type { SomHighlight } from "~/utils/somOverlay";

export type XpictMoleculeDepictionProps = {
  smiles: string;
  alt: string;
  /** Prediction head `atom` scores → xpict `atom_shade`. */
  atomScores?: unknown;
  /** Prediction head `bond` scores → xpict `bond_shade`. */
  bondScores?: unknown;
  /** Prefer API `bonds.idx` for hit-test when present (matches metabolite atoms). */
  bondsIdx?: unknown;
  selectionMode?: SelectionMode;
  selected?: SomHighlight | null;
  externalHover?: SomHighlight | null;
  onSelect?: (hit: SiteHit | null) => void;
  onHover?: (hit: SiteHit | null) => void;
  className?: string;
  /** Optional backbone / label color. */
  color?: string;
  /** Parent SMILES — xpict template-aligns this depiction to that frame. */
  alignToSmiles?: string | null;
};

const XpictMoleculeDepictionReady = lazy(
  () => import("~/components/XpictMoleculeDepictionReady.client"),
);

function DepictionPulse({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  return (
    <div className={`interactive-molecule ${className || ""}`.trim()}>
      <img
        className="interactive-molecule__img sr-only"
        alt={alt}
        src={
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`,
          )
        }
      />
      <div
        className="h-[6.5rem] w-[8rem] animate-pulse bg-gray-50"
        aria-hidden
      />
    </div>
  );
}

function DepictErrorFallback({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`interactive-molecule ${className || ""}`.trim()}
      role="img"
      aria-label={alt}
    >
      <div className="h-[6.5rem] w-[8rem] text-xs text-gray-400 flex items-center justify-center">
        —
      </div>
    </div>
  );
}

type BoundaryProps = {
  resetKey: string;
  fallback: ReactNode;
  children: ReactNode;
};

type BoundaryState = { error: Error | null };

/** Local error boundary so a bad SMILES does not nuke the page Suspense tree. */
class DepictErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[xpict] depict failed", error, info);
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Client-side depiction via `@xenosite/xpict`.
 *
 * Remix pattern: ClientOnly (hydrate) → Suspense → `*.client` paint resource
 * (no useEffect). Coords from the render result.
 *
 * Legacy server-SVG path: {@link InteractiveMoleculeDepiction} (keep for tests).
 */
export default function XpictMoleculeDepiction(
  props: XpictMoleculeDepictionProps,
) {
  const pulse = <DepictionPulse alt={props.alt} className={props.className} />;
  const resetKey = [
    props.smiles,
    props.alignToSmiles ?? "",
    props.color ?? "",
    JSON.stringify(props.atomScores ?? null),
    JSON.stringify(props.bondScores ?? null),
  ].join("|");

  return (
    <ClientOnly fallback={pulse}>
      <DepictErrorBoundary
        resetKey={resetKey}
        fallback={
          <DepictErrorFallback alt={props.alt} className={props.className} />
        }
      >
        <Suspense fallback={pulse}>
          <XpictMoleculeDepictionReady {...props} />
        </Suspense>
      </DepictErrorBoundary>
    </ClientOnly>
  );
}
