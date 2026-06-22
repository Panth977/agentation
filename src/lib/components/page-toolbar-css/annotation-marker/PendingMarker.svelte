<script lang="ts" module>
  export type PendingMarkerProps = {
    x: number;
    y: number;
    isMultiSelect?: boolean;
    isExiting: boolean;
  };
</script>

<script lang="ts">
  import { IconPlus } from "../../icons/index.js";
  import styles from "./styles.module.scss";

  let { x, y, isMultiSelect, isExiting }: PendingMarkerProps = $props();
</script>

<div
  class={`${styles.marker} ${styles.pending} ${isMultiSelect ? styles.multiSelect : ""} ${isExiting ? styles.exit : styles.enter}`}
  style:left={`${x}%`}
  style:top={`${y}px`}
  style:background-color={isMultiSelect
    ? "var(--agentation-color-green)"
    : "var(--agentation-color-accent)"}
>
  <IconPlus size={12} />
</div>
