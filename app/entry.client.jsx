import { hydrate } from "react-dom";
import { RemixBrowser } from "remix";

globalThis.isServer = false

hydrate(<RemixBrowser />, document);
