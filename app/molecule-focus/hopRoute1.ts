import { createHopRoute } from "~/molecule-focus/hop";

const route = createHopRoute(1);
export const loader = route.loader;
export const shouldRevalidate = route.shouldRevalidate;
export default route.default;
