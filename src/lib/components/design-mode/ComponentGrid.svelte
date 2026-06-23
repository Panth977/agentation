<script lang="ts">
  import type { Snippet } from "svelte";
  import type { NormalizedSection, NormalizedDef } from "./registry.js";
  import styles from "./styles.module.scss";
  import ComponentPreview from "./ComponentPreview.svelte";

  type Props = {
    sections: NormalizedSection[];
    activeKey: string | null;
    onSelect: (key: string) => void;
    onDragStart: (key: string, e: MouseEvent) => void;
    scrollRef?: HTMLDivElement | null;
    fadeClass?: string;
    blankCanvas?: boolean;
    wrapper?: Snippet<[inner: Snippet]>;
  };

  let {
    sections,
    activeKey,
    onSelect,
    onDragStart,
    scrollRef = $bindable(null),
    fadeClass,
    blankCanvas,
    wrapper,
  }: Props = $props();

  let query = $state("");

  function matches(def: NormalizedDef, q: string): boolean {
    if (!q) return true;
    const hay = [def.label, def.group, def.description, ...(def.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  }

  const filtered = $derived(
    sections
      .map((s) => ({ section: s.section, items: s.items.filter((d) => matches(d, query)) }))
      .filter((s) => s.items.length > 0),
  );
</script>

<div class={styles.paletteSearch}>
  <input
    class={styles.paletteSearchInput}
    type="text"
    placeholder="Search components…"
    bind:value={query}
    onkeydown={(e) => e.stopPropagation()}
  />
</div>

<div bind:this={scrollRef} class={`${styles.placeScroll} ${fadeClass || ""}`}>
  {#if filtered.length === 0}
    <div class={styles.paletteEmpty}>No components match “{query}”.</div>
  {/if}
  {#each filtered as section (section.section)}
    <div class={styles.paletteSection}>
      <div class={styles.paletteSectionTitle}>{section.section}</div>
      {#each section.items as item (item.key)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class={`${styles.paletteItem} ${activeKey === item.key ? styles.active : ""} ${blankCanvas ? styles.wireframe : ""}`}
          title={item.description || item.label}
          onclick={() => onSelect(item.key)}
          onmousedown={(e) => {
            if (e.button === 0) onDragStart(item.key, e);
          }}
          role="button"
          tabindex="0"
        >
          <div class={styles.paletteItemIcon}>
            <ComponentPreview def={item} mode="tile" {wrapper} />
          </div>
          <span class={styles.paletteItemLabel}>{item.label}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
