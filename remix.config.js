/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: "vercel",
  // Test files under app/routes must not become real routes. Remix treats
  // `og.test.ts` as `/og/test` and would `require("vitest")` at serverless boot.
  ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],
  publicPath: "/build/",
  serverBuildPath: "api/index.js",
  serverMainFields: ["main", "module"],
  serverModuleFormat: "cjs",
  serverPlatform: "node",
  serverMinify: false,
  server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
  serverDependenciesToBundle:
    process.env.NODE_ENV === 'development' ? ['@vercel/og'] : [],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "api/index.js",
  // publicPath: "/build/",
};