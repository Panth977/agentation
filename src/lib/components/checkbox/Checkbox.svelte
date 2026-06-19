<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import styles from "./styles.module.scss";

  let {
    class: className = "",
    checked = $bindable(),
    ...rest
  }: { class?: string; checked?: boolean } & HTMLInputAttributes = $props();
</script>

<div class={`${styles.checkboxContainer} ${className}`}>
  <input class={styles.checkboxInput} type="checkbox" bind:checked {...rest} />
  <svg
    class={styles.checkboxCheck}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
  >
    <path
      class={styles.checkboxCheckPath}
      d="M3.94 7L6.13 9.19L10.5 4.81"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>
