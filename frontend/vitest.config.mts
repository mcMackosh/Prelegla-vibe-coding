import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // @react-pdf/renderer's default export is the Node build, which stubs out
      // browser-only APIs like PDFDownloadLink. Point tests at the browser build
      // so components using it can be rendered under jsdom.
      "@react-pdf/renderer": fileURLToPath(
        new URL("./node_modules/@react-pdf/renderer/lib/react-pdf.browser.js", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    },
  },
});
