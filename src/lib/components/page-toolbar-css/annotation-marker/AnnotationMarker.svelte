<script lang="ts" module>
  import type { Annotation } from "../../../types.js";

  export type MarkerClickBehavior = "edit" | "delete";

  export type AnnotationMarkerProps = {
    annotation: Annotation;
    globalIndex: number;
    /** Display index within this layer (for staggered animation delays) */
    layerIndex: number;
    layerSize: number;
    isExiting: boolean;
    isClearing: boolean;
    isAnimated: boolean;
    isHovered: boolean;
    isDeleting: boolean;
    isEditingAny: boolean;
    renumberFrom: number | null;
    markerClickBehavior: MarkerClickBehavior;
    tooltipStyle?: string;
    onHoverEnter: (annotation: Annotation) => void;
    onHoverLeave: () => void;
    onClick: (annotation: Annotation) => void;
    onContextMenu?: (annotation: Annotation) => void;
  };
</script>

<script lang="ts">
  import { IconEdit, IconXmark } from "../../icons/index.js";
  import styles from "./styles.module.scss";

  let {
    annotation,
    globalIndex,
    layerIndex,
    layerSize,
    isExiting,
    isClearing,
    isAnimated,
    isHovered,
    isDeleting,
    isEditingAny,
    renumberFrom,
    markerClickBehavior,
    tooltipStyle,
    onHoverEnter,
    onHoverLeave,
    onClick,
    onContextMenu,
  }: AnnotationMarkerProps = $props();

  const showDeleteState = $derived(
    (isHovered || isDeleting) && !isEditingAny,
  );
  const showDeleteHover = $derived(
    showDeleteState && markerClickBehavior === "delete",
  );
  const isMulti = $derived(annotation.isMultiSelect);

  const markerColor = $derived(
    isMulti
      ? "var(--agentation-color-green)"
      : "var(--agentation-color-accent)",
  );

  const animClass = $derived(
    isExiting
      ? styles.exit
      : isClearing
        ? styles.clearing
        : !isAnimated
          ? styles.enter
          : "",
  );

  const animationDelay = $derived(
    isExiting
      ? `${(layerSize - 1 - layerIndex) * 20}ms`
      : `${layerIndex * 20}ms`,
  );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={`${styles.marker} ${isMulti ? styles.multiSelect : ""} ${animClass} ${showDeleteHover ? styles.hovered : ""}`}
  data-annotation-marker
  style:left={`${annotation.x}%`}
  style:top={`${annotation.y}px`}
  style:background-color={showDeleteHover ? undefined : markerColor}
  style:animation-delay={animationDelay}
  onmouseenter={() => onHoverEnter(annotation)}
  onmouseleave={onHoverLeave}
  onclick={(e) => {
    e.stopPropagation();
    if (!isExiting) onClick(annotation);
  }}
  oncontextmenu={onContextMenu
    ? (e) => {
        if (markerClickBehavior === "delete") {
          e.preventDefault();
          e.stopPropagation();
          if (!isExiting) onContextMenu(annotation);
        }
      }
    : undefined}
>
  {#if showDeleteState}
    {#if showDeleteHover}
      <IconXmark size={isMulti ? 18 : 16} />
    {:else}
      <IconEdit size={16} />
    {/if}
  {:else}
    <span
      class={renumberFrom !== null && globalIndex >= renumberFrom
        ? styles.renumber
        : undefined}
    >
      {globalIndex + 1}
    </span>
  {/if}

  {#if isHovered && !isEditingAny}
    <div class={`${styles.markerTooltip} ${styles.enter}`} style={tooltipStyle}>
      <span class={styles.markerQuote}>
        {annotation.element}{annotation.selectedText
          ? ` "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}"`
          : ""}
      </span>
      <span class={styles.markerNote}>{annotation.comment}</span>
    </div>
  {/if}
</div>
