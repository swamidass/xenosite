
import { useLoaderData, useOutletContext, redirect } from 'remix'
import {MolDepict} from '~/smilesDrawer'
import {cansmi} from '~/rdkit.server'
import _ from "lodash"

export const name2smiles = _.memoize( async (name) => {
  let pubchem = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES/json`)
  let j = await pubchem.json()
  let smiles = j.PropertyTable?.Properties[0].CanonicalSMILES

  if (typeof smiles !== "undefined") 
    return smiles

   throw new Error( "Not valid name.")
})


export async function loader({params}) {
	
  let smiles = await name2smiles(params.name)

  if (typeof smiles !== "undefined") {
	let csmiles = (await cansmi(smiles)).smi
    return {smi: csmiles, name: params.name }
  } else {	
    return new Response("Not Found", {status: 404});
  }
}

export default function Index({}) {
  var { smi, name } = useLoaderData();
  var { smi: osmi, setSmi } = useOutletContext();
  setSmi(smi)
  return (
	 <div className="max-w-screen-lg">
      <MolDepict className="mx-auto" smi={osmi}/>
     </div>
  );
}




