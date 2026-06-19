import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // vitePreprocess enables <style lang="scss"> in components.
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
