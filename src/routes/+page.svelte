<script lang="ts">
  // --- Install snippet (copy to clipboard with animated icon) ---
  const installCommand = "npm install agentation-svelte";
  let copied = $state(false);
  let copyTimer: number | null = null;
  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(installCommand);
    } catch {
      /* clipboard may be unavailable */
    }
    copied = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 2000) as unknown as number;
  }

  // --- Demo input ---
  let inputValue = $state("");

  // --- Example modal ---
  let modalOpen = $state(false);
  let modalExiting = $state(false);
  function openModal() {
    modalOpen = true;
    modalExiting = false;
  }
  function closeModal() {
    modalExiting = true;
    setTimeout(() => {
      modalOpen = false;
      modalExiting = false;
    }, 150);
  }

  // --- Shadow DOM modal ---
  let shadowHost = $state<HTMLDivElement>();
  let shadowOpen = $state(false);
  function openShadowModal() {
    shadowOpen = true;
  }
  function closeShadowModal() {
    shadowOpen = false;
  }

  const shadowMarkup = `
    <style>
      @keyframes ov { from { opacity: 0 } to { opacity: 1 } }
      @keyframes md { from { opacity: 0; transform: translate(-50%,-50%) scale(.95) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      .ov { position: fixed; inset: 0; background: rgba(255,255,255,.7); backdrop-filter: blur(4px); z-index: 9999; animation: ov .2s ease forwards; }
      .md { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 90%; max-width: 400px; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06); z-index: 10000; padding: 1.5rem; animation: md .2s cubic-bezier(.34,1.56,.64,1) forwards; font-family: system-ui, sans-serif; }
      .hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
      .ti { font-size: 1rem; font-weight: 600; color: #111; margin: 0; }
      .cl { width: 28px; height: 28px; border-radius: 50%; background: transparent; border: none; cursor: pointer; color: rgba(0,0,0,.4); }
      .cl:hover { background: rgba(0,0,0,.05); color: rgba(0,0,0,.7); }
      .bd { color: rgba(0,0,0,.65); font-size: .875rem; line-height: 1.5; margin-bottom: 1.25rem; }
      .ft { display: flex; justify-content: flex-end; gap: .5rem; }
      .bt { padding: .5rem 1rem; font-size: .8125rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; }
      .bs { background: transparent; color: rgba(0,0,0,.5); }
      .bp { background: #3c82f7; color: #fff; }
    </style>
    <div class="ov" data-close></div>
    <div class="md">
      <div class="hd">
        <h3 class="ti">Shadow DOM Modal</h3>
        <button class="cl" data-close>✕</button>
      </div>
      <div class="bd">
        <p>This modal is rendered inside a shadow DOM, isolating its styles from the page.</p>
        <p>Agentation can detect and annotate elements inside shadow DOM boundaries.</p>
      </div>
      <div class="ft">
        <button class="bt bs" data-close>Cancel</button>
        <button class="bt bp" data-close>Got It</button>
      </div>
    </div>
  `;

  $effect(() => {
    if (!shadowOpen || !shadowHost) return;
    const root = shadowHost.shadowRoot ?? shadowHost.attachShadow({ mode: "open" });
    const wrap = document.createElement("div");
    wrap.style.pointerEvents = "auto";
    wrap.innerHTML = shadowMarkup;
    root.replaceChildren(wrap);
    const onClick = (e: Event) => {
      if ((e.target as HTMLElement)?.hasAttribute("data-close")) closeShadowModal();
    };
    wrap.addEventListener("click", onClick);
    return () => {
      wrap.removeEventListener("click", onClick);
      root.replaceChildren();
    };
  });
</script>

