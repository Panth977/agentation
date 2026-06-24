<script lang="ts">
  import type { EditorStore } from "./editor.svelte.js";
  import type { Node } from "./model.js";
  import { isContainer } from "./model.js";
  import ComponentPreview from "../design-mode/ComponentPreview.svelte";
  import styles from "./editor.module.scss";

  let { store }: { store: EditorStore } = $props();

  let query = $state("");

  const sections = $derived(
    store.registry.sections
      .map((s) => ({
        section: s.section,
        items: s.items.filter((d) => {
          if (!query) return true;
          const hay = [d.label, d.group, d.description, ...(d.keywords ?? [])].join(" ").toLowerCase();
          return hay.includes(query.toLowerCase());
        }),
      }))
      .filter((s) => s.items.length > 0),
  );
</script>

<div class={styles.left}>
  <div class={styles.panelH}>Components</div>
  <div class={styles.panelBody} style="flex:1.2">
    <input class={styles.search} placeholder="Search components…" bind:value={query} />
    {#each sections as section (section.section)}
      <div class={styles.palGroup}>{section.section}</div>
      {#each section.items as def (def.key)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class={styles.palItem} onclick={() => store.addComponent(def)} title={def.description || def.label}>
          <span class={styles.palIcon}><ComponentPreview {def} mode="tile" /></span>
          {def.label}
        </div>
      {/each}
    {/each}
  </div>

  <div class={styles.panelH} style="border-top:1px solid rgba(255,255,255,.09)">Layers</div>
  <div class={styles.panelBody} style="flex:1">
    {#snippet layer(node: Node, depth: number)}
      {@const sel = store.isSelected(node.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <div
        class={`${styles.layer} ${isContainer(node) ? styles.frameRow : ""} ${sel ? styles.sel : ""}`}
        style={`padding-left:${8 + depth * 14}px`}
        onclick={(e) => store.select(node.id, e.shiftKey || e.metaKey)}
        onmouseover={(e) => { e.stopPropagation(); store.hover = node.id; }}
        onmouseleave={() => (store.hover = null)}
      >
        <span class={styles.ic}>{isContainer(node) ? "▣" : "◆"}</span>
        <span class={styles.layerName}>{node.name}</span>
      </div>
      {#if isContainer(node)}
        {#each node.children as child (child.id)}
          {@render layer(child, depth + 1)}
        {/each}
      {/if}
    {/snippet}
    {@render layer(store.doc.root, 0)}
  </div>
</div>
