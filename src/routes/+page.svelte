<script lang="ts">
  const features = [
    { title: "Click to comment", body: "Point at any element and leave structured feedback." },
    { title: "Select text", body: "Highlight copy and annotate exactly what should change." },
    { title: "Design mode", body: "Place and rearrange component skeletons in-page." },
    { title: "Stream to AI", body: "Copy as Markdown, send to a webhook, or sync to MCP." },
  ];
</script>

<section class="hero">
  <h1>Ship feedback your AI agent can actually use</h1>
  <p class="sub">
    Agentation turns clicks and comments into structured, source-located
    instructions. This page exists to test the Svelte 5 port.
  </p>
  <div class="hero-actions">
    <button class="primary">Get started</button>
    <button class="ghost">View docs</button>
  </div>
  <img src="https://placehold.co/720x320?text=Hero+Screenshot" alt="Product screenshot" />
</section>

<section class="features">
  <h2>Features</h2>
  <div class="grid">
    {#each features as f (f.title)}
      <article class="card">
        <h3>{f.title}</h3>
        <p>{f.body}</p>
        <a href="/dashboard">Learn more →</a>
      </article>
    {/each}
  </div>
</section>

<section class="signup">
  <h2>Try it</h2>
  <form onsubmit={(e) => e.preventDefault()}>
    <label>
      Name
      <input type="text" placeholder="Ada Lovelace" />
    </label>
    <label>
      Email
      <input type="email" placeholder="ada@example.com" />
    </label>
    <label class="checkbox">
      <input type="checkbox" /> Subscribe to the newsletter
    </label>
    <button class="primary" type="submit">Submit</button>
  </form>
</section>

<style>
  section {
    max-width: 880px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }
  .hero {
    text-align: center;
  }
  .hero h1 {
    font-size: 2.4rem;
    line-height: 1.15;
    margin: 0 0 1rem;
  }
  .sub {
    color: #666;
    font-size: 1.1rem;
    max-width: 560px;
    margin: 0 auto 1.5rem;
  }
  .hero-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 2rem;
  }
  button.primary {
    background: #0088ff;
    color: #fff;
    border: none;
    padding: 0.65rem 1.3rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  button.ghost {
    background: transparent;
    border: 1px solid #ccc;
    padding: 0.65rem 1.3rem;
    border-radius: 8px;
    cursor: pointer;
  }
  .hero img {
    max-width: 100%;
    border-radius: 12px;
    border: 1px solid #eaeaea;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .card {
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    padding: 1.25rem;
  }
  .card h3 {
    margin: 0 0 0.4rem;
  }
  .card p {
    color: #666;
    margin: 0 0 0.6rem;
  }
  .card a {
    color: #0088ff;
    text-decoration: none;
    font-size: 0.9rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 420px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.9rem;
    color: #444;
  }
  label.checkbox {
    flex-direction: row;
    align-items: center;
  }
  input[type="text"],
  input[type="email"] {
    padding: 0.6rem 0.75rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
  }
</style>
