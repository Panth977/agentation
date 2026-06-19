<script lang="ts">
  import styles from "./styles.module.scss";
  import IconTrash from "../icons/IconTrash.svelte";
  import { originalSetTimeout } from "$lib/utils/freeze-animations.js";
  import { untrack } from "svelte";
  import type { AnnotationPopupCSSProps } from "./types.js";

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /** Focus an element while temporarily blocking focus-trap libraries (e.g. Radix
   *  FocusScope) from reclaiming focus via focusin/focusout handlers. */
  function focusBypassingTraps(el: HTMLElement | null) {
    if (!el) return;
    const trap = (e: Event) => e.stopImmediatePropagation();
    document.addEventListener("focusin", trap, true);
    document.addEventListener("focusout", trap, true);
    try {
      el.focus();
    } finally {
      document.removeEventListener("focusin", trap, true);
      document.removeEventListener("focusout", trap, true);
    }
  }

  // ===========================================================================
  // Props
  // ===========================================================================

  let {
    element,
    timestamp,
    selectedText,
    placeholder = "What should change?",
    initialValue = "",
    submitLabel = "Add",
    onSubmit,
    onCancel,
    onDelete,
    style,
    accentColor = "#3c82f7",
    isExiting = false,
    lightMode = false,
    computedStyles,
  }: AnnotationPopupCSSProps = $props();

  // ===========================================================================
  // State
  // ===========================================================================

  // `initialValue` is intentionally captured only as the initial value (matches
  // React's useState(initialValue)); later prop changes do not reset the text.
  let text = $state(untrack(() => initialValue));
  let isShaking = $state(false);
  let animState = $state<"initial" | "enter" | "entered" | "exit">("initial");
  let isFocused = $state(false);
  let isStylesExpanded = $state(false); // Computed styles accordion state

  let textareaEl: HTMLTextAreaElement | null = null;
  let popupEl: HTMLDivElement | null = null;
  let cancelTimer: number | null = null;
  let shakeTimer: number | null = null;

  // Sync with parent exit state
  $effect(() => {
    if (isExiting && animState !== "exit") {
      animState = "exit";
    }
  });

  // Animate in on mount and focus textarea
  $effect(() => {
    // Start enter animation (use originalSetTimeout to bypass freeze patch)
    originalSetTimeout(() => {
      animState = "enter";
    }, 0);
    // Transition to entered state after animation completes
    const enterTimer = originalSetTimeout(() => {
      animState = "entered";
    }, 200); // Match animation duration
    const focusTimer = originalSetTimeout(() => {
      const textarea = textareaEl;
      if (textarea) {
        focusBypassingTraps(textarea);
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        textarea.scrollTop = textarea.scrollHeight;
      }
    }, 50);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(focusTimer);
      if (cancelTimer) clearTimeout(cancelTimer);
      if (shakeTimer) clearTimeout(shakeTimer);
    };
  });

  // ===========================================================================
  // Imperative handle (exposed via bind:this)
  // ===========================================================================

  /** Shake the popup (e.g., when user clicks outside) */
  export function shake() {
    if (shakeTimer) clearTimeout(shakeTimer);
    isShaking = true;
    shakeTimer = originalSetTimeout(() => {
      isShaking = false;
      focusBypassingTraps(textareaEl);
    }, 250);
  }

  // ===========================================================================
  // Handlers
  // ===========================================================================

  // Handle cancel with exit animation
  function handleCancel() {
    animState = "exit";
    cancelTimer = originalSetTimeout(() => {
      onCancel();
    }, 150); // Match exit animation duration
  }

  // Handle submit
  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
  }

  // Handle keyboard
  function handleKeyDown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  }

  function handleHeaderToggle() {
    const wasExpanded = isStylesExpanded;
    isStylesExpanded = !isStylesExpanded;
    if (wasExpanded) {
      // Refocus textarea when closing
      originalSetTimeout(() => focusBypassingTraps(textareaEl), 0);
    }
  }

  const hasComputedStyles = $derived(
    !!computedStyles && Object.keys(computedStyles).length > 0,
  );

  const popupClassName = $derived(
    [
      styles.popup,
      lightMode ? styles.light : "",
      animState === "enter" ? styles.enter : "",
      animState === "entered" ? styles.entered : "",
      animState === "exit" ? styles.exit : "",
      isShaking ? styles.shake : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  bind:this={popupEl}
  class={popupClassName}
  data-annotation-popup
  {style}
  onclick={(e) => e.stopPropagation()}
>
  <div class={styles.header}>
    {#if hasComputedStyles}
      <button class={styles.headerToggle} onclick={handleHeaderToggle} type="button">
        <svg
          class={`${styles.chevron} ${isStylesExpanded ? styles.expanded : ""}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.5 10.25L9 7.25L5.75 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class={styles.element}>{element}</span>
      </button>
    {:else}
      <span class={styles.element}>{element}</span>
    {/if}
    {#if timestamp}
      <span class={styles.timestamp}>{timestamp}</span>
    {/if}
  </div>

  <!-- Collapsible computed styles section - uses grid-template-rows for smooth animation -->
  {#if hasComputedStyles}
    <div class={`${styles.stylesWrapper} ${isStylesExpanded ? styles.expanded : ""}`}>
      <div class={styles.stylesInner}>
        <div class={styles.stylesBlock}>
          {#each Object.entries(computedStyles!) as [key, value] (key)}
            <div class={styles.styleLine}>
              <span class={styles.styleProperty}
                >{key.replace(/([A-Z])/g, "-$1").toLowerCase()}</span
              >: <span class={styles.styleValue}>{value}</span>;
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if selectedText}
    <div class={styles.quote}>
      &ldquo;{selectedText.slice(0, 80)}{selectedText.length > 80
        ? "..."
        : ""}&rdquo;
    </div>
  {/if}

  <textarea
    bind:this={textareaEl}
    class={styles.textarea}
    style:border-color={isFocused ? accentColor : undefined}
    {placeholder}
    bind:value={text}
    onfocus={() => (isFocused = true)}
    onblur={() => (isFocused = false)}
    rows={2}
    onkeydown={handleKeyDown}
  ></textarea>

  <div class={styles.actions}>
    {#if onDelete}
      <div class={styles.deleteWrapper}>
        <button class={styles.deleteButton} onclick={onDelete} type="button">
          <IconTrash size={22} />
        </button>
      </div>
    {/if}
    <button class={styles.cancel} onclick={handleCancel}>Cancel</button>
    <button
      class={styles.submit}
      style:background-color={accentColor}
      style:opacity={text.trim() ? 1 : 0.4}
      onclick={handleSubmit}
      disabled={!text.trim()}
    >
      {submitLabel}
    </button>
  </div>
</div>
