function getOrganization(): any {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    url: "https://xenosite.org",
    logo: "https://xenosite.org/favicon.png",
  };
}

interface BreadCrumbListItem {
  "@type": string;
  position: number;
  name: string;
  item: string;
}

function getBreadCrumbList(params?: LdJsonParams): any {
  // BreadCrumbList
  const breadCrumbList: {
    "@context": string;
    "@type": string;
    itemListElement: BreadCrumbListItem[];
  } = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        // 1st level
        "@type": "ListItem",
        position: 1,
        name: "Xenosite",
        item: `https://xenosite.org/`,
      },
    ],
  };

  if (params) {
    // 2nd level
    if (params.model) {
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        position: 2,
        name:
          params.model && params.model !== "_" ? params.model : "All Models",
        item: `https://xenosite.org/${params.model}`,
      });
    }

    // 3rd level
    if (params.model && params.smiles) {
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        position: 3,
        name: params.name ? params.name.trim() : `Query:${params.smiles}`,
        item: `https://xenosite.org/${params.model}/${params.smiles}`,
      });
    }
  }

  return breadCrumbList;
}

function getSoftwareApplication(params?: LdJsonParams): any | null {
  if (!params || !params.xenositeUrl || !params.citation) {
    return null;
  }

  return {
    "@context": "http://schema.org",
    "@type": "WebApplication",
    "@id": params.xenositeUrl,
    name: "Xenosite",
    identifier: params.xenositeUrl,
    isAccessibleForFree: "True",
    applicationCategory: "HealthApplication",
    citation: params.citation,
    operatingSystem: "All",
  };
}

function getChemicalSubstance(params?: LdJsonParams): any | null {
  if (
    !params ||
    !params.name ||
    !params.description ||
    !params.smiles ||
    !params.chebi ||
    !params.chebiUrl ||
    !params.xenositeUrl
  ) {
    return null;
  }

  return {
    "@context": "http://schema.org",
    "@type": "ChemicalSubstance",
    "@id": params.xenositeUrl,
    identifier: `CHEBI:${params.chebi}`,
    name: params.name,
    url: params.xenositeUrl,
    description: params.description,
    hasBioChemEntityPart: [
      {
        "@type": "MolecularEntity",
        "@id": params.chebiUrl,
        identifier: `CHEBI:${params.chebi}`,
        name: params.name,
        smiles: params.smiles,
      },
    ],
    hasRepresentation: params.smiles,
  };
}

export type LdJsonParams = {
  model: string;
  name?: string;
  description?: string;
  xenositeUrl?: string;
  smiles?: string;
  chebi?: string;
  chebiUrl?: string;
  citation?: string;
};

export function getLdJson(params?: LdJsonParams): any[] {
  const ld = [];

  // Add Organization Ld+Json
  // ref: https://schema.org/Organization
  ld.push(getOrganization());

  // Add BreadCrumbList Ld+Json
  // ref: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
  ld.push(getBreadCrumbList(params));

  // Add SoftwareApplication Ld+Json
  // ref: https://developers.google.com/search/docs/appearance/structured-data/software-app
  const softwareApplication = getSoftwareApplication(params);
  if (softwareApplication) ld.push(softwareApplication);

  // Add ChemicalSubstance Ld+Json
  // ref: https://bioschemas.org/profiles/ChemicalSubstance/0.4-RELEASE
  const chemicalSubstance = getChemicalSubstance(params);
  if (chemicalSubstance) ld.push(chemicalSubstance);

  return ld;
}
