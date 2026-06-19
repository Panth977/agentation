<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import styles from "./styles.module.scss";

  let {
    class: className = "",
    checked = $bindable(),
    ...rest
  }: { class?: string; checked?: boolean } & HTMLInputAttributes = $props();
</script>

<div class={`${styles.switchContainer} ${className}`}>
  <input class={styles.switchInput} type="checkbox" bind:checked {...rest} />
  <div class={styles.switchThumb}></div>
</div>
