import { createClient } from "@supabase/supabase-js";
import KeyvDynamoDb from "keyv-dynamodb";
import Keyv from "keyv";

const supabase = createClient(
  process.env.SUPABASE_API,
  process.env.SUPABASE_API_KEY,
  {
    fetch: fetch
  }
);

const credentials = {
  accessKeyId: process.env.AWS_SDK_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SDK_SECRET_ACCESS_KEY,
};

const KvDDb = new KeyvDynamoDb({
  tableName: "XenositeCache",
  clientOptions: {
    region: process.env.AWS_SDK_REGION,
    credentials: credentials,
  },
});

export function DBMemoize(
  func,
  prefix,
  keyfunc = (prefix, args) => `${args[0]}`
) {
  const cache = new Keyv({ store: KvDDb, namespace: prefix });

  return async function wrapped(...args) {
    const key = keyfunc(prefix, args);

    const data = await cache.get(key).catch((x) => undefined);
    console.log(data);

    if (data) {
      console.log("HIT", key);
      return data;
    }

    const result = await func(...args);

    await cache.set(key, result);

    return result;
  };
}

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