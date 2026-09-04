import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "stub-css",
      transform(_code, id) {
        if (id.split("?")[0].endsWith(".css")) {
          return { code: "export default '';", map: null };
        }
      },
    },
  ],
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.test.ts", "app/**/*.test.tsx"],
      reporter: ["text", "text-summary"],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
});
