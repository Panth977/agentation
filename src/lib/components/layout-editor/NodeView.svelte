<script lang="ts">
  import type { Snippet } from "svelte";
  import type { EditorStore } from "./editor.svelte.js";
  import type { Node, Direction, SizeMode, Align, Justify } from "./model.js";
  import { isContainer } from "./model.js";
  import ComponentPreview from "../design-mode/ComponentPreview.svelte";
  import Self from "./NodeView.svelte";
  import styles from "./editor.module.scss";

  let {
    store,
    node,
    parentDirection = "column",
    wrapper,
  }: { store: EditorStore; node: Node; parentDirection?: Direction; wrapper?: Snippet<[inner: Snippet]> } = $props();

  const selected = $derived(store.isSelected(node.id));
  const hovered = $derived(store.hover === node.id && !selected);

  // Map a node's size modes + the parent's main axis to flexbox CSS.
  function boxStyle(): string {
    const parts: string[] = [];
    const w = node.width as SizeMode;
    const h = node.height as SizeMode;
    const mainIsWidth = parentDirection === "row";

    // main-axis sizing → flex; cross-axis → explicit dimension / stretch
    const main = mainIsWidth ? w : h;
    if (main === "fill") parts.push("flex:1 1 0;");
    else if (main === "hug") parts.push("flex:0 0 auto;");
    else parts.push(`flex:0 0 ${main.fixed}px;`);

    const cross = mainIsWidth ? h : w;
    const crossProp = mainIsWidth ? "height" : "width";
    if (cross === "fill") parts.push("align-self:stretch;");
    else if (cross === "hug") parts.push(`${crossProp}:max-content;`);
    else parts.push(`${crossProp}:${cross.fixed}px;`);

    // explicit fixed on the main axis too (so it's honoured)
    if (typeof main === "object") parts.push(mainIsWidth ? `width:${main.fixed}px;` : `height:${main.fixed}px;`);
    return parts.join("");
  }

  const alignMap: Record<Align, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
  const justifyMap: Record<Justify, string> = {
    start: "flex-start", center: "center", end: "flex-end",
    between: "space-between", around: "space-around", evenly: "space-evenly",
  };

  function containerLayout(): string {
    if (!isContainer(node)) return "";
    if (node.layout === "grid") {
      return `display:grid;grid-template-columns:repeat(${node.cols ?? 2},1fr);gap:${node.gap}px;` +
        `padding:${node.padding.t}px ${node.padding.r}px ${node.padding.b}px ${node.padding.l}px;`;
    }
    return (
      `display:flex;flex-direction:${node.direction};gap:${node.gap}px;` +
      `align-items:${alignMap[node.align]};justify-content:${justifyMap[node.justify]};` +
      (node.wrap ? "flex-wrap:wrap;" : "") +
      `padding:${node.padding.t}px ${node.padding.r}px ${node.padding.b}px ${node.padding.l}px;`
    );
  }

  function onClick(e: MouseEvent) {
    e.stopPropagation();
    store.select(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
  }
  function onOver(e: MouseEvent) {
    e.stopPropagation();
    store.hover = node.id;
  }
</script>

{#if isContainer(node)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    data-node-id={node.id}
    class={`${styles.node} ${styles.frame} ${selected ? styles.selected : ""} ${hovered ? styles.hovered : ""} ${node.children.length === 0 ? styles.empty : ""}`}
    style={boxStyle() + containerLayout()}
    onclick={onClick}
    onmouseover={onOver}
  >
    {#each node.children as child (child.id)}
      <Self {store} node={child} parentDirection={node.layout === "grid" ? "row" : node.direction} {wrapper} />
    {/each}
  </div>
{:else}
  {@const def = store.defOf(node)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    data-node-id={node.id}
    class={`${styles.node} ${styles.leaf} ${selected ? styles.selected : ""} ${hovered ? styles.hovered : ""}`}
    style={boxStyle()}
    onclick={onClick}
    onmouseover={onOver}
  >
    {#if def}
      <ComponentPreview {def} values={node.variantValues} mode="canvas" {wrapper} />
    {:else}
      <span class={styles.missing}>{node.name}</span>
    {/if}
    {#if node.note}<span class={styles.noteDot} title={node.note}>●</span>{/if}
  </div>
{/if}