<article class="article" style="padding-top: 3.75rem;">
  <header>
    <div class="heading-container">
      <h1>
        <span class="sketchy-underline">Visual feedback.</span><br />For
        <span class="pen-underline">agents.</span>
      </h1>
      <button class="install-snippet" title="Copy to clipboard" onclick={copyInstall}>
        <code>{installCommand}</code>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="copy-ic">
          {#if copied}
            <path d="M12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M15 10L11 14.25L9.25 12.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          {:else}
            <path d="M4.75 11.25C4.75 10.42 5.42 9.75 6.25 9.75H12.75C13.58 9.75 14.25 10.42 14.25 11.25V17.75C14.25 18.58 13.58 19.25 12.75 19.25H6.25C5.42 19.25 4.75 18.58 4.75 17.75V11.25Z" stroke="currentColor" stroke-width="1.5" />
            <path d="M17.25 14.25H17.75C18.58 14.25 19.25 13.58 19.25 12.75V6.25C19.25 5.42 18.58 4.75 17.75 4.75H11.25C10.42 4.75 9.75 5.42 9.75 6.25V6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          {/if}
        </svg>
      </button>
    </div>
    <p class="tagline">
      Agentation turns UI annotations into structured context that AI coding agents
      can understand and act on. Click any element, add a note, and paste the output
      into Claude Code, Codex, or any AI tool.
    </p>
  </header>

  <!-- Hero: the upstream <HeroDemo/> is a 1.7k-line animated component (out of
       scope for this port). Lightweight static stand-in below. -->
  <div class="hero-mock">
    <div class="hero-bar">
      <span></span><span></span><span></span>
    </div>
    <div class="hero-body">
      <div class="hero-skeleton title"></div>
      <div class="hero-skeleton line"></div>
      <div class="hero-skeleton line short"></div>
      <div class="hero-marker">1</div>
      <div class="hero-note">“Make this heading larger” →</div>
    </div>
  </div>

  <section>
    <h2>How you use it</h2>
    <ol>
      <li>
        Click the
        <svg class="inline-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 12L5.5 12" /><path d="M18.5 6.75L5.5 6.75" /><path d="M9.25 17.25L5.5 17.25" /><path d="M16 12.75L16.52 13.97C16.81 14.65 17.35 15.19 18.03 15.48L19.25 16L18.03 16.52C17.35 16.81 16.81 17.35 16.52 18.03L16 19.25L15.48 18.03C15.19 17.35 14.65 16.81 13.97 16.52L12.75 16L13.97 15.48C14.65 15.19 15.19 14.65 15.48 13.97L16 12.75Z" /></svg>
        icon in the bottom-right corner to activate
      </li>
      <li><strong>Hover</strong> over elements to see their names highlighted</li>
      <li><strong>Click</strong> any element to add an annotation</li>
      <li>Write your feedback and click <strong>Add</strong></li>
      <li>
        Click
        <svg class="inline-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4.75 11.25C4.75 10.42 5.42 9.75 6.25 9.75H12.75C13.58 9.75 14.25 10.42 14.25 11.25V17.75C14.25 18.58 13.58 19.25 12.75 19.25H6.25C5.42 19.25 4.75 18.58 4.75 17.75V11.25Z" /><path d="M17.25 14.25H17.75C18.58 14.25 19.25 13.58 19.25 12.75V6.25C19.25 5.42 18.58 4.75 17.75 4.75H11.25C10.42 4.75 9.75 5.42 9.75 6.25V6.75" /></svg>
        to copy formatted markdown
      </li>
      <li>Paste into your agent</li>
    </ol>
    <p class="note-line">
      <strong class="highlight">Note:</strong> With
      <a href="https://agentation.com/mcp" target="_blank" rel="noopener">MCP</a>, you can
      skip the copy-paste step entirely — your agent already sees what you're pointing at.
      Just say “address my feedback” or “fix annotation 3.”
    </p>
  </section>

  <section>
    <h2>How agents use it</h2>
    <p>
      Agentation works best with AI tools that have access to your codebase (Claude
      Code, Cursor, etc.). When you paste the output, agents get:
    </p>
    <ul>
      <li><strong>CSS selectors</strong> to grep your codebase</li>
      <li><strong>Source file paths</strong> to jump directly to the right line</li>
      <li><strong>Component tree</strong> to understand the hierarchy</li>
      <li><strong>Computed styles</strong> to understand current appearance</li>
      <li><strong>Your feedback</strong> with intent and priority</li>
    </ul>
    <p>
      Without Agentation, you'd have to describe the element (“the blue button in the
      sidebar”) and hope the agent guesses right. With Agentation, you give it
      <code>.sidebar &gt; button.primary</code> and it can grep for that directly.
    </p>
  </section>

  <section class="demo-section hide-on-mobile">
    <h2>Try it</h2>
    <p>The toolbar is active on this page. Try annotating these demo elements:</p>

    <div class="demo-elements">
      <div class="button-group">
        <button class="demo-button" onclick={() => alert("Primary clicked!")}>Primary</button>
        <button class="demo-button secondary" onclick={() => alert("Secondary clicked!")}>Secondary</button>
        <button class="demo-button" style="background: #3c82f7" onclick={openModal}>Modal</button>
        <button class="demo-button" style="background: #7c3aed" onclick={openShadowModal}>Shadow Modal</button>
      </div>

      <input
        type="text"
        class="demo-input"
        placeholder="Try selecting this text..."
        bind:value={inputValue}
      />

      <div class="demo-card">
        <h3>Example Card</h3>
        <p>
          Click on this card or select this text to create an annotation. The output
          will include the element path and your feedback.
        </p>
      </div>
    </div>
  </section>

  <section class="demo-section hide-on-mobile">
    <h2>Animation pause demo</h2>
    <p>
      Click
      <svg class="inline-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 6L8 18" /><path d="M16 18L16 6" /></svg>
      in the toolbar to freeze this animation:
    </p>
    <div class="animation-demo">
      <div class="progress-bar-demo"><div class="progress-bar"></div></div>
    </div>
  </section>

  <section>
    <h2>Agents talk back</h2>
    <p>
      With <a href="https://agentation.com/mcp" target="_blank" rel="noopener">MCP integration</a>
      and the <a href="https://agentation.com/schema" target="_blank" rel="noopener">Annotation Format Schema</a>,
      agents don't just read your annotations — they can respond to them:
    </p>
    <ul>
      <li><strong>“What annotations do I have?”</strong> — List all feedback across pages</li>
      <li><strong>“Should this be 24px or 16px?”</strong> — Agent asks for clarification</li>
      <li><strong>“Fixed the padding”</strong> — Agent resolves with a summary</li>
      <li><strong>“Clear all annotations”</strong> — Dismiss everything at once</li>
    </ul>
    <p>Your feedback becomes a conversation, not a one-way ticket into the void.</p>
  </section>

  <section>
    <h2>Best practices</h2>
    <ul>
      <li><strong>Be specific</strong> — “Button text unclear” is better than “fix this”</li>
      <li><strong>One issue per annotation</strong> — easier for the agent to address individually</li>
      <li><strong>Include context</strong> — mention what you expected vs. what you see</li>
      <li><strong>Use text selection</strong> — for typos or content issues, select the exact text</li>
      <li><strong>Pause animations</strong> — to annotate a specific animation frame</li>
    </ul>
  </section>

  <section>
    <h2>Licensing & credit</h2>
    <p>
      This is a community <strong>Svelte 5 port</strong> of
      <a href="https://github.com/benjitaylor/agentation" target="_blank" rel="noopener">benjitaylor/agentation</a>
      by Benji Taylor. All concepts, design, and output formats come from the upstream
      project. Agentation is licensed under PolyForm Shield 1.0.0 — see the upstream repo
      for terms.
    </p>
  </section>

  <section class="quickstart-links">
    <p><a class="styled-link" href="https://agentation.com/mcp" target="_blank" rel="noopener">Set up real-time sync with MCP <span class="arrow">→</span></a></p>
    <p><a class="styled-link" href="https://agentation.com/webhooks" target="_blank" rel="noopener">Push annotations to external services <span class="arrow">→</span></a></p>
    <p><a class="styled-link" href="https://github.com/benjitaylor/agentation" target="_blank" rel="noopener">View the original project on GitHub <span class="arrow">→</span></a></p>
  </section>
