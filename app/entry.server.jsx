React.useLayoutEffect = React.useEffect 

import { renderToString } from "react-dom/server";

import { RemixServer } from "remix";
import path from 'path'
import fs from 'fs'

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
