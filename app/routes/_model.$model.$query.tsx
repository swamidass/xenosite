import { Outlet } from "@remix-run/react";

/**
 * Layout for /:model/:query and nested /m/* hops.
 * Leaf UI lives in _index and m.$ shared molecule-focus module.
 */
export default function MoleculeQueryLayout() {
  return <Outlet />;
}
