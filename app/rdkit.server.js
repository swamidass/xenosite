import 'dotenv/config'
import {LambdaClient, InvokeCommand} from '@aws-sdk/client-lambda'
import { DBMemoize } from './db'

const _ = require("lodash"); 


const credentials = {
  accessKeyId: process.env.AWS_SDK_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SDK_SECRET_ACCESS_KEY,
};

const client = new LambdaClient({
  region: process.env.AWS_SDK_REGION,
  credentials: credentials,
});

const asciiDecoder = new TextDecoder('ascii');


export const cansmi = DBMemoize(async (input) => {
   console.log("CANSMI",input)

	const command = new InvokeCommand({
		FunctionName: "rdkit-dev-rdkit",
		Payload: Buffer.from(JSON.stringify({"smi": input})),
	 })
     const response = await client.send(command);
     const payload = JSON.parse(asciiDecoder.decode(response.Payload));

   console.log("CANSMI",input[0], payload)
     if (!payload.body) throw payload
  
     return payload.body
}, "cansmi")

console.log(cansmi)

export const epoxidation = DBMemoize( async (input) => {
	const command = new InvokeCommand({
		FunctionName: "rdkit-dev-xenosite",
		Payload: Buffer.from(JSON.stringify({"smi": input})),
	 })
     const response = await client.send(command);
     const payload = JSON.parse(asciiDecoder.decode(response.Payload));
     console.log("EPOX", asciiDecoder.decode(response.Payload))
     if (!payload.body) throw Error(payload)
     return JSON.parse(Buffer.from(payload.body, 'base64').toString("utf-8"))
}, "epoxidation")



export const name2smiles = DBMemoize( async (name) => {
  let pubchem = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES,IsomericSMILES/json`)
  let j = await pubchem.json()
  let csmiles = j.PropertyTable?.Properties[0].CanonicalSMILES
  let ismiles = j.PropertyTable?.Properties[0].IsomericSMILES
  let smiles = ismiles || csmiles

  if (typeof smiles !== "undefined") 
    return smiles

   throw new Error( "Not valid name.")
}, "name2smiles")