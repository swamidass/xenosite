import {
  Component,
  Suspense,
  lazy,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { ClientOnly } from "~/utils/clientOnly";

type XpictLazyMetaboliteImgProps = {
  smiles: string;
  alt: string;
  className?: string;
  /**
   * Parent (current generation) SMILES — metabolites are template-aligned
   * to this frame via xpict `align_to`.
   */
  alignToSmiles?: string | null;
  /** Called when client depict fails (e.g. RDKit-invalid SMILES). */
  onDepictError?: (error: Error) => void;
};

const XpictLazyMetaboliteImgReady = lazy(
  () => import("~/components/XpictLazyMetaboliteImgReady.client"),
);

function MetabolitePulse({ className }: { className?: string }) {
  return (
    <div
      className={`interactive-molecule ${className || ""}`.trim()}
      aria-hidden
    >
      <div className="h-[6.5rem] w-[8rem] animate-pulse bg-gray-50" />
    </div>
  );
}

type BoundaryProps = {
  resetKey: string;
  onError?: (error: Error) => void;
  children: ReactNode;
};

type BoundaryState = { error: Error | null };

/** Hide a failed metabolite card; notify parent to drop it from the list. */
class MetaboliteDepictBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
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
    console.error("[metabolite xpict] depict failed", error, info);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

/**
 * Lazy plain metabolite depiction via client-side xpict (no `/depict` proxy).
 *
 * Remix pattern: ClientOnly → Suspense → `*.client` paint resource (no useEffect).
 * Aligns to {@link alignToSmiles} when provided.
 * Legacy server path: {@link LazyMetaboliteImg}.
 */
export default function XpictLazyMetaboliteImg({
  smiles,
  alt,
  className,
  alignToSmiles = null,
  onDepictError,
}: XpictLazyMetaboliteImgProps) {
  const pulse = <MetabolitePulse className={className} />;
  const resetKey = `${smiles}|${alignToSmiles ?? ""}`;

  return (
    <ClientOnly fallback={pulse}>
      <MetaboliteDepictBoundary resetKey={resetKey} onError={onDepictError}>
        <Suspense fallback={pulse}>
          <XpictLazyMetaboliteImgReady
            smiles={smiles}
            alt={alt}
            className={className}
            alignToSmiles={alignToSmiles}
          />
        </Suspense>
      </MetaboliteDepictBoundary>
    </ClientOnly>
  );
}
