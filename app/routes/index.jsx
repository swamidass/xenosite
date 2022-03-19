import initRDKitModule from '@rdkit/rdkit'
import { useLoaderData } from 'remix'


export async function loader() {
	const rdkit = await initRDKitModule()
	var svg = rdkit.get_mol("CCCC=O").get_svg()
	return {svg}
}


export default function Index({svg}) {
  var { svg } = useLoaderData();


  return (
	<div>
    <div className="max-w-lg mx-auto pt-10 bg-gray-100">
      <h1>Welcome to Xenosite</h1>
      <div className=" w-full" dangerouslySetInnerHTML={{__html: svg}} />
    </div>
</div>
  );
}
