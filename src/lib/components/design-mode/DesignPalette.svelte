<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import { type ComponentType } from "./types.js";
  import { originalRequestAnimationFrame, originalSetTimeout } from "$lib/utils/freeze-animations.js";
  import styles from "./styles.module.scss";
  import ComponentGrid from "./ComponentGrid.svelte";
  import RollingCount from "./RollingCount.svelte";

  function scrollFadeClass(el: HTMLDivElement | null) {
    if (!el) return "";
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    return `${top ? styles.fadeTop : ""} ${bottom ? styles.fadeBottom : ""}`;
  }

  type Props = {
    activeType: ComponentType | null;
    onSelect: (type: ComponentType) => void;
    isDarkMode: boolean;
    //
    sectionCount: number;
    onDetectSections: () => void;
    visible: boolean;
    onExited?: () => void;
    placementCount: number;
    onClearPlacements: () => void;
    onDragStart: (type: ComponentType, e: MouseEvent) => void;
    blankCanvas: boolean;
    onBlankCanvasChange: (on: boolean) => void;
    wireframePurpose: string;
    onWireframePurposeChange: (purpose: string) => void;
    Tooltip?: Component<{ content: string; children: Snippet }>;
  };

  let {
    activeType,
    onSelect,
    isDarkMode,
    sectionCount,
    onDetectSections,
    visible,
    onExited,
    placementCount,
    onClearPlacements,
    onDragStart,
    blankCanvas,
    onBlankCanvasChange,
    wireframePurpose,
    onWireframePurposeChange,
    Tooltip,
  }: Props = $props();

  let mounted = $state(false);
  let animClass = $state<"enter" | "exit">("exit");
  let footerVisible = $state(false);
  let footerCollapsed = $state(true);
  let lastFooterCount = $state(0);
  let lastFooterSuffix = $state("");

  let rafRef = 0;
  let exitTimerRef: ReturnType<typeof originalSetTimeout> | undefined;
  let placeScrollEl = $state<HTMLDivElement | null>(null);
  let placeFade = $state("");

  $effect(() => {
    if (visible) {
      mounted = true;
      clearTimeout(exitTimerRef);
      cancelAnimationFrame(rafRef);
      rafRef = originalRequestAnimationFrame(() => {
        rafRef = originalRequestAnimationFrame(() => {
          animClass = "enter";
        });
      });
    } else {
      cancelAnimationFrame(rafRef);
      animClass = "exit";
      clearTimeout(exitTimerRef);
      exitTimerRef = originalSetTimeout(() => {
        mounted = false;
        onExited?.();
      }, 200);
    }
    return () => cancelAnimationFrame(rafRef);
  });

  // Animate footer in/out based on whether there's anything to show
  const hasFooterContent = $derived(placementCount > 0 || sectionCount > 0);
  const totalCount = $derived(placementCount + sectionCount);

  // Sticky last-count/suffix: only update while there is content to show.
  $effect(() => {
    if (totalCount > 0) {
      lastFooterCount = totalCount;
      lastFooterSuffix = blankCanvas
        ? totalCount === 1
          ? "Component"
          : "Components"
        : totalCount === 1
          ? "Change"
          : "Changes";
    }
  });

  $effect(() => {
    if (hasFooterContent) {
      if (!footerVisible) {
        footerCollapsed = true;
        footerVisible = true;
        originalRequestAnimationFrame(() => {
          originalRequestAnimationFrame(() => {
            footerCollapsed = false;
          });
        });
      } else {
        footerCollapsed = false;
      }
    } else {
      footerCollapsed = true;
      const t = originalSetTimeout(() => (footerVisible = false), 300);
      return () => clearTimeout(t);
    }
  });

  // Scroll fade
  $effect(() => {
    if (!mounted) return;
    const el = placeScrollEl;
    if (!el) return;
    const update = () => (placeFade = scrollFadeClass(el));
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  });
</script>

{#if mounted}
  <div
    class={`${styles.palette} ${styles[animClass]} ${!isDarkMode ? styles.light : ""}`}
    data-feedback-toolbar
    data-agentation-palette
    role="presentation"
    onclick={(e) => e.stopPropagation()}
    onmousedown={(e) => e.stopPropagation()}
    ontransitionend={(e) => {
      if (e.target !== e.currentTarget) return;
      if (!visible) {
        clearTimeout(exitTimerRef);
        mounted = false;
        animClass = "exit";
        onExited?.();
      }
    }}
  >
    <!-- Panel header — fixed title with description -->
    <div class={styles.paletteHeader}>
      <div class={styles.paletteHeaderTitle}>Layout Mode</div>
      <div class={styles.paletteHeaderDesc}>
        Rearrange and resize existing elements, add new components, and explore layout ideas. Agent results may vary.
        <a href="https://agentation.dev/features#layout-mode" target="_blank" rel="noopener noreferrer">Learn more.</a>
      </div>
    </div>

    <!-- Wireframe toggle -->
    <div
      class={`${styles.canvasToggle} ${blankCanvas ? styles.active : ""}`}
      role="button"
      tabindex="0"
      onclick={() => onBlankCanvasChange(!blankCanvas)}
    >
      <span class={styles.canvasToggleIcon}>
        <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1" />
          <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="7" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="9.5" cy="4.5" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="4.5" cy="7" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="7" cy="7" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="9.5" cy="7" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="4.5" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="7" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
          <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" opacity=".6" />
        </svg>
      </span>
      <span class={styles.canvasToggleLabel}>Wireframe New Page</span>
    </div>
    <!-- Wireframe purpose textarea — only when wireframe active -->
    <div class={`${styles.wireframePurposeWrap} ${!blankCanvas ? styles.collapsed : ""}`}>
      <div class={styles.wireframePurposeInner}>
        <textarea
          class={styles.wireframePurposeInput}
          placeholder="Describe this page to provide additional context for your agent."
          value={wireframePurpose}
          oninput={(e) => onWireframePurposeChange(e.currentTarget.value)}
          rows={2}
        ></textarea>
      </div>
    </div>

    <!-- Component grid — always visible -->
    <ComponentGrid
      {activeType}
      {onSelect}
      {onDragStart}
      bind:scrollRef={placeScrollEl}
      fadeClass={placeFade}
      {blankCanvas}
    />

    <!-- Footer: change count + clear -->
    {#if footerVisible}
      <div class={`${styles.paletteFooterWrap} ${footerCollapsed ? styles.footerHidden : ""}`}>
        <div class={styles.paletteFooterInner}>
          <div class={styles.paletteFooterInnerContent}>
            <div class={styles.paletteFooter}>
              <span class={styles.paletteFooterCount}>
                <RollingCount value={lastFooterCount} suffix={lastFooterSuffix} />
              </span>
              <button class={styles.paletteFooterClear} onclick={onClearPlacements}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
