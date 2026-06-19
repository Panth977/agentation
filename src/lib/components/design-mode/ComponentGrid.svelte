<script lang="ts">
  import { COMPONENT_REGISTRY, type ComponentType } from "./types.js";
  import styles from "./styles.module.scss";
  import PaletteIconSvg from "./PaletteIconSvg.svelte";

  type Props = {
    activeType: ComponentType | null;
    onSelect: (type: ComponentType) => void;
    onDragStart: (type: ComponentType, e: MouseEvent) => void;
    scrollRef?: HTMLDivElement | null;
    fadeClass?: string;
    blankCanvas?: boolean;
  };

  let {
    activeType,
    onSelect,
    onDragStart,
    scrollRef = $bindable(null),
    fadeClass,
    blankCanvas,
  }: Props = $props();
</script>

<div bind:this={scrollRef} class={`${styles.placeScroll} ${fadeClass || ""}`}>
  {#each COMPONENT_REGISTRY as section (section.section)}
    <div class={styles.paletteSection}>
      <div class={styles.paletteSectionTitle}>{section.section}</div>
      {#each section.items as item (item.type)}
        <div
          class={`${styles.paletteItem} ${activeType === item.type ? styles.active : ""} ${blankCanvas ? styles.wireframe : ""}`}
          onclick={() => onSelect(item.type)}
          onmousedown={(e) => {
            if (e.button === 0) onDragStart(item.type, e);
          }}
          role="button"
          tabindex="0"
        >
          <div class={styles.paletteItemIcon}>
            <PaletteIconSvg type={item.type} />
          </div>
          <span class={styles.paletteItemLabel}>{item.label}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
