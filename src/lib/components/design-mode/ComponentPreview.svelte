<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import { resolveProps, setMeasuredSize, type NormalizedDef } from "./registry.js";

  type Props = {
    def: NormalizedDef;
    values?: Record<string, unknown>;
    /** "tile" = scale down into a small palette icon; "canvas" = render at size. */
    mode?: "tile" | "canvas";
    /** Optional provider/theme wrapper applied around the rendered component. */
    wrapper?: Snippet<[inner: Snippet]>;
  };

  let { def, values = {}, mode = "tile", wrapper }: Props = $props();

  // NOTE: do NOT name a local `props` — it collides with svelte2tsx's internal
  // generated identifier and breaks type-checking of the $props() destructure.
  const resolved = $derived(resolveProps(def, values));
  const Cmp = $derived(def.component as Component<Record<string, any>> | undefined);

  let box = $state<HTMLDivElement | undefined>(undefined);
  let content = $state<HTMLDivElement | undefined>(undefined);
  let natW = $state(0);
  let natH = $state(0);
  let scale = $state(1);

  function measure() {
    if (!content) return;
    // offsetWidth/Height report the UNSCALED layout size (transform is visual only).
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    if (w > 0 && h > 0 && (w !== natW || h !== natH)) {
      natW = w;
      natH = h;
      setMeasuredSize(def.key, { width: w, height: h });
    }
  }

  $effect(() => {
    measure();
    if (!content) return;
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    return () => ro.disconnect();
  });

  // Fit the natural content into the box.
  $effect(() => {
    void [natW, natH, mode];
    if (!box || !natW || !natH) return;
    const bw = box.clientWidth || 1;
    const bh = box.clientHeight || 1;
    const fit = Math.min(bw / natW, bh / natH);
    scale = Math.min(fit, 1);
  });
</script>

{#snippet body()}
  {#if def.preview}
    {@render def.preview(values)}
  {:else if Cmp}
    <Cmp {...resolved} />
  {/if}
{/snippet}

<div bind:this={box} class="agd-preview" data-mode={mode}>
  <!-- inert + pointer-events:none: previews are visual only -->
  <div
    bind:this={content}
    class="agd-preview-content"
    inert
    style={`transform: scale(${scale}); transform-origin: ${mode === "tile" ? "center center" : "top left"};`}
  >
    {#if wrapper}{@render wrapper(body)}{:else}{@render body()}{/if}
  </div>
</div>

<style>
  .agd-preview {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    contain: layout paint;
    pointer-events: none;
  }
  .agd-preview[data-mode="canvas"] {
    align-items: flex-start;
    justify-content: flex-start;
  }
  .agd-preview-content {
    width: max-content;
    max-width: 1000px;
    flex: none;
  }
</style>
