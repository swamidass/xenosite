
import { useState } from 'react'
import { MolDepict } from '~/smilesDrawer'
import { cansmi, name2smiles } from '~/rdkit.server'
import {  Link, useFetcher, Form, useLoaderData, useTransition, json, useSubmit, redirect } from 'remix'


export function headers() {
  return {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
  };
}




export async function loader({request}) {
	const sparams = new URL(request.url).searchParams

	if (!sparams.get('search'))
	  return {}

	var response = {}
	response.search = sparams.get('search') || "";
	
	if (response.search != "") {
      response.cansmi = await cansmi(response.search.trim())
         .then(x => x.smi) 
         .catch((e) => {response.error = "Not a valid SMILES string."})
	
	if (!response.cansmi ) {
   		 let name = response.search.trim()

		 response.cansmi = await name2smiles(name)
	          .then((smi) => cansmi(smi))
              .then((x) => {
	            response.name = name
                return x.smi})
	          .catch((e) => {response.error = "Not a valid name or SMILES string"})		 	
     }}
 		
	return json(response, {headers: {"Cache-Control": "max-age=10, stale-while-revalidate, s-maxage=72000"}})
}




export default function Index({}) {
	 
  var {search, name, cansmi} = useLoaderData() || {};
 
  const submit = useSubmit();

  const transition = useTransition();

  let depict_smi = name ? cansmi : search;
  let init_search = search || name || cansmi || "";

  if (transition.state == "submitting") {
 // console.log(transition.submission)
    depict_smi = transition.submission.formData.get("search")
  }
   
  function handleChange(e) {
     submit(e.currentTarget, { replace: true });
  }

  let cansmi_split = cansmi ? cansmi.split(".").sort((a,b) => (b.length - a.length)) : []
  let depict_split = depict_smi ? depict_smi.split(".").sort((a,b) => (b.length - a.length)) : []

  return (
   <>
      <Form action="/" replace method="GET" className="mt-10 pt-10 block w-full " onChange={handleChange}>
       <input type="text" className=" text-center text-2xl pb-2 border-b-2 w-full max-w-[80vw] mx-auto block focus-visible:outline-0" name="search" defaultValue={init_search}  /> 
       <input className="hidden" type="submit" />
     </Form>
     <div className="h-8 text-blue-600 text-center  py-3">
       {cansmi ? 
         cansmi_split.map(c => (<Link reload key={c} to={`?search=${encodeURIComponent(c)}`} 
          className="hover:underline inline-block mx-1">{c}</Link>))  
        : null}
      </div>

     { !depict_smi ? 
         <div className="mx-auto w-full text-center mx-3"> Enter a SMILES string or a molecule name.</div> 
        : depict_split.map(c => <MolDepict key="c" className="mx-auto mt-5"  smi={c} /> )}
    </>

  );
}
