<script lang="ts" module>
  import type { Annotation } from "../../../types.js";

  export type ExitingMarkerProps = {
    annotation: Annotation;
    fixed?: boolean;
  };
</script>

<script lang="ts">
  import { IconXmark } from "../../icons/index.js";
  import styles from "./styles.module.scss";

  let { annotation, fixed }: ExitingMarkerProps = $props();

  const isMulti = $derived(annotation.isMultiSelect);
</script>

<div
  class={`${styles.marker} ${fixed ? styles.fixed : ""} ${styles.hovered} ${isMulti ? styles.multiSelect : ""} ${styles.exit}`}
  data-annotation-marker
  style:left={`${annotation.x}%`}
  style:top={annotation.y}
>
  <IconXmark size={isMulti ? 12 : 10} />
</div>
