

export function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

export function getLdJson(data, modelInfo, name, url) {

  let ldJson = [];

  if (modelInfo && modelInfo !== undefined) {
    const breadCrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": 'Xenosite',
        "item": `https://xenosite.org/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": modelInfo.model ? modelInfo.model : "All Models",
        "item": `https://xenosite.org/${data.params.model}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": name !== "" ? name.replace('|', '').trim() : "Query",
        "item": `https://xenosite.org/${data.params.model}/${data.params.query}`
      }
    ]};
    ldJson.push(breadCrumbList);

    const softwareApplication = {
      "@context": "http://schema.org",
      "@type": "SoftwareApplication",
      "@id": `https://xenosite.org/${modelInfo.path}`,
      "name": "Xenosite",
      "identifier":  `https://xenosite.org/${modelInfo.path}`,
      "isAccessibleForFree": "True",
      "applicationCategory": "Web application",
      "citation": modelInfo.citation,
    }
    ldJson.push(softwareApplication);
  }

  ldJson.push(
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "url": "https://xenosite.org",
      "logo": "https://xenosite.org/favicon.png"
    }
  )

  let chemJson;
  if (data.resolved_query?.name) {
    chemJson = {
      "@context": "http://schema.org",
      "@type": "ChemicalSubstance",
      "@id": url,
      "identifier": `CHEBI:${data.resolved_query.name.chebi}`,
      "name": data.resolved_query.name.name,
      "url": url,
      "description": data.resolved_query.name.description,
      "hasBioChemEntityPart": [
        {
          "@type": "MolecularEntity",
          "@id": data.resolved_query.name.chebiUrl,
          "identifier": `CHEBI:${data.resolved_query.name.chebi}`,
          "name": data.resolved_query.name.name,
          "smiles": data.resolved_query.smiles
        }
      ],
      "hasRepresentation": data.resolved_query.smiles
    }

    ldJson.push(chemJson);
  }

  return ldJson;
}