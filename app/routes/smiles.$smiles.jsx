import { useLoaderData } from "remix";
import { MolDepict } from "~/MolDepict";
import { redirect, useOutletContext } from "remix";
import { cansmi } from "~/backend.server";

export async function loader({ params }) {
  let smiles;
  try {
    smiles = (await cansmi({ smi: params.smiles })).smi;
    if (smiles && smiles != params.smiles) {
      console.log(params.smiles, "->", smiles);
      return redirect(`/smiles/${encodeURIComponent(smiles)}`);
    }

    return { smi: params.smiles };
  } catch (e) {
    return new Response("Not Found", { status: 404 });
  }
}

export default function __search({}) {
  var { smi } = useOutletContext();
  return (
    <div className="w-full">
      <div className="max-w-screen-xl mx-auto mt-10 ">
        <MolDepict className="mx-auto" smi={smi} />
      </div>
    </div>
  );
}
