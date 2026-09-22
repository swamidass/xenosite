import { useSyncExternalStore, type ReactNode } from "react";

/**
 * Remix/React 18 client gate without useEffect.
 * Server + first paint use `fallback`; after hydrate, render `children`.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hydrated = useIsHydrated();
  if (!hydrated) return <>{fallback}</>;
  return <>{children}</>;
}
