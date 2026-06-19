<script lang="ts" module>
  import type { ComponentType, DesignPlacement } from "./types.js";

  export type SnapRect = { x: number; y: number; width: number; height: number };

  export type DesignModeProps = {
    placements: DesignPlacement[];
    onChange: (placements: DesignPlacement[]) => void;
    activeComponent: ComponentType | null;
    onActiveComponentChange: (type: ComponentType | null) => void;
    isDarkMode: boolean;
    exiting?: boolean;
    onInteractionChange?: (active: boolean) => void;
    className?: string;
    passthrough?: boolean;
    extraSnapRects?: SnapRect[];
    onSelectionChange?: (selectedIds: Set<string>, isShift: boolean) => void;
    deselectSignal?: number;
    onDragMove?: (dx: number, dy: number) => void;
    onDragEnd?: (dx: number, dy: number, committed: boolean) => void;
    clearSignal?: number;
    wireframe?: boolean;
  };

  type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
  type Guide = { axis: "x" | "y"; pos: number };

  const MIN_SIZE = 24;
  const SNAP_THRESHOLD = 5;

  function computeSnap(
    rect: SnapRect,
    others: DesignPlacement[],
    excludeIds: Set<string>,
    activeEdges?: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean },
    extraRects?: SnapRect[],
  ): { dx: number; dy: number; guides: Guide[] } {
    let bestDx = Infinity;
    let bestDy = Infinity;

    const mL = rect.x, mR = rect.x + rect.width, mCx = rect.x + rect.width / 2;
    const mT = rect.y, mB = rect.y + rect.height, mCy = rect.y + rect.height / 2;

    const checkAll = !activeEdges;
    const xFroms = checkAll ? [mL, mR, mCx] : [
      ...(activeEdges.left ? [mL] : []),
      ...(activeEdges.right ? [mR] : []),
    ];
    const yFroms = checkAll ? [mT, mB, mCy] : [
      ...(activeEdges.top ? [mT] : []),
      ...(activeEdges.bottom ? [mB] : []),
    ];

    // Build unified list of snap target rects
    const allTargets: SnapRect[] = [];
    for (const o of others) {
      if (!excludeIds.has((o as DesignPlacement).id)) allTargets.push(o);
    }
    if (extraRects) allTargets.push(...extraRects);

    for (const o of allTargets) {
      const oL = o.x, oR = o.x + o.width, oCx = o.x + o.width / 2;
      const oT = o.y, oB = o.y + o.height, oCy = o.y + o.height / 2;

      for (const from of xFroms) {
        for (const to of [oL, oR, oCx]) {
          const d = to - from;
          if (Math.abs(d) < SNAP_THRESHOLD && Math.abs(d) < Math.abs(bestDx)) bestDx = d;
        }
      }
      for (const from of yFroms) {
        for (const to of [oT, oB, oCy]) {
          const d = to - from;
          if (Math.abs(d) < SNAP_THRESHOLD && Math.abs(d) < Math.abs(bestDy)) bestDy = d;
        }
      }
    }

    const dx = Math.abs(bestDx) < SNAP_THRESHOLD ? bestDx : 0;
    const dy = Math.abs(bestDy) < SNAP_THRESHOLD ? bestDy : 0;

    // Collect guide lines at snapped positions
    const guides: Guide[] = [];
    const seen = new Set<string>();
    const sL = mL + dx, sR = mR + dx, sCx = mCx + dx;
    const sT = mT + dy, sB = mB + dy, sCy = mCy + dy;

    for (const o of allTargets) {
      const oL = o.x, oR = o.x + o.width, oCx = o.x + o.width / 2;
      const oT = o.y, oB = o.y + o.height, oCy = o.y + o.height / 2;

      for (const xPos of [oL, oCx, oR]) {
        for (const sx of [sL, sCx, sR]) {
          if (Math.abs(sx - xPos) < 0.5) {
            const key = `x:${Math.round(xPos)}`;
            if (!seen.has(key)) { seen.add(key); guides.push({ axis: "x", pos: xPos }); }
          }
        }
      }
      for (const yPos of [oT, oCy, oB]) {
        for (const sy of [sT, sCy, sB]) {
          if (Math.abs(sy - yPos) < 0.5) {
            const key = `y:${Math.round(yPos)}`;
            if (!seen.has(key)) { seen.add(key); guides.push({ axis: "y", pos: yPos }); }
          }
        }
      }
    }

    return { dx, dy, guides };
  }

  function generateId() {
    return `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
</script>

<script lang="ts">
  import { COMPONENT_MAP, DEFAULT_SIZES } from "./types.js";
  import Skeleton from "./Skeleton.svelte";
  import AnnotationPopupCSS from "../annotation-popup-css/AnnotationPopupCSS.svelte";
  import styles from "./styles.module.scss";
  import { originalSetTimeout } from "$lib/utils/freeze-animations.js";

  let {
    placements,
    onChange,
    activeComponent,
    onActiveComponentChange,
    isDarkMode,
    exiting,
    onInteractionChange,
    className: extraClassName,
    passthrough,
    extraSnapRects,
    onSelectionChange,
    deselectSignal,
    onDragMove,
    onDragEnd,
    clearSignal,
    wireframe,
  }: DesignModeProps = $props();

  // --- State ---
  let selectedIds = $state<Set<string>>(new Set());
  let drawBox = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let selectBox = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let sizeIndicator = $state<{ x: number; y: number; text: string } | null>(null);
  let guides = $state<Guide[]>([]);
  let editingId = $state<string | null>(null);
  let editExiting = $state(false);
  let exitingIds = $state<Set<string>>(new Set());

  // --- Plain mutable refs (non-reactive) ---
  let editHadText = $state(false);
  const lastAnnotationText = new Map<string, string>();
  let interaction: string | null = null; // "place" | "move" | "resize" | "select"

  // Stable references (read current props inside event handlers)
  function placementsRef() {
    return placements;
  }

  // --- Clear selection when the other overlay signals deselect ---
  let deselectRef = deselectSignal;
  $effect(() => {
    if (deselectSignal !== deselectRef) {
      deselectRef = deselectSignal;
      selectedIds = new Set();
    }
  });

  // --- Animate all out when clearSignal fires ---
  let clearRef = clearSignal;
  $effect(() => {
    if (clearSignal !== undefined && clearSignal !== clearRef) {
      clearRef = clearSignal;
      const allIds = new Set(placements.map((p) => p.id));
      if (allIds.size > 0) {
        exitingIds = allIds;
        selectedIds = new Set();
        interaction = null;
        originalSetTimeout(() => {
          onChange([]);
          exitingIds = new Set();
        }, 180);
      }
    }
  });

  // --- Keyboard: arrow nudge, delete, escape ---
  $effect(() => {
    // Track deps so the handler closure stays current.
    selectedIds;
    activeComponent;
    placements;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      // Delete selected (animate out, then remove)
      if ((e.key === "Backspace" || e.key === "Delete") && selectedIds.size > 0) {
        e.preventDefault();
        const toDelete = new Set(selectedIds);
        exitingIds = toDelete;
        selectedIds = new Set();
        originalSetTimeout(() => {
          onChange(placementsRef().filter((p) => !toDelete.has(p.id)));
          exitingIds = new Set();
        }, 180);
        return;
      }

      // Arrow nudge
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedIds.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        onChange(
          placements.map((p) =>
            selectedIds.has(p.id)
              ? { ...p, x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) }
              : p,
          ),
        );
        return;
      }

      // Escape: deselect palette → deselect all
      if (e.key === "Escape") {
        if (activeComponent) {
          onActiveComponentChange(null);
        } else if (selectedIds.size > 0) {
          selectedIds = new Set();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  // --- Click on empty space: place or start select box ---
  function handleOverlayMouseDown(e: MouseEvent) {
    // Only handle left click on the overlay itself
    if (e.button !== 0) return;
    if (passthrough) return; // Let clicks fall through to rearrange
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.placement}`)) return;

    e.preventDefault();
    e.stopPropagation();

    const scrollY = window.scrollY;
    const startX = e.clientX;
    const startY = e.clientY;

    if (activeComponent) {
      // --- Place by click or drag ---
      interaction = "place";
      onInteractionChange?.(true);
      let isDrag = false;
      let endX = startX;
      let endY = startY;

      const onMove = (ev: MouseEvent) => {
        endX = ev.clientX;
        endY = ev.clientY;
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        if (dx > 5 || dy > 5) isDrag = true;

        if (isDrag) {
          const x = Math.min(startX, endX);
          const y = Math.min(startY, endY);
          const w = Math.abs(endX - startX);
          const h = Math.abs(endY - startY);
          drawBox = { x, y, w, h };
          sizeIndicator = { x: ev.clientX + 12, y: ev.clientY + 12, text: `${Math.round(w)} × ${Math.round(h)}` };
        }
      };

      const onUp = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        drawBox = null;
        sizeIndicator = null;
        interaction = null;
        onInteractionChange?.(false);

        if (!activeComponent) return;
        const def = DEFAULT_SIZES[activeComponent];
        let x: number, y: number, w: number, h: number;

        if (isDrag) {
          x = Math.min(startX, endX);
          y = Math.min(startY, endY) + scrollY;
          w = Math.max(MIN_SIZE, Math.abs(endX - startX));
          h = Math.max(MIN_SIZE, Math.abs(endY - startY));
        } else {
          w = def.width;
          h = def.height;
          x = startX - w / 2;
          y = startY + scrollY - h / 2;
        }

        x = Math.max(0, x);
        y = Math.max(0, y);

        const placement: DesignPlacement = {
          id: generateId(),
          type: activeComponent,
          x,
          y,
          width: w,
          height: h,
          scrollY,
          timestamp: Date.now(),
        };

        const next = [...placements, placement];
        onChange(next);
        selectedIds = new Set([placement.id]);

        // Clear active component so overlay goes passthrough (allows rearrange clicks)
        onActiveComponentChange(null);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    } else {
      // --- Deselect and start select box ---
      if (!e.shiftKey) {
        selectedIds = new Set();
      }

      interaction = "select";
      let isDrag = false;

      const onMove = (ev: MouseEvent) => {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx > 4 || dy > 4) isDrag = true;

        if (isDrag) {
          const x = Math.min(startX, ev.clientX);
          const y = Math.min(startY, ev.clientY);
          selectBox = { x, y, w: Math.abs(ev.clientX - startX), h: Math.abs(ev.clientY - startY) };
        }
      };

      const onUp = (ev: MouseEvent) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        interaction = null;

        if (isDrag) {
          const boxX = Math.min(startX, ev.clientX);
          const boxY = Math.min(startY, ev.clientY) + scrollY;
          const boxW = Math.abs(ev.clientX - startX);
          const boxH = Math.abs(ev.clientY - startY);

          const newSelected = new Set(e.shiftKey ? selectedIds : new Set<string>());
          for (const p of placements) {
            if (
              p.x + p.width > boxX &&
              p.x < boxX + boxW &&
              p.y + p.height > boxY &&
              p.y < boxY + boxH
            ) {
              newSelected.add(p.id);
            }
          }
          selectedIds = newSelected;
        }

        selectBox = null;
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
  }

  // --- Click on a placement: select ---
  function handlePlacementMouseDown(e: MouseEvent, id: string) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.handle}`) || target.closest(`.${styles.deleteButton}`)) return;

    e.preventDefault();
    e.stopPropagation();

    // Select
    let newSelected: Set<string>;
    if (e.shiftKey) {
      newSelected = new Set(selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
    } else if (!selectedIds.has(id)) {
      newSelected = new Set([id]);
    } else {
      newSelected = new Set(selectedIds);
    }
    const prevSelected = selectedIds;
    selectedIds = newSelected;
    // Only notify if selection actually changed (avoids deselecting other overlay when clicking an already-selected item to drag)
    const changed = newSelected.size !== prevSelected.size || [...newSelected].some((x) => !prevSelected.has(x));
    if (changed) onSelectionChange?.(newSelected, e.shiftKey);

    // Start drag-to-move
    const startX = e.clientX;
    const startY = e.clientY;

    const startPositions = new Map<string, { x: number; y: number }>();
    for (const p of placements) {
      if (newSelected.has(p.id)) {
        startPositions.set(p.id, { x: p.x, y: p.y });
      }
    }

    interaction = "move";
    onInteractionChange?.(true);
    let moved = false;
    let duplicated = false;
    let basePlacements = placements;
    let lastSnappedDx = 0, lastSnappedDy = 0;

    // Build bounding sizes for selection (constant during drag)
    const selSizes = new Map<string, { w: number; h: number }>();
    for (const p of placements) {
      if (startPositions.has(p.id)) selSizes.set(p.id, { w: p.width, h: p.height });
    }

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      if (!moved) return;

      // Option+drag: duplicate selected placements (once per drag)
      if (ev.altKey && !duplicated) {
        duplicated = true;
        const clones: DesignPlacement[] = [];
        for (const p of placements) {
          if (startPositions.has(p.id)) {
            clones.push({ ...p, id: generateId(), timestamp: Date.now() });
          }
        }
        basePlacements = [...placements, ...clones];
      }

      // Compute bounding box of selection at prospective position
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [id, start] of startPositions) {
        const sz = selSizes.get(id);
        if (!sz) continue;
        minX = Math.min(minX, start.x + dx);
        minY = Math.min(minY, start.y + dy);
        maxX = Math.max(maxX, start.x + dx + sz.w);
        maxY = Math.max(maxY, start.y + dy + sz.h);
      }
      const selRect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      const { dx: snapDx, dy: snapDy, guides: newGuides } = computeSnap(selRect, basePlacements, new Set(startPositions.keys()), undefined, extraSnapRects);
      guides = newGuides;

      const snappedDx = dx + snapDx;
      const snappedDy = dy + snapDy;
      lastSnappedDx = snappedDx;
      lastSnappedDy = snappedDy;
      onChange(
        basePlacements.map((p) => {
          const start = startPositions.get(p.id);
          if (!start) return p;
          return { ...p, x: Math.max(0, start.x + snappedDx), y: Math.max(0, start.y + snappedDy) };
        }),
      );
      onDragMove?.(snappedDx, snappedDy);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      interaction = null;
      onInteractionChange?.(false);
      guides = [];
      onDragEnd?.(lastSnappedDx, lastSnappedDy, moved);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // --- Resize handle ---
  function handleResizeMouseDown(e: MouseEvent, id: string, dir: HandleDir) {
    e.preventDefault();
    e.stopPropagation();

    const comp = placements.find((p) => p.id === id);
    if (!comp) return;

    selectedIds = new Set([id]);
    interaction = "resize";
    onInteractionChange?.(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = comp.width;
    const startH = comp.height;
    const startLeft = comp.x;
    const startTop = comp.y;

    // Determine which edges are active for this resize direction
    const activeEdges = {
      left: dir.includes("w"),
      right: dir.includes("e"),
      top: dir.includes("n"),
      bottom: dir.includes("s"),
    };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let nw = startW,
        nh = startH,
        nx = startLeft,
        ny = startTop;

      if (dir.includes("e")) nw = Math.max(MIN_SIZE, startW + dx);
      if (dir.includes("w")) {
        nw = Math.max(MIN_SIZE, startW - dx);
        nx = startLeft + startW - nw;
      }
      if (dir.includes("s")) nh = Math.max(MIN_SIZE, startH + dy);
      if (dir.includes("n")) {
        nh = Math.max(MIN_SIZE, startH - dy);
        ny = startTop + startH - nh;
      }

      // Smart-snap active edges to nearby elements
      const rect = { x: nx, y: ny, width: nw, height: nh };
      const { dx: snapDx, dy: snapDy, guides: newGuides } = computeSnap(rect, placementsRef(), new Set([id]), activeEdges, extraSnapRects);
      guides = newGuides;

      // Apply snap by adjusting the active edge
      if (snapDx !== 0) {
        if (activeEdges.right) nw += snapDx;
        else if (activeEdges.left) { nx += snapDx; nw -= snapDx; }
      }
      if (snapDy !== 0) {
        if (activeEdges.bottom) nh += snapDy;
        else if (activeEdges.top) { ny += snapDy; nh -= snapDy; }
      }

      onChange(
        placementsRef().map((p) =>
          p.id === id ? { ...p, x: nx, y: ny, width: nw, height: nh } : p,
        ),
      );

      sizeIndicator = {
        x: ev.clientX + 12,
        y: ev.clientY + 12,
        text: `${Math.round(nw)} × ${Math.round(nh)}`,
      };
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      sizeIndicator = null;
      interaction = null;
      onInteractionChange?.(false);
      guides = [];
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // --- Delete a single placement (animate out, then remove) ---
  function handleDelete(id: string) {
    interaction = null;
    const nextExiting = new Set(exitingIds);
    nextExiting.add(id);
    exitingIds = nextExiting;
    const nextSelected = new Set(selectedIds);
    nextSelected.delete(id);
    selectedIds = nextSelected;
    originalSetTimeout(() => {
      onChange(placementsRef().filter((p) => p.id !== id));
      const after = new Set(exitingIds);
      after.delete(id);
      exitingIds = after;
    }, 180);
  }

  // --- Double-click: edit text ---
  const TEXT_PLACEHOLDERS: Partial<Record<ComponentType, string>> = {
    hero: "Headline text",
    button: "Button label",
    badge: "Badge label",
    cta: "Call to action text",
    toast: "Notification message",
    modal: "Dialog title",
    card: "Card title",
    navigation: "Brand / nav items",
    tabs: "Tab labels",
    input: "Placeholder text",
    search: "Search placeholder",
    pricing: "Plan name or price",
    testimonial: "Quote text",
    alert: "Alert message",
    banner: "Banner text",
    tag: "Tag label",
    notification: "Notification message",
    stat: "Metric value",
    productCard: "Product name",
  };

  function handleDoubleClick(id: string) {
    const p = placements.find((pl) => pl.id === id);
    if (!p) return;
    editHadText = !!p.text;
    editingId = id;
    editExiting = false;
  }

  function dismissEdit() {
    if (!editingId) return;
    editExiting = true;
    originalSetTimeout(() => { editingId = null; editExiting = false; }, 150);
  }

  // Dismiss popup when overlay starts exiting
  $effect(() => {
    if (exiting && editingId) dismissEdit();
  });

  function submitEdit(text: string) {
    if (!editingId) return;
    onChange(placements.map((p) => (p.id === editingId ? { ...p, text: text.trim() || undefined } : p)));
    dismissEdit();
  }

  const cornerHandles: HandleDir[] = ["nw", "ne", "se", "sw"];

  let scrollY = $derived(typeof window !== "undefined" ? window.scrollY : 0);
  let arrowColor = $derived(wireframe ? "#f97316" : "#3c82f7");

  const edgeHandles: { dir: HandleDir; cls: string }[] = [
    { dir: "n", cls: styles.edgeN },
    { dir: "e", cls: styles.edgeE },
    { dir: "s", cls: styles.edgeS },
    { dir: "w", cls: styles.edgeW },
  ];

  function handleClass(dir: HandleDir): string {
    const key = `handle${dir.charAt(0).toUpperCase()}${dir.slice(1)}` as keyof typeof styles;
    return styles[key] as string;
  }

  function annotationText(p: DesignPlacement): string {
    if (p.text) lastAnnotationText.set(p.id, p.text);
    return p.text || lastAnnotationText.get(p.id) || "";
  }

  // --- Edit popup positioning ---
  let editPopup = $derived.by(() => {
    if (!editingId) return null;
    const ep = placements.find((p) => p.id === editingId);
    if (!ep) return null;
    const ey = ep.y - scrollY;
    const centerX = ep.x + ep.width / 2;
    const aboveY = ey - 8;
    const belowY = ey + ep.height + 8;
    const fitsAbove = aboveY > 200;
    const fitsBelow = belowY < window.innerHeight - 100;
    const popupLeft = Math.max(160, Math.min(window.innerWidth - 160, centerX));
    let style: string;
    if (fitsAbove) {
      style = `left: ${popupLeft}px; bottom: ${window.innerHeight - aboveY}px;`;
    } else if (fitsBelow) {
      style = `left: ${popupLeft}px; top: ${belowY}px;`;
    } else {
      // Tall component: place popup at vertical center of viewport
      style = `left: ${popupLeft}px; top: ${Math.max(80, window.innerHeight / 2 - 80)}px;`;
    }
    return { ep, style };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={`${styles.overlay} ${!isDarkMode ? styles.light : ""} ${activeComponent ? styles.placing : ""} ${passthrough ? styles.passthrough : ""} ${exiting ? styles.overlayExiting : ""} ${wireframe ? styles.wireframe : ""}${extraClassName ? ` ${extraClassName}` : ""}`}
  data-feedback-toolbar
  onmousedown={handleOverlayMouseDown}
>
  <!-- Placed components -->
  {#each placements as p (p.id)}
    {@const isSelected = selectedIds.has(p.id)}
    {@const label = COMPONENT_MAP[p.type]?.label || p.type}
    {@const screenY = p.y - scrollY}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      data-design-placement={p.id}
      class={`${styles.placement} ${isSelected ? styles.selected : ""} ${exitingIds.has(p.id) ? styles.exiting : ""}`}
      style="left: {p.x}px; top: {screenY}px; width: {p.width}px; height: {p.height}px; position: fixed;"
      onmousedown={(e) => handlePlacementMouseDown(e, p.id)}
      ondblclick={() => handleDoubleClick(p.id)}
    >
      <span class={styles.placementLabel}>{label}</span>
      <span class={`${styles.placementAnnotation} ${p.text ? styles.annotationVisible : ""}`}>{annotationText(p)}</span>
      <div class={styles.placementContent}>
        <Skeleton type={p.type} width={p.width} height={p.height} text={p.text} />
      </div>

      <!-- Delete button -->
      <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
      <div
        class={styles.deleteButton}
        onmousedown={(e) => e.stopPropagation()}
        onclick={() => handleDelete(p.id)}
      >
        ✕
      </div>

      <!-- Corner resize handles -->
      {#each cornerHandles as dir (dir)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={`${styles.handle} ${handleClass(dir)}`}
          onmousedown={(e) => handleResizeMouseDown(e, p.id, dir)}
        ></div>
      {/each}
      <!-- Edge resize bars -->
      {#each edgeHandles as { dir, cls } (dir)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={`${styles.edgeHandle} ${cls}`}
          onmousedown={(e) => handleResizeMouseDown(e, p.id, dir)}
        >
          {#if dir === "n"}
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 0.5L1 4.5h6z" fill={arrowColor} /></svg>
          {:else if dir === "e"}
            <svg width="6" height="8" viewBox="0 0 6 8" fill="none"><path d="M5.5 4L1.5 1v6z" fill={arrowColor} /></svg>
          {:else if dir === "s"}
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 5.5L1 1.5h6z" fill={arrowColor} /></svg>
          {:else if dir === "w"}
            <svg width="6" height="8" viewBox="0 0 6 8" fill="none"><path d="M0.5 4L4.5 1v6z" fill={arrowColor} /></svg>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<!-- Text editing popup (uses annotation popup) -->
{#if editPopup}
  <AnnotationPopupCSS
    element={COMPONENT_MAP[editPopup.ep.type]?.label || editPopup.ep.type}
    placeholder={TEXT_PLACEHOLDERS[editPopup.ep.type] || "Label or content text"}
    initialValue={editPopup.ep.text ?? ""}
    submitLabel={editHadText ? "Save" : "Set"}
    onSubmit={submitEdit}
    onCancel={dismissEdit}
    onDelete={editHadText ? () => { submitEdit(""); } : undefined}
    isExiting={editExiting}
    lightMode={!isDarkMode}
    style={editPopup.style}
  />
{/if}

<!-- Draw box (drag-to-place preview) -->
{#if drawBox}
  <div
    class={styles.drawBox}
    style="left: {drawBox.x}px; top: {drawBox.y}px; width: {drawBox.w}px; height: {drawBox.h}px;"
    data-feedback-toolbar
  ></div>
{/if}

<!-- Select box -->
{#if selectBox}
  <div
    class={styles.selectBox}
    style="left: {selectBox.x}px; top: {selectBox.y}px; width: {selectBox.w}px; height: {selectBox.h}px;"
    data-feedback-toolbar
  ></div>
{/if}

<!-- Size indicator -->
{#if sizeIndicator}
  <div
    class={styles.sizeIndicator}
    style="left: {sizeIndicator.x}px; top: {sizeIndicator.y}px;"
    data-feedback-toolbar
  >
    {sizeIndicator.text}
  </div>
{/if}

<!-- Smart guides -->
{#each guides as g, i (`${g.axis}-${g.pos}-${i}`)}
  <div
    class={styles.guideLine}
    style={g.axis === "x"
      ? `position: fixed; left: ${g.pos}px; top: 0; width: 1px; bottom: 0;`
      : `position: fixed; left: 0; top: ${g.pos - scrollY}px; right: 0; height: 1px;`}
    data-feedback-toolbar
  ></div>
{/each}
