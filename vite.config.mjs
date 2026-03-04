import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

export default defineConfig({
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: [".amazonaws.com", ".builtwithrocket.new"],
    proxy: {
      // Any request to /api/sheets gets forwarded to Apps Script
      // This runs server-side so there is no CORS issue at all
      "/api/sheets": {
        target: "https://script.google.com",
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        rewrite: (path) => {
          // Strip /api/sheets prefix — the full Apps Script path
          // comes from the VITE_GOOGLE_SCRIPT_PATH env var
          // e.g. /macros/s/YOUR_DEPLOYMENT_ID/exec
          return path.replace(/^\/api\/sheets/, process.env.VITE_GOOGLE_SCRIPT_PATH || "");
        },
      },
    },
  },
});