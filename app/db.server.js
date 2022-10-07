// import { createClient } from "@supabase/supabase-js";
// const AWS = require("aws-sdk");

// const supabase = createClient(
//   process.env.SUPABASE_API,
//   process.env.SUPABASE_API_KEY,
//   {
//     fetch: fetch,
//   }
// );
// );

// const credentials = {
//   accessKeyId: process.env.AWS_SDK_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SDK_SECRET_ACCESS_KEY,
// };

// const documentClient = new AWS.DynamoDB.DocumentClient({
//   region: process.env.AWS_SDK_REGION,
//   credentials: credentials,
// });

// async function getKey(key) {
//   return await documentClient
//     .get({
//       TableName: "XenositeCache",
//       Key: { Cid: key },
//     })
//     .promise()
//     .then((x) => x.Item?.value);
// }

// async function putKey(key, value, ttl) {
//   var expires = ttl ? Math.floor(Date.now() / 1000) + ttl : undefined;
//   return await documentClient
//     .put({
//       Item: { Cid: key, value, expires },
//       TableName: "XenositeCache",
//     })
//     .promise();
// }

// export function DBMemoize(func, prefix, keyfunc = (args) => args[0]) {
//   return async (...args) => {
//     if (args[0] == null) return null;
//     const _key = keyfunc(args);
//     if (typeof _key !== "string") throw Error("Key arg must be string.");
//     const key = `${prefix}:${_key}`;

//     const data = await getKey(key).catch(console.log);

//     if (typeof data !== "undefined") {
//       console.log("HIT", key, data);
//       return data;
//     } else {
//       console.log("MISS", key);
//     }

//     const result = await func(...args);

//     await putKey(key, result).catch(console.log);

//     return result;
//   };
// }

/*
export function SupabaseMemoize(func, prefix, keyfunc = (prefix, args) => `${prefix}:${args[0]}` ) {
	
	return async function wrapped (...args) {
	    const key = keyfunc(prefix, args)

		const { data, error } = await supabase
          .from('cache')
          .select('value')
          .eq('key', key)

        if (data.length) {
	      console.log("HIT", key)
          return data[0].value
        }

        const result = await func(...args)

		await supabase
          .from('cache')
          .upsert({'value': result, 'key': key})

        return result	
	}
	
}*/

export default supabase;
