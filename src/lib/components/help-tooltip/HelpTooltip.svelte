<script lang="ts">
  import Tooltip from "../tooltip/Tooltip.svelte";
  import IconHelp from "../icons/IconHelp.svelte";
  import styles from "./styles.module.scss";

  let { content }: { content: string } = $props();
</script>

<Tooltip class={styles.tooltip} {content}>
  <IconHelp class={styles.tooltipIcon} />
</Tooltip>
