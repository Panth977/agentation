<footer class="footer">
  <p>
    Made by
    <a href="https://x.com/benjitaylor" target="_blank" rel="noopener noreferrer">Benji Taylor</a>,
    <a href="https://x.com/seldom" target="_blank" rel="noopener noreferrer">Dennis Jin</a>, and
    <a href="https://x.com/alexvanderzon" target="_blank" rel="noopener noreferrer">Alex Vanderzon</a>
  </p>
  <p class="attribution">
    Svelte 5 port of
    <a href="https://github.com/benjitaylor/agentation" target="_blank" rel="noopener noreferrer">agentation</a>
    by Benji Taylor.
  </p>
</footer>

<style lang="scss">
  .footer {
    max-width: 36rem;
    margin: 0 auto;
    padding: 1rem 1.5rem 3rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    text-align: left;
    color: rgba(0, 0, 0, 0.4);
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    a {
      color: rgba(0, 0, 0, 0.5);
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover {
        color: rgba(0, 0, 0, 0.7);
      }
    }

    .attribution {
      color: rgba(0, 0, 0, 0.35);
    }
  }
</style>
