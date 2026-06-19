import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    // Injected at build time; mirrors the React package's __VERSION__.
    __VERSION__: JSON.stringify(pkg.version),
  },
});
