<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import { resolveProps, setMeasuredSize, resolveSizing, type NormalizedDef } from "./registry.js";

  type Props = {
    def: NormalizedDef;
    values?: Record<string, unknown>;
    /** "tile" = scale down into a palette thumbnail; "canvas" = render at size. */
    mode?: "tile" | "canvas";
    /** Optional provider/theme wrapper applied around the rendered component. */
    wrapper?: Snippet<[inner: Snippet]>;
  };

  let { def, values = {}, mode = "tile", wrapper }: Props = $props();

  // NOTE: do NOT name a local `props` — it collides with svelte2tsx internals.
  const resolved = $derived(resolveProps(def, values));
  const Cmp = $derived(def.component as Component<Record<string, any>> | undefined);
  const sizing = $derived(resolveSizing(def));

  let box = $state<HTMLDivElement | undefined>(undefined);
  let content = $state<HTMLDivElement | undefined>(undefined);
  let natW = $state(0);
  let natH = $state(0);
  let scale = $state(1);

  // Measure the component's natural (unscaled) size — only in tile mode, where
  // content is laid out at max-content. This feeds sizeForKey() so intrinsic
  // placements open at the component's real size. (Canvas mode fills the box for
  // fluid axes, so its layout size isn't a useful natural measurement.)
  function measure() {
    if (mode !== "tile" || !content) return;
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    if (w > 0 && h > 0 && (w !== natW || h !== natH)) {
      natW = w;
      natH = h;
      setMeasuredSize(def.key, { width: w, height: h });
    }
  }

  $effect(() => {
    if (mode !== "tile") return;
    measure();
    if (!content) return;
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    return () => ro.disconnect();
  });

  // Tile: scale the natural content down to fit the thumbnail box.
  $effect(() => {
    void [natW, natH, mode];
    if (mode !== "tile" || !box || !natW || !natH) return;
    const bw = box.clientWidth || 1;
    const bh = box.clientHeight || 1;
    scale = Math.min(Math.min(bw / natW, bh / natH), 1);
  });

  // Inline style for the content wrapper.
  const contentStyle = $derived(
    mode === "tile"
      ? `width: max-content; transform: scale(${scale}); transform-origin: center center;`
      : `width: ${sizing.width === "fluid" ? "100%" : "max-content"}; height: ${sizing.height === "fluid" ? "100%" : "auto"};`,
  );
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
  <div bind:this={content} class="agd-preview-content" inert style={contentStyle}>
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
    align-items: stretch;
    justify-content: stretch;
  }
  .agd-preview-content {
    max-width: 1200px;
    flex: none;
  }
  .agd-preview[data-mode="canvas"] .agd-preview-content {
    max-width: none;
  }
</style>
