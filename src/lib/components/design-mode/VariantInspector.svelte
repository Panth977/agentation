<script lang="ts">
  import Switch from "../switch/Switch.svelte";
  import {
    variantKind,
    variantOptions,
    type NormalizedDef,
  } from "./registry.js";
  import styles from "./styles.module.scss";

  type Props = {
    def: NormalizedDef;
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    isDarkMode?: boolean;
  };

  let { def, values, onChange, isDarkMode = true }: Props = $props();

  const entries = $derived(Object.entries(def.variants ?? {}));

  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }
</script>

{#if entries.length > 0}
  <div
    class={`${styles.variantInspector} ${!isDarkMode ? styles.light : ""}`}
    data-feedback-toolbar
    role="presentation"
    onpointerdown={(e) => e.stopPropagation()}
    onmousedown={(e) => e.stopPropagation()}
    onclick={(e) => e.stopPropagation()}
  >
    <div class={styles.variantTitle}>{def.label}</div>
    {#each entries as [key, spec] (key)}
      <div class={styles.variantRow}>
        <span class={styles.variantLabel}>{key}</span>
        <div class={styles.variantControl}>
          {#if variantKind(spec) === "enum"}
            <div class={styles.variantSegmented}>
              {#each variantOptions(spec) as opt (opt)}
                <button
                  type="button"
                  class={`${styles.variantSeg} ${values[key] === opt ? styles.variantSegActive : ""}`}
                  onclick={() => set(key, opt)}
                >
                  {opt}
                </button>
              {/each}
            </div>
          {:else if variantKind(spec) === "boolean"}
            <Switch
              checked={!!values[key]}
              onchange={(e: Event & { currentTarget: HTMLInputElement }) =>
                set(key, e.currentTarget.checked)}
            />
          {:else if variantKind(spec) === "number"}
            <input
              class={styles.variantNumber}
              type="range"
              min={(spec as { min?: number }).min ?? 0}
              max={(spec as { max?: number }).max ?? 100}
              step={(spec as { step?: number }).step ?? 1}
              value={Number(values[key] ?? 0)}
              oninput={(e) => set(key, Number(e.currentTarget.value))}
            />
          {:else}
            <input
              class={styles.variantText}
              type="text"
              value={String(values[key] ?? "")}
              oninput={(e) => set(key, e.currentTarget.value)}
            />
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
