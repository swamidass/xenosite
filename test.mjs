import { installGlobals } from "@remix-run/node";
import { toJson } from 'isomorphic-xml2js'

installGlobals();

const PUGURL = 'https://pubchem.ncbi.nlm.nih.gov/pug/pug.cgi'

async function  standardize(smiles) {
  const F = fetch(PUGURL, {method: "POST", data: 
`<?xml version="1.0"?>
<PCT-Data>
  <PCT-Data_input>
    <PCT-InputData>
      <PCT-InputData_standardize>
        <PCT-Standardize>
          <PCT-Standardize_structure>
            <PCT-Structure>
              <PCT-Structure_structure>
                <PCT-Structure_structure_string>C1=NC2=C(N1)C(=O)N=C(N2)N
                </PCT-Structure_structure_string>
              </PCT-Structure_structure>
              <PCT-Structure_format>
                <PCT-StructureFormat value="smiles"/>
              </PCT-Structure_format>
            </PCT-Structure>
          </PCT-Standardize_structure>
          <PCT-Standardize_oformat>
            <PCT-StructureFormat value="smiles"/>
          </PCT-Standardize_oformat>
        </PCT-Standardize>
      </PCT-InputData_standardize>
    </PCT-InputData>
  </PCT-Data_input>
</PCT-Data>
`
})
  var body = (await F).text()


  return toJson(body)
}

console.log(await standardize("CCCCC"))