</article>

<!-- Example modal -->
{#if modalOpen}
  <div
    class="modal-overlay"
    class:exiting={modalExiting}
    role="presentation"
    onclick={closeModal}
  ></div>
  <div class="modal-content" class:exiting={modalExiting}>
    <div class="modal-header">
      <h3 class="modal-title">Example Modal</h3>
      <button class="modal-close" onclick={closeModal} aria-label="Close">✕</button>
    </div>
    <div class="modal-body">
      <p>This is an example modal dialog. You can use it to display important information, confirmations, or form inputs.</p>
      <p>Click outside the modal or use the buttons below to close it.</p>
    </div>
    <div class="modal-footer">
      <button class="modal-btn modal-btn-secondary" onclick={closeModal}>Cancel</button>
      <button class="modal-btn modal-btn-primary" onclick={closeModal}>Got It</button>
    </div>
  </div>
{/if}

<!-- Shadow DOM modal host -->
{#if shadowOpen}
  <div bind:this={shadowHost} class="shadow-host"></div>
{/if}

<style lang="scss">
  .article {
    max-width: 36rem;
    margin: 0 auto;
    padding: 0 1.5rem;
    color: #1a1a1a;
    font-size: 0.95rem;
    line-height: 1.65;

    h1 {
      font-size: 2rem;
      line-height: 1.15;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    h2 {
      font-size: 1.25rem;
      margin: 2.25rem 0 0.5rem;
    }
    h3 {
      margin: 0 0 0.4rem;
    }
    p {
      color: rgba(0, 0, 0, 0.72);
      margin: 0.5rem 0;
    }
    ol,
    ul {
      color: rgba(0, 0, 0, 0.72);
      padding-left: 1.25rem;
      line-height: 1.9;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.85em;
      background: rgba(0, 0, 0, 0.05);
      padding: 0.1em 0.35em;
      border-radius: 4px;
    }
    a {
      color: #3c82f7;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .heading-container {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sketchy-underline {
    background-image: linear-gradient(transparent 70%, rgba(60, 130, 247, 0.25) 0);
  }
  .pen-underline {
    border-bottom: 2px solid #3c82f7;
  }

  .install-snippet {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    padding: 0.4rem 0.7rem;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.8rem;
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    .copy-ic {
      flex: none;
    }
  }

  .tagline {
    font-size: 1.05rem;
    color: rgba(0, 0, 0, 0.6) !important;
    margin-top: 0.75rem;
  }

  .inline-ic {
    display: inline-block;
    vertical-align: -0.45em;
    width: 1.5em;
    height: 1.5em;
    margin: 0 -0.1em;
  }

  .note-line {
    font-size: 0.8125rem;
    color: rgba(0, 0, 0, 0.55) !important;
    margin-top: 1rem;
    .highlight {
      background-image: linear-gradient(75deg, rgba(250, 204, 21, 0.5), rgba(250, 204, 21, 0.15) 4%, rgba(250, 204, 21, 0.3) 96%, rgba(250, 204, 21, 0.6));
      padding: 0.04em 0.06em;
      border-radius: 0.2em 0.15em;
    }
  }

  /* Hero mock */
  .hero-mock {
    margin: 1.5rem 0 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  }
  .hero-bar {
    display: flex;
    gap: 6px;
    padding: 10px 12px;
    background: #f5f5f5;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.15);
    }
  }
  .hero-body {
    position: relative;
    padding: 2rem 1.5rem 2.5rem;
  }
  .hero-skeleton {
    height: 14px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.08);
    margin-bottom: 12px;
    &.title {
      height: 24px;
      width: 55%;
      background: rgba(0, 0, 0, 0.12);
    }
    &.line {
      width: 90%;
    }
    &.short {
      width: 70%;
    }
  }
  .hero-marker {
    position: absolute;
    top: 28px;
    left: calc(55% - 6px);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #3c82f7;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(60, 130, 247, 0.4);
  }
  .hero-note {
    position: absolute;
    top: 26px;
    right: 1.25rem;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.5);
  }

  /* Try it demos */
  .demo-elements {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }
  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .demo-button {
    padding: 0.55rem 1rem;
    border: none;
    border-radius: 8px;
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    &.secondary {
      background: rgba(0, 0, 0, 0.08);
      color: #1a1a1a;
    }
  }
  .demo-input {
    padding: 0.6rem 0.8rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    font-size: 0.95rem;
  }
  .demo-card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 1.25rem;
    background: #fff;
  }

  /* Animation demo */
  .animation-demo {
    margin-top: 1rem;
  }
  .progress-bar-demo {
    height: 10px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    width: 40%;
    border-radius: 999px;
    background: linear-gradient(90deg, #3c82f7, #7c3aed);
    animation: progressSlide 1.8s ease-in-out infinite;
  }
  @keyframes progressSlide {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(150%); }
    100% { transform: translateX(-100%); }
  }

  .quickstart-links {
    margin-top: 2.5rem;
    p {
      margin: 0.4rem 0;
    }
    .styled-link {
      font-weight: 600;
      .arrow {
        transition: transform 0.15s ease;
        display: inline-block;
      }
      &:hover .arrow {
        transform: translateX(3px);
      }
    }
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: modalOverlayEnter 0.2s ease forwards;
    &.exiting {
      animation: modalOverlayExit 0.15s ease forwards;
    }
  }
  .modal-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
    z-index: 10000;
    padding: 1.5rem;
    animation: modalEnter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    &.exiting {
      animation: modalExit 0.15s ease forwards;
    }
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: #111;
    margin: 0;
  }
  .modal-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.4);
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.7);
    }
  }
  .modal-body {
    color: rgba(0, 0, 0, 0.65);
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1.25rem;
    p + p {
      margin-top: 0.75rem;
    }
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  .modal-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    &.modal-btn-secondary {
      background: transparent;
      color: rgba(0, 0, 0, 0.5);
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
    &.modal-btn-primary {
      background: #3c82f7;
      color: #fff;
    }
  }
  .shadow-host {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
  }

  @keyframes modalOverlayEnter { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalOverlayExit { from { opacity: 1; } to { opacity: 0; } }
  @keyframes modalEnter { from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
  @keyframes modalExit { from { opacity: 1; transform: translate(-50%, -50%) scale(1); } to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } }

  @media (max-width: 767px) {
    .hide-on-mobile {
      display: none;
    }
  }
</style>
