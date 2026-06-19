<script lang="ts">
  import { Agentation } from "$lib/index.js";
  let { children } = $props();
</script>

<header class="site-header">
  <a class="brand" href="/">◆ Acme</a>
  <nav>
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/pricing">Pricing</a>
  </nav>
  <button class="cta">Sign up</button>
</header>

<div class="site-body">
  {@render children?.()}
</div>

<footer class="site-footer">
  <div>
    <strong>Acme</strong>
    <p>A sample app for testing the Agentation Svelte toolbar.</p>
  </div>
  <div>
    <span>Product</span><span>Docs</span><span>Blog</span><span>Contact</span>
  </div>
</footer>

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
  .site-footer {
    display: flex;
    justify-content: space-between;
    padding: 2rem;
    margin-top: 3rem;
    border-top: 1px solid #eaeaea;
    background: #fff;
    color: #777;
  }
  .site-footer span {
    display: block;
    margin-bottom: 0.4rem;
  }
</style>
