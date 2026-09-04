import { capitalize } from "~/utils";

export type MoleculeNameInfo = {
  name?: string | null;
  description?: string | null;
  chebi?: string | number | null;
  chebiUrl?: string | null;
} | null;

/**
 * Display title for a molecule/metabolite identity.
 * Common name when present; otherwise blank (never raw SMILES).
 */
export function moleculeDisplayName(
  name: MoleculeNameInfo | string | null | undefined,
): string {
  if (name == null) return "";
  if (typeof name === "string") {
    const t = name.trim();
    return t ? capitalize(t) : "";
  }
  const n = name.name?.trim();
  return n ? capitalize(n) : "";
}

/** Crumb / path label: named molecule, else a generic hop label (not SMILES). */
export function moleculePathLabel(
  name: MoleculeNameInfo | string | null | undefined,
  fallback = "Metabolite",
): string {
  return moleculeDisplayName(name) || fallback;
}
