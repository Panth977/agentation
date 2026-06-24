<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import { EditorStore } from "./editor.svelte.js";
  import type { NormalizedRegistry } from "../design-mode/registry.js";
  import type { Document } from "./model.js";
  import LeftPanel from "./LeftPanel.svelte";
  import Canvas from "./Canvas.svelte";
  import Inspector from "./Inspector.svelte";
  import styles from "./editor.module.scss";

  let {
    registry,
    initial,
    wrapper,
    onClose,
    onCopy,
    onChange,
  }: {
    registry: NormalizedRegistry;
    initial?: Document;
    wrapper?: Snippet<[inner: Snippet]>;
    onClose?: () => void;
    onCopy?: (xml: string) => void;
    onChange?: (doc: Document) => void;
  } = $props();

  const store = untrack(() => new EditorStore(registry, initial));

  // Notify parent of document changes (for persistence / output).
  $effect(() => {
    onChange?.(store.doc);
  });

  function copyXml() {
    const xml = store.toXml();
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(xml).catch(() => {});
    onCopy?.(xml);
  }

  function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (/input|textarea/i.test(t.tagName)) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? store.redo() : store.undo();
    } else if (mod && e.key.toLowerCase() === "g") {
      e.preventDefault();
      e.shiftKey ? store.ungroup() : store.group();
    } else if (mod && e.key.toLowerCase() === "d") {
      e.preventDefault();
      store.duplicate();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      store.remove();
    } else if (e.key === "Escape") {
      if (store.selection.size) store.clearSelection();
      else onClose?.();
    }
  }

  $effect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const hasSel = $derived(store.selection.size > 0);
  const canUngroup = $derived(store.selectedNodes.some((n) => n.kind === "container" && n.id !== store.doc.root.id));
</script>

<div class={styles.editor} data-feedback-toolbar data-agentation-layout-editor>
  <div class={styles.topbar}>
    <span class={styles.title}><span class={styles.diamond}></span> Layout</span>

    <button class={styles.tbtn} disabled={!hasSel} onclick={() => store.group()} title="Group (⌘G)">⊞ Group</button>
    <button class={styles.tbtn} disabled={!canUngroup} onclick={() => store.ungroup()} title="Ungroup (⌘⇧G)">⊟ Ungroup</button>
    <button class={styles.tbtn} disabled={!hasSel} onclick={() => store.duplicate()} title="Duplicate (⌘D)">⧉</button>
    <button class={styles.tbtn} disabled={!hasSel} onclick={() => store.remove()} title="Delete (⌫)">🗑</button>

    <span style="width:1px;height:20px;background:rgba(255,255,255,.12);margin:0 4px"></span>

    <button class={styles.tbtn} disabled={!store.canUndo} onclick={() => store.undo()} title="Undo (⌘Z)">↶</button>
    <button class={styles.tbtn} disabled={!store.canRedo} onclick={() => store.redo()} title="Redo (⌘⇧Z)">↷</button>

    <span class={styles.spacer}></span>

    <button class={`${styles.tbtn} ${styles.pri}`} onclick={copyXml} title="Copy the layout XML for the agent">⧉ Copy XML</button>
    {#if onClose}<button class={styles.tbtn} onclick={onClose} title="Close (Esc)">✕ Done</button>{/if}
  </div>

  <LeftPanel {store} />
  <Canvas {store} {wrapper} />
  <Inspector {store} />
</div>
