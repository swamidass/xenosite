import { createMetaboliteRoute } from "~/molecule-focus/hop";
const route = createMetaboliteRoute(1);
export const loader = route.loader;
export const shouldRevalidate = route.shouldRevalidate;
export default route.default;
