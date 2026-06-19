<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import Checkbox from "../../../checkbox/Checkbox.svelte";
  import HelpTooltip from "../../../help-tooltip/HelpTooltip.svelte";
  import styles from "./styles.module.scss";

  let {
    class: className = "",
    label,
    tooltip,
    checked,
    onchange,
    ...rest
  }: {
    class?: string;
    label: string;
    tooltip?: string;
    checked?: boolean;
    onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  } & Omit<HTMLAttributes<HTMLDivElement>, "onchange"> = $props();

  const id = $props.id();
</script>

<div class={`${styles.container} ${className}`} {...rest}>
  <Checkbox {id} {onchange} {checked} />
  <label class={styles.label} for={id}>
    {label}
  </label>
  {#if tooltip}
    <HelpTooltip content={tooltip} />
  {/if}
</div>
