<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { portal } from "$lib/actions/portal.js";
  import { originalSetTimeout } from "$lib/utils/freeze-animations.js";

  let {
    content,
    children,
    class: className = "",
    ...rest
  }: {
    content: string;
    children?: Snippet;
    class?: string;
  } & HTMLAttributes<HTMLSpanElement> = $props();

  let visible = $state(false);
  let shouldRender = $state(false);
  let position = $state({ top: 0, right: 0 });
  let triggerEl: HTMLSpanElement | undefined;
  let timeoutId: number | null = null;
  let exitTimeoutId: number | null = null;

  function updatePosition() {
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      position = {
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.left + 8,
      };
    }
  }

  function handleMouseEnter() {
    shouldRender = true;
    if (exitTimeoutId) {
      clearTimeout(exitTimeoutId);
      exitTimeoutId = null;
    }
    updatePosition();
    timeoutId = originalSetTimeout(() => {
      visible = true;
    }, 500);
  }

  function handleMouseLeave() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    visible = false;
    // Keep rendered during exit animation
    exitTimeoutId = originalSetTimeout(() => {
      shouldRender = false;
    }, 150);
  }

  $effect(() => () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (exitTimeoutId) clearTimeout(exitTimeoutId);
  });
</script>

<span
  bind:this={triggerEl}
  class={className}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  {...rest}
>
  {@render children?.()}
</span>

{#if shouldRender}
  <div
    use:portal
    data-feedback-toolbar
    class="agentation-tooltip"
    style="top: {position.top}px; right: {position.right}px; opacity: {visible ? 1 : 0};"
  >
    {content}
  </div>
{/if}

<style>
  /* :global so the rule still applies after the portal action relocates the
     node to <body> (outside this component's DOM subtree). */
  :global(.agentation-tooltip) {
    position: fixed;
    transform: translateY(-50%);
    padding: 6px 10px;
    background: #383838;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    font-weight: 400;
    line-height: 14px;
    border-radius: 10px;
    width: 180px;
    text-align: left;
    z-index: 100020;
    pointer-events: none;
    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.28);
    transition: opacity 0.15s ease;
  }
</style>
