<script lang="ts">
  const tiers = [
    { name: "Hobby", price: "$0", features: ["1 project", "Local-only", "Community support"], featured: false },
    { name: "Pro", price: "$19", features: ["Unlimited projects", "MCP sync", "Webhooks", "Email support"], featured: true },
    { name: "Team", price: "$49", features: ["Everything in Pro", "Shared sessions", "SSO", "Priority support"], featured: false },
  ];
</script>

<section>
  <h1>Pricing</h1>
  <p class="lead">Simple plans for testing the toolbar against varied layouts.</p>

  <div class="tiers">
    {#each tiers as t (t.name)}
      <article class="tier" class:featured={t.featured}>
        {#if t.featured}<span class="ribbon">Popular</span>{/if}
        <h3>{t.name}</h3>
        <div class="price">{t.price}<small>/mo</small></div>
        <ul>
          {#each t.features as f (f)}<li>✓ {f}</li>{/each}
        </ul>
        <button class:primary={t.featured}>Choose {t.name}</button>
      </article>
    {/each}
  </div>
</section>

<style>
  section {
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    text-align: center;
  }
  .lead {
    color: #666;
    margin-bottom: 2rem;
  }
  .tiers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
  .tier {
    position: relative;
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 16px;
    padding: 1.75rem 1.25rem;
    text-align: left;
  }
  .tier.featured {
    border-color: #0088ff;
    box-shadow: 0 8px 30px rgba(0, 136, 255, 0.12);
  }
  .ribbon {
    position: absolute;
    top: -10px;
    right: 1rem;
    background: #0088ff;
    color: #fff;
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }
  .price {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0.5rem 0 1rem;
  }
  .price small {
    font-size: 0.9rem;
    font-weight: 500;
    color: #999;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    line-height: 2;
    color: #444;
  }
  button {
    width: 100%;
    padding: 0.65rem;
    border-radius: 8px;
    border: 1px solid #ccc;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
  }
  button.primary {
    background: #0088ff;
    color: #fff;
    border-color: #0088ff;
  }
</style>
