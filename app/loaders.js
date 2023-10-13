

export function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

export const LdJsonType = {
  ROOT: "Root",
  MODEL: "Model",
  QUERY: "Query",
}

export function getLdJson(ldType, {data, modelInfo, name, url} = {}) {

  let ldJson = [];
  if(!ldType) {
    return ldJson;
  }

  if (modelInfo && modelInfo !== undefined) {

    // BreadCrumbList
    const breadCrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": []
    };

    breadCrumbList.itemListElement.push({
      "@type": "ListItem",
      "position": 1,
      "name": 'Xenosite',
      "item": `https://xenosite.org/`
    });

    if (ldType == LdJsonType.Model || ldType == LdJsonType.Query) {
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": modelInfo.model ? modelInfo.model : "All Models",
        "item": `https://xenosite.org/${data.params.model}`
      });
    };

    if (ldType == LdJsonType.Query) {
      breadCrumbList.itemListElement.push({
        "@type": "ListItem",
        "position": 3,
        "name": name !== "" ? name.replace('|', '').trim() : "Query",
        "item": `https://xenosite.org/${data.params.model}/${data.params.query}`
      });
    };

    ldJson.push(breadCrumbList);

    // SoftwareApplication
    if(ldType == LdJsonType.Model || ldType == LdJsonType.Query) {
      const softwareApplication = {
        "@context": "http://schema.org",
        "@type": "SoftwareApplication",
        "@id": `https://xenosite.org/${modelInfo.path}`,
        "name": "Xenosite",
        "identifier":  `https://xenosite.org/${modelInfo.path}`,
        "isAccessibleForFree": "True",
        "applicationCategory": "Web application",
        "citation": modelInfo.citation,
      };

      ldJson.push(softwareApplication);
    }
  }

  // Organization
  ldJson.push(
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "url": "https://xenosite.org",
      "logo": "https://xenosite.org/favicon.png"
    }
  )

  // ChemicalSubstance
  if(ldType == LdJsonType.Query) {
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
  }

  return ldJson;
}