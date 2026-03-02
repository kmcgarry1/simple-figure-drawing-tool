import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split("\\").join("/");

          if (normalizedId.includes("/node_modules/")) {
            if (normalizedId.includes("/node_modules/@vercel/")) {
              return "vendor-vercel";
            }
            return "vendor";
          }

          if (
            normalizedId.includes("/src/composables/figureSession/") ||
            normalizedId.includes("/src/composables/useFigureSession.js") ||
            normalizedId.includes("/src/utils/classPlan.js") ||
            normalizedId.includes("/src/utils/photoInput.js")
          ) {
            return "feature-session";
          }

          if (normalizedId.includes("/src/composables/usePhoneRemote.js")) {
            return "feature-remote";
          }

          return undefined;
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  }
});
