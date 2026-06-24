<script lang="ts">
  import type { EditorStore } from "./editor.svelte.js";
  import type { SizeMode } from "./model.js";
  import { isContainer } from "./model.js";
  import { variantKind, variantOptions, type VariantSpec } from "../design-mode/registry.js";
  import styles from "./editor.module.scss";

  let { store }: { store: EditorStore } = $props();

  const node = $derived(store.selectedNode);
  const multi = $derived(store.selection.size > 1);

  const sizeVal = (m: SizeMode) => (m === "hug" || m === "fill" ? m : "fixed");
  function setSize(axis: "width" | "height", v: string) {
    if (!node) return;
    const mode: SizeMode = v === "fixed" ? { fixed: axis === "width" ? 240 : 120 } : (v as SizeMode);
    store.update(node.id, axis === "width" ? { width: mode } : { height: mode });
  }
</script>

<div class={styles.right}>
  <div class={styles.panelH}>Inspector</div>
  <div class={styles.insp}>
    {#if !node}
      {#if multi}
        <div class={styles.emptyInsp}>{store.selection.size} selected.<br /><br />Press <b style="color:#bef264">⌘G</b> to group them into a frame.</div>
      {:else}
        <div class={styles.emptyInsp}>Nothing selected.<br /><br />Add a component from the left, then select it to set alignment, size &amp; props.</div>
      {/if}
    {:else}
      <div class={styles.flbl}>Name</div>
      <input
        class={styles.nameInput}
        value={node.name}
        oninput={(e) => store.update(node.id, { name: e.currentTarget.value })}
      />

      {#if isContainer(node)}
        <div class={styles.flbl}>Direction</div>
        <div class={styles.seg}>
          {#each [["row", "→ Row"], ["column", "↓ Column"]] as [v, t] (v)}
            <button class={node.direction === v ? styles.on : ""} onclick={() => store.setDirection(node.id, v as any)}>{t}</button>
          {/each}
        </div>

        <div class={styles.flbl}>Align (cross axis)</div>
        <div class={styles.seg}>
          {#each [["start", "Start"], ["center", "Center"], ["end", "End"], ["stretch", "Stretch"]] as [v, t] (v)}
            <button class={node.align === v ? styles.on : ""} onclick={() => store.setAlign(node.id, v as any)}>{t}</button>
          {/each}
        </div>

        <div class={styles.flbl}>Justify (main axis)</div>
        <div class={styles.seg}>
          {#each [["start", "Start"], ["center", "Center"], ["end", "End"], ["between", "Between"]] as [v, t] (v)}
            <button class={node.justify === v ? styles.on : ""} onclick={() => store.setJustify(node.id, v as any)}>{t}</button>
          {/each}
        </div>

        <div class={styles.flbl}>Gap — {node.gap}px</div>
        <input type="range" min="0" max="48" value={node.gap} oninput={(e) => store.setGap(node.id, +e.currentTarget.value)} />
      {:else}
        {@const def = store.defOf(node)}
        <div class={styles.meta} style="margin-top:6px">component · src="{node.src ?? "—"}"</div>

        {#if def?.variants}
          {#each Object.entries(def.variants) as [key, spec] (key)}
            {@const k = variantKind(spec as VariantSpec)}
            <div class={styles.flbl}>{key}</div>
            {#if k === "enum"}
              <div class={styles.seg}>
                {#each variantOptions(spec as VariantSpec) as opt (opt)}
                  <button class={node.variantValues[key] === opt ? styles.on : ""} onclick={() => store.setVariant(node.id, key, opt)}>{opt}</button>
                {/each}
              </div>
            {:else if k === "boolean"}
              <div class={styles.seg}>
                <button class={node.variantValues[key] ? styles.on : ""} onclick={() => store.setVariant(node.id, key, true)}>On</button>
                <button class={!node.variantValues[key] ? styles.on : ""} onclick={() => store.setVariant(node.id, key, false)}>Off</button>
              </div>
            {:else if k === "number"}
              <input type="range" min="0" max="100" value={Number(node.variantValues[key]) || 0} oninput={(e) => store.setVariant(node.id, key, +e.currentTarget.value)} />
            {:else}
              <input class={styles.nameInput} value={String(node.variantValues[key] ?? "")} oninput={(e) => store.setVariant(node.id, key, e.currentTarget.value)} />
            {/if}
          {/each}
        {/if}

        <div class={styles.flbl}>Note / prompt (for the agent)</div>
        <textarea
          placeholder="e.g. submits the signup form"
          value={node.note ?? ""}
          oninput={(e) => store.setNote(node.id, e.currentTarget.value)}
        ></textarea>
      {/if}

      <div class={styles.flbl}>Width</div>
      <div class={styles.seg}>
        {#each [["hug", "Hug"], ["fill", "Fill"], ["fixed", "Fixed"]] as [v, t] (v)}
          <button class={sizeVal(node.width) === v ? styles.on : ""} onclick={() => setSize("width", v)}>{t}</button>
        {/each}
      </div>
      <div class={styles.flbl}>Height</div>
      <div class={styles.seg}>
        {#each [["hug", "Hug"], ["fill", "Fill"], ["fixed", "Fixed"]] as [v, t] (v)}
          <button class={sizeVal(node.height) === v ? styles.on : ""} onclick={() => setSize("height", v)}>{t}</button>
        {/each}
      </div>
    {/if}
  </div>
</div>
