import { XenositeModelInfo } from "~/data";

function getOrganization(): any {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://xenosite.org",
    url: "https://xenosite.org",
    logo: "https://xenosite.org/favicon.png",
    name: "Xenosite",
    description:
      "XenoSite predicts how small-molecules become toxic after metabolism by liver enzymes.",
    image: "https://xenosite.org/favicon.png",
    contactPoint: getContactPoint(),
    email: "swamidass@gmail.com",
    founder: getSwamidassPerson(),
    keywords: getOrganizationKeywords(),
    memberOf: getWustlDepartments(),
  };
}

function getContactPoint(): any {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPoint",
    contactType: "email",
    email: "swamidass@gmail.com",
    url: "https://swami.wustl.edu/contact",
  };
}

function getWustlDepartments(): any {
  return [
    {
      "@context": "https://schema.org",
      "@id": "https://wustl.edu/",
      "@type": "Organization",
      name: "Washington University in St. Louis",
      url: "https://wustl.edu/",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
      // sameAs: [], // TODO
    },
    {
      "@context": "https://schema.org",
      "@id": "https://dbbs.wustl.edu/",
      "@type": "Organization",
      name: "Division of Biology and Biomedical Sciences",
      url: "https://dbbs.wustl.edu/",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
    {
      "@context": "https://schema.org",
      "@id": "https://dbbs.wustl.edu/programs/computational-system-biology/",
      "@type": "Organization",
      name: "Division of Biological Sciences, Computational and Systems Biology",
      url: "https://dbbs.wustl.edu/programs/computational-system-biology/",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
    {
      "@context": "https://schema.org",
      "@id": "https://cse.wustl.edu/index.html",
      "@type": "Organization",
      name: "Computer Science and Engineering",
      url: "https://cse.wustl.edu/index.html",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
    {
      "@context": "https://schema.org",
      "@id": "https://bme.wustl.edu/index.html",
      "@type": "Organization",
      name: "Biomedical Engineering",
      url: "https://bme.wustl.edu/index.html",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
    {
      "@context": "https://schema.org",
      "@id": "https://pathology.wustl.edu/divisions/lgm/",
      "@type": "Organization",
      name: "Laboratory and Genomic Medicine",
      url: "https://pathology.wustl.edu/divisions/lgm/",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
    {
      "@context": "https://schema.org",
      "@id": "https://swami.wustl.edu/",
      "@type": "Organization",
      name: "Swamidass Lab",
      url: "https://swami.wustl.edu/",
      logo: "https://wustl.edu/wp-content/themes/wustl_edu/_assets/img/washu-logo.svg",
    },
  ];
}

function getSwamidassPerson(): any {
  return {
    "@context": "https://schema.org",
    "@id": "https://swami.wustl.edu/contact",
    "@type": "Person",
    mainentityofpage: {
      "@context": "https://schema.org",
      "@id": "https://swami.wustl.edu/contact",
      "@type": "WebPage",
      url: "https://swami.wustl.edu/contact",
    },
    name: "S. Joshua Swamidass",
    sameas: [
      "https://pathology.wustl.edu/people/joshua-swamidass-md-phd/",
      "https://orcid.org/0000-0003-2191-0778",
      "https://twitter.com/swamidass",
      "https://scholar.google.com/citations?user=oWGEj78AAAAJ&hl=en",
      "https://en.wikipedia.org/wiki/S._Joshua_Swamidass",
    ],
    url: "https://swami.wustl.edu/contact",
  };
}

function getOrganizationKeywords(): any {
  return [
    "xenobiotic",
    "drug",
    "metabolism",
    "cytochrome",
    "P450",
    "CYP",
    "enzyme",
    "polymorphism",
    "allele",
    "variant",
    "pharmacogenetics",
    "pharmacogenomics",
    "pharmacology",
    "toxicology",
    "toxicogenetics",
    "toxicogenomics",
    "bioinformatics",
    "computational",
    "biology",
    "systems",
    "medicine",
    "precision",
    "health",
    "healthcare",
  ];
}

interface BreadCrumbListItem {
  "@type": string;
  "@id": string;
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
        "@id": "https://xenosite.org/",
        position: 1,
        name: "Xenosite",
        item: `https://xenosite.org/`,
      },
    ],
  };

  if (params) {
    // 2nd level
    if (params.model) {
      const url = `https://xenosite.org/${params.model.path}`;
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        "@id": url,
        position: 2,
        name: params.model.model ? params.model.model : "All Models",
        item: url,
      });
    }

    // 3rd level
    if (params.model && params.smiles) {
      const paramUrl = `https://xenosite.org/${params.model.path}/${params.smiles}`;
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        "@id": paramUrl,
        position: 3,
        name: params.name ? params.name.trim() : `Query:${params.smiles}`,
        item: paramUrl,
      });
    }
  }

  return breadCrumbList;
}

function getScholarlyArticle(params?: LdJsonParams): any | null {
  if (!params || !params.model) {
    return null;
  }

  return {
    "@context": "http://schema.org",
    "@type": "ScholarlyArticle",
    url: params.model.citation,
    name: params.model.model,
    description: params.model.description,
    citation: params.model.citation,
  };
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
  model: XenositeModelInfo;
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

  // Add ScholarlyArticle Ld+Json
  // ref: https://schema.org/ScholarlyArticle
  const scholarlyArticle = getScholarlyArticle(params);
  if (scholarlyArticle) ld.push(scholarlyArticle);

  // Add ChemicalSubstance Ld+Json
  // ref: https://bioschemas.org/profiles/ChemicalSubstance/0.4-RELEASE
  const chemicalSubstance = getChemicalSubstance(params);
  if (chemicalSubstance) ld.push(chemicalSubstance);

  console.log(JSON.stringify(ld, null, 2));
  return ld;
}
