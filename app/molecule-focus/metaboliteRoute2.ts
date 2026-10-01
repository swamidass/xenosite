import { createMetaboliteRoute } from "~/molecule-focus/hop";

const route = createMetaboliteRoute(2);
export const loader = route.loader;
export const clientLoader = route.clientLoader;
export const headers = route.headers;
export const shouldRevalidate = route.shouldRevalidate;
export default route.default;
