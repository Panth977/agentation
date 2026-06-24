<script lang="ts">
  import type { EditorStore } from "./editor.svelte.js";
  import NodeView from "./NodeView.svelte";
  import styles from "./editor.module.scss";

  let { store }: { store: EditorStore } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class={styles.canvasWrap}
  onclick={() => store.clearSelection()}
  onmouseleave={() => (store.hover = null)}
>
  <div class={styles.canvasRoot}>
    <NodeView {store} node={store.doc.root} parentDirection={store.doc.root.direction} />
  </div>
</div>
