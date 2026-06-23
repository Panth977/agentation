<script lang="ts">
  import { Agentation } from "$lib/index.js";
  import Footer from "./Footer.svelte";
  let { children } = $props();
  // To try a custom component registry instead of the built-ins, import
  // `demoRegistry` from "./_demo/registry.js" and pass `components={demoRegistry}`
  // to <Agentation/> below. (See docs/LAYOUT_MODE_REGISTRY.md.)
</script>

<header class="site-header">
  <a class="brand" href="/">◆ Agentation</a>
  <nav>
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/pricing">Pricing</a>
    <a href="https://github.com/benjitaylor/agentation" target="_blank" rel="noopener">Original ↗</a>
  </nav>
  <button class="cta">Sign up</button>
</header>

<div class="site-body">
  {@render children?.()}
</div>

<Footer />

<!-- The ported toolbar — available on every page -->
<Agentation />

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    background: #fafafa;
  }
  .site-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.9rem 2rem;
    border-bottom: 1px solid #eaeaea;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .brand {
    font-weight: 700;
    font-size: 1.1rem;
    text-decoration: none;
    color: #1a1a1a;
  }
  nav {
    display: flex;
    gap: 1.25rem;
    margin-left: auto;
  }
  nav a {
    text-decoration: none;
    color: #555;
    font-size: 0.95rem;
  }
  nav a:hover {
    color: #000;
  }
  .cta {
    border: none;
    background: #0088ff;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .site-body {
    min-height: 70vh;
  }
</style>
