/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  publicPath: "/build/",
  serverBuildPath: "api/index.js",
  serverMainFields: ["main", "module"],
  serverModuleFormat: "cjs",
  serverPlatform: "node",
  serverMinify: false,
  // server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
 // ignoredRouteFiles: [".*"],
  serverDependenciesToBundle:
    process.env.NODE_ENV === 'development' ? ['@vercel/og'] : [],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "api/index.js",
  // publicPath: "/build/",

  // You can opt-in to the new meta API with a future flag in 
  // Remix config.
  future: {
    v2_meta: true,
  },
};
