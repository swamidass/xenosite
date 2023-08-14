
export const resolve_query = async ({ model, query }) => {
    
  const url = model != "_" ? "/v0/" + model : "/v1/canonize";
  let response = await backend_api(query, url);

  if (!response) response = {};

  return {resolved_query: response, model};
};

const XENOSITE_BACKEND =
  process.env.XENOSITE_BACKEND || `http://127.0.0.1:8000`;
function _backend_fetch(url) {
  console.log("FETCH " + url);
  return fetch(url);
}

const backend_api = async (query, url) => {
  return await _backend_fetch(
    `${XENOSITE_BACKEND}${url}?` +
      new URLSearchParams({
        query: query,
        depict: "true",
        detailed: "false"
      })
  )
    .then((x) => x.json())
    .catch((e) => {
      console.error("Error in backend_api.");
      console.error(e);
    });
};
