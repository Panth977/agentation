<script module lang="ts">
  // ===========================================================================
  // Module-level helpers (run once) — mirrors the top-of-file helpers and the
  // accent-token injection in the React source.
  // ===========================================================================
  import { DEV } from "esm-env";
  import { identifyElement } from "$lib/utils/element-identification.js";
  import {
    getReactComponentName,
    getSourceLocation,
    findNearestComponentSource,
    formatSourceLocation,
  } from "$lib/utils/component-detection.js";
  import { COLOR_OPTIONS } from "./types.js";
  import type { ReactComponentMode } from "./types.js";
  import type { Annotation } from "$lib/types.js";

  /** Combines framework-agnostic element ID with component detection. */
  function identifyElementWithReact(
    element: HTMLElement,
    reactMode: ReactComponentMode = "filtered",
  ): {
    name: string;
    elementName: string;
    path: string;
    reactComponents: string | null;
  } {
    const { name: elementName, path } = identifyElement(element);
    if (reactMode === "off") {
      return { name: elementName, elementName, path, reactComponents: null };
    }
    const reactInfo = getReactComponentName(element, { mode: reactMode });
    return {
      name: reactInfo.path ? `${reactInfo.path} ${elementName}` : elementName,
      elementName,
      path,
      reactComponents: reactInfo.path,
    };
  }

  /** Recursively pierces open shadow roots to find the deepest element at a point. */
  function deepElementFromPoint(x: number, y: number): HTMLElement | null {
    let element = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!element) return null;
    while (element?.shadowRoot) {
      const deeper = element.shadowRoot.elementFromPoint(x, y) as HTMLElement | null;
      if (!deeper || deeper === element) break;
      element = deeper;
    }
    return element;
  }

  function isElementFixed(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const position = style.position;
      if (position === "fixed" || position === "sticky") return true;
      current = current.parentElement;
    }
    return false;
  }

  function isRenderableAnnotation(annotation: Annotation): boolean {
    return annotation.status !== "resolved" && annotation.status !== "dismissed";
  }

  /** Adapted to the Svelte component-detection signatures (see component-detection.ts). */
  function detectSourceFile(element: Element): string | undefined {
    const result = getSourceLocation(element as HTMLElement);
    const loc = result ?? findNearestComponentSource(element as HTMLElement);
    return loc ? formatSourceLocation(loc) : undefined;
  }

  // Prevent re-animating the entrance on SPA navigation.
  let hasPlayedEntranceAnimation = false;

  const injectAgentationColorTokens = () => {
    if (typeof document === "undefined") return;
    if (document.getElementById("agentation-color-tokens")) return;
    const style = document.createElement("style");
    style.id = "agentation-color-tokens";
    style.textContent = [
      ...COLOR_OPTIONS.map(
        (c) => `
      [data-agentation-accent="${c.id}"] {
        --agentation-color-accent: ${c.srgb};
      }

      @supports (color: color(display-p3 0 0 0)) {
        [data-agentation-accent="${c.id}"] {
          --agentation-color-accent: ${c.p3};
        }
      }
    `,
      ),
      `:root {
      ${COLOR_OPTIONS.map((c) => `--agentation-color-${c.id}: ${c.srgb};`).join("\n")}
    }`,
      `@supports (color: color(display-p3 0 0 0)) {
      :root {
        ${COLOR_OPTIONS.map((c) => `--agentation-color-${c.id}: ${c.p3};`).join("\n")}
      }
    }`,
    ].join("");
    document.head.appendChild(style);
  };

  injectAgentationColorTokens();

  type HoverInfo = {
    element: string;
    elementName: string;
    elementPath: string;
    rect: DOMRect | null;
    reactComponents?: string | null;
  };

  type PendingAnnotation = {
    x: number;
    y: number;
    clientY: number;
    element: string;
    elementPath: string;
    selectedText?: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    nearbyText?: string;
    cssClasses?: string;
    isMultiSelect?: boolean;
    isFixed?: boolean;
    fullPath?: string;
    accessibility?: string;
    computedStyles?: string;
    computedStylesObj?: Record<string, string>;
    nearbyElements?: string;
    reactComponents?: string;
    sourceFile?: string;
    elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
    multiSelectElements?: HTMLElement[];
    targetElement?: HTMLElement;
  };

  type DrawStroke = {
    id: string;
    points: Array<{ x: number; y: number }>;
    color: string;
    fixed: boolean;
  };

  type MultiSelectItem = {
    element: HTMLElement;
    rect: DOMRect;
    name: string;
    path: string;
    reactComponents?: string;
  };
</script>

<script lang="ts">
  import { untrack } from "svelte";
  import styles from "./styles.module.scss";
  import designStyles from "../design-mode/styles.module.scss";

  import AnnotationPopupCSS from "../annotation-popup-css/AnnotationPopupCSS.svelte";
  import type { AnnotationPopupCSSHandle } from "../annotation-popup-css/types.js";
  import { AnnotationMarker, PendingMarker, ExitingMarker } from "./annotation-marker/index.js";
  import { SettingsPanel } from "./settings-panel/index.js";
  import HelpTooltip from "../help-tooltip/HelpTooltip.svelte";
  import DesignMode from "../design-mode/DesignMode.svelte";
  import DesignPalette from "../design-mode/DesignPalette.svelte";
  import RearrangeOverlay from "../design-mode/RearrangeOverlay.svelte";

  import IconListSparkle from "../icons/IconListSparkle.svelte";
  import IconGear from "../icons/IconGear.svelte";
  import IconCopyAnimated from "../icons/IconCopyAnimated.svelte";
  import IconSendArrow from "../icons/IconSendArrow.svelte";
  import IconTrashAlt from "../icons/IconTrashAlt.svelte";
  import IconEyeAnimated from "../icons/IconEyeAnimated.svelte";
  import IconPausePlayAnimated from "../icons/IconPausePlayAnimated.svelte";
  import IconXmarkLarge from "../icons/IconXmarkLarge.svelte";
  import IconLayout from "../icons/IconLayout.svelte";

  import {
    getNearbyText,
    getElementClasses,
    getDetailedComputedStyles,
    getForensicComputedStyles,
    parseComputedStylesString,
    getFullElementPath,
    getAccessibilityInfo,
    getNearbyElements,
    closestCrossingShadow,
  } from "$lib/utils/element-identification.js";
  import {
    loadAnnotations,
    loadAllAnnotations,
    saveAnnotations,
    getStorageKey,
    loadSessionId,
    saveSessionId,
    clearSessionId,
    saveAnnotationsWithSyncMarker,
    loadDesignPlacements,
    saveDesignPlacements,
    clearDesignPlacements,
    loadRearrangeState,
    saveRearrangeState,
    clearRearrangeState,
    loadWireframeState,
    saveWireframeState,
    clearWireframeState,
    loadToolbarHidden,
    saveToolbarHidden,
  } from "$lib/utils/storage.js";
  import {
    createSession,
    getSession,
    syncAnnotation,
    updateAnnotation as updateAnnotationOnServer,
    deleteAnnotation as deleteAnnotationFromServer,
  } from "$lib/utils/sync.js";
  import { generateOutput } from "$lib/utils/generate-output.js";
  import {
    freeze as freezeAll,
    unfreeze as unfreezeAll,
    originalSetTimeout,
    originalSetInterval,
    originalRequestAnimationFrame,
  } from "$lib/utils/freeze-animations.js";

  import { generateDesignOutput, generateRearrangeOutput } from "../design-mode/output.js";
  import { detectPageSections } from "../design-mode/section-detection.js";
  import {
    DEFAULT_SIZES,
    type DesignPlacement,
    type ComponentType as DesignComponentType,
    type RearrangeState,
    type CanvasPurpose,
  } from "../design-mode/types.js";

  import {
    DEFAULT_SETTINGS,
    OUTPUT_TO_REACT_MODE,
    isValidUrl,
    type ToolbarSettings,
  } from "./types.js";
  import type { PageFeedbackToolbarCSSProps } from "./types.js";

  let {
    demoAnnotations,
    demoDelay = 1000,
    enableDemoMode = false,
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationUpdate,
    onAnnotationsClear,
    onCopy,
    onSubmit,
    copyToClipboard = true,
    endpoint,
    sessionId: initialSessionId,
    onSessionCreated,
    webhookUrl,
    className: userClassName,
  }: PageFeedbackToolbarCSSProps = $props();

  // ===========================================================================
  // State
  // ===========================================================================
  let isActive = $state(false);
  let annotations = $state<Annotation[]>([]);
  let showMarkers = $state(true);
  let isToolbarHidden = $state(loadToolbarHidden());
  let isToolbarHiding = $state(false);

  let portalWrapper = $state<HTMLDivElement | undefined>(undefined);

  let markersVisible = $state(false);
  let markersExiting = $state(false);
  let hoverInfo = $state<HoverInfo | null>(null);
  let hoverPosition = $state({ x: 0, y: 0 });
  let pendingAnnotation = $state<PendingAnnotation | null>(null);
  let copied = $state(false);
  let sendState = $state<"idle" | "sending" | "sent" | "failed">("idle");
  let cleared = $state(false);
  let isClearing = $state(false);
  let hoveredMarkerId = $state<string | null>(null);
  let hoveredTargetElement = $state<HTMLElement | null>(null);
  let hoveredTargetElements = $state<HTMLElement[]>([]);
  let deletingMarkerId = $state<string | null>(null);
  let renumberFrom = $state<number | null>(null);
  let editingAnnotation = $state<Annotation | null>(null);
  let editingTargetElement = $state<HTMLElement | null>(null);
  let editingTargetElements = $state<HTMLElement[]>([]);
  let scrollY = $state(0);
  let isScrolling = $state(false);
  let mounted = $state(false);
  let isFrozen = $state(false);
  let showSettings = $state(false);
  let showSettingsVisible = $state(false);
  let settingsPage = $state<"main" | "automations">("main");
  let tooltipsHidden = $state(false);

  // Layout mode
  let isDesignMode = $state(false);
  let designOverlayExiting = $state(false);
  let designPlacements = $state<DesignPlacement[]>([]);
  let activeDesignComponent = $state<DesignComponentType | null>(null);
  let designPlacementsLoaded = false;
  let blankCanvas = $state(false);
  let canvasReady = $state(false);
  let canvasOpacity = $state(1);
  let canvasPurpose = $state<CanvasPurpose>("new-page");
  let wireframePurpose = $state("");
  let designInteracting = $state(false);
  let rearrangeState = $state<RearrangeState | null>(null);
  let rearrangeLoaded = false;
  let exploreStash: { rearrange: RearrangeState | null; placements: DesignPlacement[] } = {
    rearrange: null,
    placements: [],
  };
  let wireframeStash: { rearrange: RearrangeState | null; placements: DesignPlacement[] } = {
    rearrange: null,
    placements: [],
  };
  let designDeselectSignal = $state(0);
  let rearrangeDeselectSignal = $state(0);
  let designClearSignal = $state(0);
  let rearrangeClearSignal = $state(0);
  let designSelectedIds = new Set<string>();
  let rearrangeSelectedIds = new Set<string>();
  let crossDragStart: Map<string, { x: number; y: number }> | null = null;
  let designExitTimer: number | undefined;

  // Shadow annotation tracking
  let placementAnnotationMap = new Map<string, string>();
  let rearrangeAnnotationMap = new Map<string, string>();
  let rearrangeDebounceTimer: number | undefined;

  // Draw mode
  let isDrawMode = $state(false);
  let drawStrokes = $state<DrawStroke[]>([]);
  let hoveredDrawingIdx = $state<number | null>(null);
  let drawCanvas = $state<HTMLCanvasElement | undefined>(undefined);

  let tooltipSessionActive = $state(false);
  let tooltipSessionTimer: number | null = null;

  let pendingMultiSelectElements = $state<MultiSelectItem[]>([]);
  let modifiersHeld = { cmd: false, shift: false };

  let settings = $state<ToolbarSettings>(
    (() => {
      try {
        const saved = JSON.parse(localStorage.getItem("feedback-toolbar-settings") ?? "");
        return {
          ...DEFAULT_SETTINGS,
          ...saved,
          annotationColorId: COLOR_OPTIONS.find((c) => c.id === saved.annotationColorId)
            ? saved.annotationColorId
            : DEFAULT_SETTINGS.annotationColorId,
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    })(),
  );

  let isDarkMode = $state(true);
  let showEntranceAnimation = $state(false);

  // Server sync
  let currentSessionId = $state<string | null>(initialSessionId ?? null);
  let sessionInitialized = false;
  let connectionStatus = $state<"disconnected" | "connecting" | "connected">(
    endpoint ? "connecting" : "disconnected",
  );

  // Draggable toolbar
  let toolbarPosition = $state<{ x: number; y: number } | null>(null);
  let isDraggingToolbar = $state(false);
  let dragStartPos = $state<{ x: number; y: number; toolbarX: number; toolbarY: number } | null>(
    null,
  );
  let justFinishedToolbarDrag = false;

  // Marker animation
  let animatedMarkers = $state<Set<string>>(new Set());
  let exitingMarkers = $state<Set<string>>(new Set());
  let pendingExiting = $state(false);
  let editExiting = $state(false);

  // Multi-select drag
  let isDragging = $state(false);
  let mouseDownPos: { x: number; y: number } | null = null;
  let dragStartRef: { x: number; y: number } | null = null;
  let dragRectEl = $state<HTMLDivElement | undefined>(undefined);
  let highlightsContainer = $state<HTMLDivElement | undefined>(undefined);
  let justFinishedDrag = false;
  let lastElementUpdate = 0;
  let recentlyAddedId: string | null = null;
  let prevConnectionStatus: typeof connectionStatus | null = null;
  const DRAG_THRESHOLD = 8;
  const ELEMENT_UPDATE_THROTTLE = 50;

  let popupRef = $state<AnnotationPopupCSSHandle | undefined>(undefined);
  let editPopupRef = $state<AnnotationPopupCSSHandle | undefined>(undefined);
  let scrollTimeout: number | null = null;

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  const isDevMode = DEV;

  // ===========================================================================
  // Derived
  // ===========================================================================
  const effectiveReactMode = $derived<ReactComponentMode>(
    isDevMode && settings.reactEnabled ? OUTPUT_TO_REACT_MODE[settings.outputDetail] : "off",
  );
  const canvasShouldBeVisible = $derived(
    isDesignMode && isActive && !designOverlayExiting && blankCanvas,
  );
  const shouldShowMarkers = $derived(isActive && showMarkers && !isDesignMode);
  const hasAnnotations = $derived(annotations.length > 0);
  const visibleAnnotations = $derived(
    annotations.filter(
      (a) => !exitingMarkers.has(a.id) && a.kind !== "placement" && a.kind !== "rearrange",
    ),
  );
  const hasVisibleAnnotations = $derived(visibleAnnotations.length > 0);
  const exitingAnnotationsList = $derived(annotations.filter((a) => exitingMarkers.has(a.id)));

  // ===========================================================================
  // Functions
  // ===========================================================================
  function hideTooltipsUntilMouseLeave() {
    tooltipsHidden = true;
  }
  function showTooltipsAgain() {
    tooltipsHidden = false;
  }
  function handleControlsMouseEnter() {
    if (!tooltipSessionActive) {
      tooltipSessionTimer = originalSetTimeout(() => (tooltipSessionActive = true), 850);
    }
  }
  function handleControlsMouseLeave() {
    if (tooltipSessionTimer) {
      clearTimeout(tooltipSessionTimer);
      tooltipSessionTimer = null;
    }
    tooltipSessionActive = false;
    showTooltipsAgain();
  }

  function toggleTheme() {
    portalWrapper?.classList.add(styles.disableTransitions);
    isDarkMode = !isDarkMode;
    originalRequestAnimationFrame(() => {
      portalWrapper?.classList.remove(styles.disableTransitions);
    });
  }

  function hideToolbarTemporarily() {
    if (isToolbarHiding) return;
    isToolbarHiding = true;
    showSettings = false;
    isActive = false;
    originalSetTimeout(() => {
      saveToolbarHidden(true);
      isToolbarHidden = true;
      isToolbarHiding = false;
    }, 400);
  }

  function closeDesignMode() {
    designOverlayExiting = true;
    isDesignMode = false;
    activeDesignComponent = null;
    clearTimeout(designExitTimer);
    designExitTimer = originalSetTimeout(() => {
      designOverlayExiting = false;
    }, 300);
  }

  function deactivate() {
    if (isDesignMode) {
      designOverlayExiting = true;
      isDesignMode = false;
      activeDesignComponent = null;
      clearTimeout(designExitTimer);
      designExitTimer = originalSetTimeout(() => {
        designOverlayExiting = false;
      }, 300);
    }
    isActive = false;
  }

  function freezeAnimations() {
    if (isFrozen) return;
    freezeAll();
    isFrozen = true;
  }
  function unfreezeAnimations() {
    if (!isFrozen) return;
    unfreezeAll();
    isFrozen = false;
  }
  function toggleFreeze() {
    if (isFrozen) unfreezeAnimations();
    else freezeAnimations();
  }

  function createMultiSelectPendingAnnotation() {
    if (pendingMultiSelectElements.length === 0) return;

    const firstItem = pendingMultiSelectElements[0];
    const firstEl = firstItem.element;
    const isMulti = pendingMultiSelectElements.length > 1;
    const freshRects = pendingMultiSelectElements.map((item) =>
      item.element.getBoundingClientRect(),
    );

    if (!isMulti) {
      const rect = freshRects[0];
      const isFixed = isElementFixed(firstEl);
      pendingAnnotation = {
        x: (rect.left / window.innerWidth) * 100,
        y: isFixed ? rect.top : rect.top + window.scrollY,
        clientY: rect.top,
        element: firstItem.name,
        elementPath: firstItem.path,
        boundingBox: {
          x: rect.left,
          y: isFixed ? rect.top : rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        isFixed,
        fullPath: getFullElementPath(firstEl),
        accessibility: getAccessibilityInfo(firstEl),
        computedStyles: getForensicComputedStyles(firstEl),
        computedStylesObj: getDetailedComputedStyles(firstEl),
        nearbyElements: getNearbyElements(firstEl),
        cssClasses: getElementClasses(firstEl),
        nearbyText: getNearbyText(firstEl),
        reactComponents: firstItem.reactComponents,
        sourceFile: detectSourceFile(firstEl),
      };
    } else {
      const bounds = {
        left: Math.min(...freshRects.map((r) => r.left)),
        top: Math.min(...freshRects.map((r) => r.top)),
        right: Math.max(...freshRects.map((r) => r.right)),
        bottom: Math.max(...freshRects.map((r) => r.bottom)),
      };
      const names = pendingMultiSelectElements
        .slice(0, 5)
        .map((item) => item.name)
        .join(", ");
      const suffix =
        pendingMultiSelectElements.length > 5
          ? ` +${pendingMultiSelectElements.length - 5} more`
          : "";
      const elementBoundingBoxes = freshRects.map((rect) => ({
        x: rect.left,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      }));
      const lastItem = pendingMultiSelectElements[pendingMultiSelectElements.length - 1];
      const lastEl = lastItem.element;
      const lastRect = freshRects[freshRects.length - 1];
      const lastCenterX = lastRect.left + lastRect.width / 2;
      const lastCenterY = lastRect.top + lastRect.height / 2;
      const lastIsFixed = isElementFixed(lastEl);
      pendingAnnotation = {
        x: (lastCenterX / window.innerWidth) * 100,
        y: lastIsFixed ? lastCenterY : lastCenterY + window.scrollY,
        clientY: lastCenterY,
        element: `${pendingMultiSelectElements.length} elements: ${names}${suffix}`,
        elementPath: "multi-select",
        boundingBox: {
          x: bounds.left,
          y: bounds.top + window.scrollY,
          width: bounds.right - bounds.left,
          height: bounds.bottom - bounds.top,
        },
        isMultiSelect: true,
        isFixed: lastIsFixed,
        elementBoundingBoxes,
        multiSelectElements: pendingMultiSelectElements.map((item) => item.element),
        targetElement: lastEl,
        fullPath: getFullElementPath(firstEl),
        accessibility: getAccessibilityInfo(firstEl),
        computedStyles: getForensicComputedStyles(firstEl),
        computedStylesObj: getDetailedComputedStyles(firstEl),
        nearbyElements: getNearbyElements(firstEl),
        cssClasses: getElementClasses(firstEl),
        nearbyText: getNearbyText(firstEl),
        sourceFile: detectSourceFile(firstEl),
      };
    }

    pendingMultiSelectElements = [];
    hoverInfo = null;
  }

  function startEditAnnotation(annotation: Annotation) {
    editingAnnotation = annotation;
    hoveredMarkerId = null;
    hoveredTargetElement = null;
    hoveredTargetElements = [];

    if (annotation.elementBoundingBoxes?.length) {
      const elements: HTMLElement[] = [];
      for (const bb of annotation.elementBoundingBoxes) {
        const centerX = bb.x + bb.width / 2;
        const centerY = bb.y + bb.height / 2 - window.scrollY;
        const el = deepElementFromPoint(centerX, centerY);
        if (el) elements.push(el);
      }
      editingTargetElements = elements;
      editingTargetElement = null;
    } else if (annotation.boundingBox) {
      const bb = annotation.boundingBox;
      const centerX = bb.x + bb.width / 2;
      const centerY = annotation.isFixed
        ? bb.y + bb.height / 2
        : bb.y + bb.height / 2 - window.scrollY;
      const el = deepElementFromPoint(centerX, centerY);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const widthRatio = elRect.width / bb.width;
        const heightRatio = elRect.height / bb.height;
        editingTargetElement = widthRatio < 0.5 || heightRatio < 0.5 ? null : el;
      } else {
        editingTargetElement = null;
      }
      editingTargetElements = [];
    } else {
      editingTargetElement = null;
      editingTargetElements = [];
    }
  }

  async function fireWebhook(
    event: string,
    payload: Record<string, unknown>,
    force?: boolean,
  ): Promise<boolean> {
    const targetUrl = settings.webhookUrl || webhookUrl;
    if (!targetUrl || (!settings.webhooksEnabled && !force)) return false;
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          timestamp: Date.now(),
          url: typeof window !== "undefined" ? window.location.href : undefined,
          ...payload,
        }),
      });
      return response.ok;
    } catch (error) {
      console.warn("[Agentation] Webhook failed:", error);
      return false;
    }
  }

  function addAnnotation(comment: string) {
    if (!pendingAnnotation) return;
    const p = pendingAnnotation;
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      x: p.x,
      y: p.y,
      comment,
      element: p.element,
      elementPath: p.elementPath,
      timestamp: Date.now(),
      selectedText: p.selectedText,
      boundingBox: p.boundingBox,
      nearbyText: p.nearbyText,
      cssClasses: p.cssClasses,
      isMultiSelect: p.isMultiSelect,
      isFixed: p.isFixed,
      fullPath: p.fullPath,
      accessibility: p.accessibility,
      computedStyles: p.computedStyles,
      nearbyElements: p.nearbyElements,
      reactComponents: p.reactComponents,
      sourceFile: p.sourceFile,
      elementBoundingBoxes: p.elementBoundingBoxes,
      ...(endpoint && currentSessionId
        ? {
            sessionId: currentSessionId,
            url: typeof window !== "undefined" ? window.location.href : undefined,
            status: "pending" as const,
          }
        : {}),
    };

    annotations = [...annotations, newAnnotation];
    recentlyAddedId = newAnnotation.id;
    originalSetTimeout(() => {
      recentlyAddedId = null;
    }, 300);
    originalSetTimeout(() => {
      animatedMarkers = new Set(animatedMarkers).add(newAnnotation.id);
    }, 250);

    onAnnotationAdd?.(newAnnotation);
    fireWebhook("annotation.add", { annotation: newAnnotation });

    pendingExiting = true;
    originalSetTimeout(() => {
      pendingAnnotation = null;
      pendingExiting = false;
    }, 150);

    window.getSelection()?.removeAllRanges();

    if (endpoint && currentSessionId) {
      syncAnnotation(endpoint, currentSessionId, newAnnotation)
        .then((serverAnnotation) => {
          if (serverAnnotation.id !== newAnnotation.id) {
            annotations = annotations.map((a) =>
              a.id === newAnnotation.id ? { ...a, id: serverAnnotation.id } : a,
            );
            const next = new Set(animatedMarkers);
            next.delete(newAnnotation.id);
            next.add(serverAnnotation.id);
            animatedMarkers = next;
          }
        })
        .catch((error) => {
          console.warn("[Agentation] Failed to sync annotation:", error);
        });
    }
  }

  function cancelAnnotation() {
    pendingExiting = true;
    originalSetTimeout(() => {
      pendingAnnotation = null;
      pendingExiting = false;
    }, 150);
  }

  function deleteAnnotation(id: string) {
    const deletedIndex = annotations.findIndex((a) => a.id === id);
    const deletedAnnotation = annotations[deletedIndex];

    if (editingAnnotation?.id === id) {
      editExiting = true;
      originalSetTimeout(() => {
        editingAnnotation = null;
        editingTargetElement = null;
        editingTargetElements = [];
        editExiting = false;
      }, 150);
    }

    deletingMarkerId = id;
    exitingMarkers = new Set(exitingMarkers).add(id);

    if (deletedAnnotation) {
      onAnnotationDelete?.(deletedAnnotation);
      fireWebhook("annotation.delete", { annotation: deletedAnnotation });
    }

    if (endpoint) {
      deleteAnnotationFromServer(endpoint, id).catch((error) => {
        console.warn("[Agentation] Failed to delete annotation from server:", error);
      });
    }

    originalSetTimeout(() => {
      annotations = annotations.filter((a) => a.id !== id);
      const next = new Set(exitingMarkers);
      next.delete(id);
      exitingMarkers = next;
      deletingMarkerId = null;
      if (deletedIndex < annotations.length) {
        renumberFrom = deletedIndex;
        originalSetTimeout(() => (renumberFrom = null), 200);
      }
    }, 150);
  }

  function handleMarkerHover(annotation: Annotation | null) {
    if (!annotation) {
      hoveredMarkerId = null;
      hoveredTargetElement = null;
      hoveredTargetElements = [];
      return;
    }
    hoveredMarkerId = annotation.id;

    if (annotation.elementBoundingBoxes?.length) {
      const elements: HTMLElement[] = [];
      for (const bb of annotation.elementBoundingBoxes) {
        const centerX = bb.x + bb.width / 2;
        const centerY = bb.y + bb.height / 2 - window.scrollY;
        const allEls = document.elementsFromPoint(centerX, centerY);
        const el = allEls.find(
          (e) => !e.closest("[data-annotation-marker]") && !e.closest("[data-agentation-root]"),
        ) as HTMLElement | undefined;
        if (el) elements.push(el);
      }
      hoveredTargetElements = elements;
      hoveredTargetElement = null;
    } else if (annotation.boundingBox) {
      const bb = annotation.boundingBox;
      const centerX = bb.x + bb.width / 2;
      const centerY = annotation.isFixed
        ? bb.y + bb.height / 2
        : bb.y + bb.height / 2 - window.scrollY;
      const el = deepElementFromPoint(centerX, centerY);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const widthRatio = elRect.width / bb.width;
        const heightRatio = elRect.height / bb.height;
        hoveredTargetElement = widthRatio < 0.5 || heightRatio < 0.5 ? null : el;
      } else {
        hoveredTargetElement = null;
      }
      hoveredTargetElements = [];
    } else {
      hoveredTargetElement = null;
      hoveredTargetElements = [];
    }
  }

  function updateAnnotation(newComment: string) {
    if (!editingAnnotation) return;
    const updatedAnnotation = { ...editingAnnotation, comment: newComment };
    annotations = annotations.map((a) => (a.id === editingAnnotation!.id ? updatedAnnotation : a));
    onAnnotationUpdate?.(updatedAnnotation);
    fireWebhook("annotation.update", { annotation: updatedAnnotation });
    if (endpoint) {
      updateAnnotationOnServer(endpoint, editingAnnotation.id, { comment: newComment }).catch(
        (error) => {
          console.warn("[Agentation] Failed to update annotation on server:", error);
        },
      );
    }
    editExiting = true;
    originalSetTimeout(() => {
      editingAnnotation = null;
      editingTargetElement = null;
      editingTargetElements = [];
      editExiting = false;
    }, 150);
  }

  function cancelEditAnnotation() {
    editExiting = true;
    originalSetTimeout(() => {
      editingAnnotation = null;
      editingTargetElement = null;
      editingTargetElements = [];
      editExiting = false;
    }, 150);
  }

  function clearAll() {
    const count = annotations.length;
    const hasDesign = designPlacements.length > 0 || !!rearrangeState;
    if (count === 0 && drawStrokes.length === 0 && !hasDesign) return;

    onAnnotationsClear?.(annotations);
    fireWebhook("annotations.clear", { annotations });

    if (endpoint) {
      Promise.all(
        annotations.map((a) =>
          deleteAnnotationFromServer(endpoint, a.id).catch((error) => {
            console.warn("[Agentation] Failed to delete annotation from server:", error);
          }),
        ),
      );
      for (const [, annotationId] of placementAnnotationMap) {
        if (annotationId) deleteAnnotationFromServer(endpoint, annotationId).catch(() => {});
      }
      placementAnnotationMap.clear();
      for (const [, annotationId] of rearrangeAnnotationMap) {
        if (annotationId) deleteAnnotationFromServer(endpoint, annotationId).catch(() => {});
      }
      rearrangeAnnotationMap.clear();
    }

    isClearing = true;
    cleared = true;

    drawStrokes = [];
    const canvas = drawCanvas;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (designPlacements.length > 0 || rearrangeState) {
      designClearSignal += 1;
      rearrangeClearSignal += 1;
      originalSetTimeout(() => {
        designPlacements = [];
        rearrangeState = null;
      }, 200);
    }
    if (blankCanvas) blankCanvas = false;
    if (wireframePurpose) wireframePurpose = "";
    wireframeStash = { rearrange: null, placements: [] };
    clearWireframeState(pathname);

    const totalAnimationTime = count * 30 + 200;
    originalSetTimeout(() => {
      annotations = [];
      animatedMarkers = new Set();
      localStorage.removeItem(getStorageKey(pathname));
      isClearing = false;
    }, totalAnimationTime);

    originalSetTimeout(() => (cleared = false), 1500);
  }

  async function copyOutput() {
    const displayUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : pathname;
    const wireframeOnly = isDesignMode && blankCanvas;

    let output: string;
    if (wireframeOnly) {
      if (designPlacements.length === 0 && !rearrangeState && !wireframePurpose) return;
      output = "";
    } else {
      output = generateOutput(annotations, displayUrl, settings.outputDetail);
      if (!output && drawStrokes.length === 0 && designPlacements.length === 0 && !rearrangeState)
        return;
      if (!output) output = `## Page Feedback: ${displayUrl}\n`;
    }

    if (!wireframeOnly && drawStrokes.length > 0) {
      const linkedDrawingIndices = new Set<number>();
      for (const a of annotations) {
        if (a.drawingIndex != null) linkedDrawingIndices.add(a.drawingIndex);
      }
      const canvas = drawCanvas;
      if (canvas) canvas.style.visibility = "hidden";

      const strokeDescriptions: string[] = [];
      const sy = window.scrollY;
      for (let strokeIdx = 0; strokeIdx < drawStrokes.length; strokeIdx++) {
        if (linkedDrawingIndices.has(strokeIdx)) continue;
        const stroke = drawStrokes[strokeIdx];
        if (stroke.points.length < 2) continue;
        const viewportPoints = stroke.fixed
          ? stroke.points
          : stroke.points.map((p) => ({ x: p.x, y: p.y - sy }));
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of viewportPoints) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
        const bboxW = maxX - minX;
        const bboxH = maxY - minY;
        const bboxDiag = Math.hypot(bboxW, bboxH);
        const start = viewportPoints[0];
        const end = viewportPoints[viewportPoints.length - 1];
        const startEndDist = Math.hypot(end.x - start.x, end.y - start.y);

        let gesture: "circle" | "box" | "underline" | "arrow" | "drawing";
        const closedLoop = startEndDist < bboxDiag * 0.35;
        const aspectRatio = bboxW / Math.max(bboxH, 1);
        if (closedLoop && bboxDiag > 20) {
          const edgeThreshold = Math.max(bboxW, bboxH) * 0.15;
          let edgePoints = 0;
          for (const p of viewportPoints) {
            const nearLeft = p.x - minX < edgeThreshold;
            const nearRight = maxX - p.x < edgeThreshold;
            const nearTop = p.y - minY < edgeThreshold;
            const nearBottom = maxY - p.y < edgeThreshold;
            if ((nearLeft || nearRight) && (nearTop || nearBottom)) edgePoints++;
          }
          gesture = edgePoints > viewportPoints.length * 0.15 ? "box" : "circle";
        } else if (aspectRatio > 3 && bboxH < 40) {
          gesture = "underline";
        } else if (startEndDist > bboxDiag * 0.5) {
          gesture = "arrow";
        } else {
          gesture = "drawing";
        }

        const sampleCount = Math.min(10, viewportPoints.length);
        const step = Math.max(1, Math.floor(viewportPoints.length / sampleCount));
        const seenElements = new Set<HTMLElement>();
        const elementNames: string[] = [];
        const samplePoints = [start];
        for (let i = step; i < viewportPoints.length - 1; i += step) {
          samplePoints.push(viewportPoints[i]);
        }
        samplePoints.push(end);
        for (const p of samplePoints) {
          const el = deepElementFromPoint(p.x, p.y);
          if (!el || seenElements.has(el)) continue;
          if (closestCrossingShadow(el, "[data-feedback-toolbar]")) continue;
          seenElements.add(el);
          const { name } = identifyElement(el);
          if (!elementNames.includes(name)) elementNames.push(name);
        }

        const region = `${Math.round(minX)},${Math.round(minY)} → ${Math.round(maxX)},${Math.round(maxY)}`;
        let desc: string;
        if ((gesture === "circle" || gesture === "box") && elementNames.length > 0) {
          const verb = gesture === "box" ? "Boxed" : "Circled";
          desc = `${verb} **${elementNames[0]}**${elementNames.length > 1 ? ` (and ${elementNames.slice(1).join(", ")})` : ""} (region: ${region})`;
        } else if (gesture === "underline" && elementNames.length > 0) {
          desc = `Underlined **${elementNames[0]}** (${region})`;
        } else if (gesture === "arrow" && elementNames.length >= 2) {
          desc = `Arrow from **${elementNames[0]}** to **${elementNames[elementNames.length - 1]}** (${Math.round(start.x)},${Math.round(start.y)} → ${Math.round(end.x)},${Math.round(end.y)})`;
        } else if (elementNames.length > 0) {
          desc = `${gesture === "arrow" ? "Arrow" : "Drawing"} near **${elementNames.join("**, **")}** (region: ${region})`;
        } else {
          desc = `Drawing at ${region}`;
        }
        strokeDescriptions.push(desc);
      }
      if (canvas) canvas.style.visibility = "";
      if (strokeDescriptions.length > 0) {
        output += `\n**Drawings:**\n`;
        strokeDescriptions.forEach((d, i) => {
          output += `${i + 1}. ${d}\n`;
        });
      }
    }

    if (designPlacements.length > 0 || (wireframeOnly && wireframePurpose)) {
      output +=
        "\n" +
        generateDesignOutput(
          designPlacements,
          { width: window.innerWidth, height: window.innerHeight },
          { blankCanvas, wireframePurpose: wireframePurpose || undefined },
          settings.outputDetail,
        );
    }

    if (rearrangeState) {
      const rearrangeOutput = generateRearrangeOutput(rearrangeState, settings.outputDetail, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (rearrangeOutput) output += "\n" + rearrangeOutput;
    }

    if (copyToClipboard) {
      try {
        await navigator.clipboard.writeText(output);
      } catch {
        // Clipboard may fail (permissions, not HTTPS, etc.)
      }
    }
    onCopy?.(output);

    copied = true;
    originalSetTimeout(() => (copied = false), 2000);
    if (settings.autoClearAfterCopy) {
      originalSetTimeout(() => clearAll(), 500);
    }
  }

  async function sendToWebhook() {
    const displayUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : pathname;
    let output = generateOutput(annotations, displayUrl, settings.outputDetail);
    if (!output && designPlacements.length === 0 && !rearrangeState) return;
    if (!output) output = `## Page Feedback: ${displayUrl}\n`;

    if (designPlacements.length > 0) {
      output +=
        "\n" +
        generateDesignOutput(
          designPlacements,
          { width: window.innerWidth, height: window.innerHeight },
          { blankCanvas, wireframePurpose: wireframePurpose || undefined },
          settings.outputDetail,
        );
    }
    if (rearrangeState) {
      const rearrangeOutput = generateRearrangeOutput(rearrangeState, settings.outputDetail, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (rearrangeOutput) output += "\n" + rearrangeOutput;
    }

    if (onSubmit) onSubmit(output, annotations);

    sendState = "sending";
    await new Promise((resolve) => originalSetTimeout(resolve, 150));
    const success = await fireWebhook("submit", { output, annotations }, true);
    sendState = success ? "sent" : "failed";
    originalSetTimeout(() => (sendState = "idle"), 2500);
    if (success && settings.autoClearAfterCopy) {
      originalSetTimeout(() => clearAll(), 500);
    }
  }

  function handleToolbarMouseDown(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button") || t.closest("[data-agentation-settings-panel]")) return;
    const toolbarParent = (e.currentTarget as HTMLElement).parentElement;
    if (!toolbarParent) return;
    const rect = toolbarParent.getBoundingClientRect();
    const currentX = toolbarPosition?.x ?? rect.left;
    const currentY = toolbarPosition?.y ?? rect.top;
    dragStartPos = { x: e.clientX, y: e.clientY, toolbarX: currentX, toolbarY: currentY };
  }

  function getTooltipPosition(annotation: Annotation): string {
    const tooltipMaxWidth = 200;
    const tooltipEstimatedHeight = 80;
    const markerSize = 22;
    const gap = 10;
    const markerX = (annotation.x / 100) * window.innerWidth;
    const markerY =
      typeof annotation.y === "string" ? parseFloat(annotation.y) : annotation.y;
    let css = "";
    const spaceBelow = window.innerHeight - markerY - markerSize - gap;
    if (spaceBelow < tooltipEstimatedHeight) {
      css += `top: auto; bottom: calc(100% + ${gap}px);`;
    }
    const centerX = markerX - tooltipMaxWidth / 2;
    const edgePadding = 10;
    if (centerX < edgePadding) {
      const offset = edgePadding - centerX;
      css += `left: calc(50% + ${offset}px);`;
    } else if (centerX + tooltipMaxWidth > window.innerWidth - edgePadding) {
      const overflow = centerX + tooltipMaxWidth - (window.innerWidth - edgePadding);
      css += `left: calc(50% - ${overflow}px);`;
    }
    return css;
  }

  // ===========================================================================
  // Effects (mirrors the React useEffect dependency arrays; untrack() keeps
  // body reads from widening the tracked dependency set.)
  // ===========================================================================

  // Stop toolbar-originating events from bubbling past document.body.
  $effect(() =>
    untrack(() => {
      const stop = (e: Event) => {
        if (portalWrapper && portalWrapper.contains(e.target as Node)) e.stopPropagation();
      };
      const events = ["mousedown", "click", "pointerdown"] as const;
      events.forEach((evt) => document.body.addEventListener(evt, stop));
      return () => events.forEach((evt) => document.body.removeEventListener(evt, stop));
    }),
  );

  // Delay blank-canvas .visible by one frame so the CSS transition fires.
  $effect(() => {
    void canvasShouldBeVisible;
    return untrack(() => {
      if (canvasShouldBeVisible) {
        canvasReady = false;
        const raf = originalRequestAnimationFrame(() => (canvasReady = true));
        return () => cancelAnimationFrame(raf);
      } else {
        canvasReady = false;
      }
    });
  });

  // Tooltip session timer cleanup.
  $effect(() =>
    untrack(() => () => {
      if (tooltipSessionTimer) clearTimeout(tooltipSessionTimer);
    }),
  );

  // showSettings exit animation.
  $effect(() => {
    void showSettings;
    return untrack(() => {
      if (showSettings) {
        showSettingsVisible = true;
      } else {
        tooltipsHidden = false;
        settingsPage = "main";
        const timer = originalSetTimeout(() => (showSettingsVisible = false), 0);
        return () => clearTimeout(timer);
      }
    });
  });

  // Unified marker visibility.
  $effect(() => {
    void shouldShowMarkers;
    return untrack(() => {
      if (shouldShowMarkers) {
        markersExiting = false;
        markersVisible = true;
        animatedMarkers = new Set();
        const timer = originalSetTimeout(() => {
          const newSet = new Set(animatedMarkers);
          annotations.forEach((a) => newSet.add(a.id));
          animatedMarkers = newSet;
        }, 350);
        return () => clearTimeout(timer);
      } else if (markersVisible) {
        markersExiting = true;
        const timer = originalSetTimeout(() => {
          markersVisible = false;
          markersExiting = false;
        }, 250);
        return () => clearTimeout(timer);
      }
    });
  });

  // Mount and load.
  $effect(() =>
    untrack(() => {
      mounted = true;
      scrollY = window.scrollY;
      const stored = loadAnnotations<Annotation>(pathname);
      annotations = stored.filter(isRenderableAnnotation);

      if (!hasPlayedEntranceAnimation) {
        showEntranceAnimation = true;
        hasPlayedEntranceAnimation = true;
        originalSetTimeout(() => (showEntranceAnimation = false), 750);
      }

      try {
        const savedTheme = localStorage.getItem("feedback-toolbar-theme");
        if (savedTheme !== null) isDarkMode = savedTheme === "dark";
      } catch {
        /* ignore */
      }

      try {
        const savedPosition = localStorage.getItem("feedback-toolbar-position");
        if (savedPosition) {
          const pos = JSON.parse(savedPosition);
          if (typeof pos.x === "number" && typeof pos.y === "number") toolbarPosition = pos;
        }
      } catch {
        /* ignore */
      }
    }),
  );

  // Save settings.
  $effect(() => {
    void [settings, mounted];
    untrack(() => {
      if (mounted)
        localStorage.setItem("feedback-toolbar-settings", JSON.stringify(settings));
    });
  });

  // Save theme.
  $effect(() => {
    void [isDarkMode, mounted];
    untrack(() => {
      if (mounted)
        localStorage.setItem("feedback-toolbar-theme", isDarkMode ? "dark" : "light");
    });
  });

  // Save toolbar position when drag ends.
  let prevDraggingToolbar = false;
  $effect(() => {
    void [isDraggingToolbar, toolbarPosition, mounted];
    untrack(() => {
      const wasDragging = prevDraggingToolbar;
      prevDraggingToolbar = isDraggingToolbar;
      if (wasDragging && !isDraggingToolbar && toolbarPosition && mounted) {
        localStorage.setItem("feedback-toolbar-position", JSON.stringify(toolbarPosition));
      }
    });
  });

  // Initialize server session.
  $effect(() => {
    void [endpoint, mounted];
    untrack(() => {
      if (!endpoint || !mounted || sessionInitialized) return;
      sessionInitialized = true;
      connectionStatus = "connecting";

      const initSession = async () => {
        try {
          const storedSessionId = loadSessionId(pathname);
          const sessionIdToJoin = initialSessionId || storedSessionId;
          let sessionEstablished = false;

          if (sessionIdToJoin) {
            try {
              const session = await getSession(endpoint, sessionIdToJoin);
              currentSessionId = session.id;
              connectionStatus = "connected";
              saveSessionId(pathname, session.id);
              sessionEstablished = true;

              const allLocalAnnotations = loadAnnotations<Annotation>(pathname);
              const serverIds = new Set(session.annotations.map((a) => a.id));
              const localToMerge = allLocalAnnotations.filter((a) => !serverIds.has(a.id));

              if (localToMerge.length > 0) {
                const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                const pageUrl = `${baseUrl}${pathname}`;
                const results = await Promise.allSettled(
                  localToMerge.map((annotation) =>
                    syncAnnotation(endpoint, session.id, {
                      ...annotation,
                      sessionId: session.id,
                      url: pageUrl,
                    }),
                  ),
                );
                const syncedAnnotations = results.map((result, i) =>
                  result.status === "fulfilled" ? result.value : localToMerge[i],
                );
                const allAnnotations = [...session.annotations, ...syncedAnnotations];
                annotations = allAnnotations.filter(isRenderableAnnotation);
                saveAnnotationsWithSyncMarker(
                  pathname,
                  allAnnotations.filter(isRenderableAnnotation),
                  session.id,
                );
              } else {
                annotations = session.annotations.filter(isRenderableAnnotation);
                saveAnnotationsWithSyncMarker(
                  pathname,
                  session.annotations.filter(isRenderableAnnotation),
                  session.id,
                );
              }
            } catch (joinError) {
              console.warn("[Agentation] Could not join session, creating new:", joinError);
              clearSessionId(pathname);
            }
          }

          if (!sessionEstablished) {
            const currentUrl = typeof window !== "undefined" ? window.location.href : "/";
            const session = await createSession(endpoint, currentUrl);
            currentSessionId = session.id;
            connectionStatus = "connected";
            saveSessionId(pathname, session.id);
            onSessionCreated?.(session.id);

            const allAnnotations = loadAllAnnotations<Annotation>();
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            const syncPromises: Promise<void>[] = [];
            for (const [pagePath, pageAnnotations] of allAnnotations) {
              const unsyncedAnnotations = pageAnnotations.filter(
                (a) => !(a as Annotation & { _syncedTo?: string })._syncedTo,
              );
              if (unsyncedAnnotations.length === 0) continue;
              const pageUrl = `${baseUrl}${pagePath}`;
              const isCurrentPage = pagePath === pathname;
              syncPromises.push(
                (async () => {
                  try {
                    const targetSession = isCurrentPage
                      ? session
                      : await createSession(endpoint, pageUrl);
                    const results = await Promise.allSettled(
                      unsyncedAnnotations.map((annotation) =>
                        syncAnnotation(endpoint, targetSession.id, {
                          ...annotation,
                          sessionId: targetSession.id,
                          url: pageUrl,
                        }),
                      ),
                    );
                    const syncedAnnotations = results.map((result, i) =>
                      result.status === "fulfilled" ? result.value : unsyncedAnnotations[i],
                    );
                    const renderableSyncedAnnotations =
                      syncedAnnotations.filter(isRenderableAnnotation);
                    saveAnnotationsWithSyncMarker(
                      pagePath,
                      renderableSyncedAnnotations,
                      targetSession.id,
                    );
                    if (isCurrentPage) {
                      const originalIds = new Set(unsyncedAnnotations.map((a) => a.id));
                      const newDuringSync = annotations.filter((a) => !originalIds.has(a.id));
                      annotations = [...renderableSyncedAnnotations, ...newDuringSync];
                    }
                  } catch (err) {
                    console.warn(`[Agentation] Failed to sync annotations for ${pagePath}:`, err);
                  }
                })(),
              );
            }
            await Promise.allSettled(syncPromises);
          }
        } catch (error) {
          connectionStatus = "disconnected";
          console.warn("[Agentation] Failed to initialize session, using local storage:", error);
        }
      };
      initSession();
    });
  });

  // Periodic health check.
  $effect(() => {
    void [endpoint, mounted];
    return untrack(() => {
      if (!endpoint || !mounted) return;
      const checkHealth = async () => {
        try {
          const response = await fetch(`${endpoint}/health`);
          connectionStatus = response.ok ? "connected" : "disconnected";
        } catch {
          connectionStatus = "disconnected";
        }
      };
      checkHealth();
      const interval = originalSetInterval(checkHealth, 10000);
      return () => clearInterval(interval);
    });
  });

  // Listen for server-side annotation updates.
  $effect(() => {
    void [endpoint, mounted, currentSessionId];
    return untrack(() => {
      if (!endpoint || !mounted || !currentSessionId) return;
      const eventSource = new EventSource(`${endpoint}/sessions/${currentSessionId}/events`);
      const removedStatuses = ["resolved", "dismissed"];
      const handler = (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data);
          if (removedStatuses.includes(event.payload?.status)) {
            const id = event.payload.id as string;
            const kind = event.payload.kind as string | undefined;
            if (kind === "placement") {
              for (const [placementId, annotationId] of placementAnnotationMap) {
                if (annotationId === id) {
                  placementAnnotationMap.delete(placementId);
                  designPlacements = designPlacements.filter((p) => p.id !== placementId);
                  break;
                }
              }
            } else if (kind === "rearrange") {
              for (const [sectionId, annotationId] of rearrangeAnnotationMap) {
                if (annotationId === id) {
                  rearrangeAnnotationMap.delete(sectionId);
                  if (rearrangeState) {
                    const remaining = rearrangeState.sections.filter((s) => s.id !== sectionId);
                    rearrangeState =
                      remaining.length === 0
                        ? null
                        : { ...rearrangeState, sections: remaining };
                  }
                  break;
                }
              }
            } else {
              exitingMarkers = new Set(exitingMarkers).add(id);
              originalSetTimeout(() => {
                annotations = annotations.filter((a) => a.id !== id);
                const next = new Set(exitingMarkers);
                next.delete(id);
                exitingMarkers = next;
              }, 150);
            }
          }
        } catch {
          /* ignore */
        }
      };
      eventSource.addEventListener("annotation.updated", handler);
      return () => {
        eventSource.removeEventListener("annotation.updated", handler);
        eventSource.close();
      };
    });
  });

  // Sync local annotations when connection is restored.
  $effect(() => {
    void [connectionStatus, endpoint, mounted, currentSessionId];
    untrack(() => {
      if (!endpoint || !mounted) return;
      const wasDisconnected = prevConnectionStatus === "disconnected";
      const isNowConnected = connectionStatus === "connected";
      prevConnectionStatus = connectionStatus;
      if (wasDisconnected && isNowConnected) {
        const syncLocalAnnotations = async () => {
          try {
            const localAnnotations = loadAnnotations<Annotation>(pathname);
            if (localAnnotations.length === 0) return;
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            const pageUrl = `${baseUrl}${pathname}`;
            let sessionId = currentSessionId;
            let serverAnnotations: Annotation[] = [];
            if (sessionId) {
              try {
                const session = await getSession(endpoint, sessionId);
                serverAnnotations = session.annotations;
              } catch {
                sessionId = null;
              }
            }
            if (!sessionId) {
              const newSession = await createSession(endpoint, pageUrl);
              sessionId = newSession.id;
              currentSessionId = sessionId;
              saveSessionId(pathname, sessionId);
            }
            const serverIds = new Set(serverAnnotations.map((a) => a.id));
            const unsyncedLocal = localAnnotations.filter((a) => !serverIds.has(a.id));
            if (unsyncedLocal.length > 0) {
              const results = await Promise.allSettled(
                unsyncedLocal.map((annotation) =>
                  syncAnnotation(endpoint, sessionId!, {
                    ...annotation,
                    sessionId: sessionId!,
                    url: pageUrl,
                  }),
                ),
              );
              const syncedAnnotations = results.map((result, i) =>
                result.status === "fulfilled" ? result.value : unsyncedLocal[i],
              );
              const allAnnotations = [...serverAnnotations, ...syncedAnnotations];
              const renderableAnnotations = allAnnotations.filter(isRenderableAnnotation);
              annotations = renderableAnnotations;
              saveAnnotationsWithSyncMarker(pathname, renderableAnnotations, sessionId!);
            }
          } catch (err) {
            console.warn("[Agentation] Failed to sync on reconnect:", err);
          }
        };
        syncLocalAnnotations();
      }
    });
  });

  // Demo annotations.
  $effect(() => {
    void [enableDemoMode, mounted, demoAnnotations, demoDelay];
    return untrack(() => {
      if (!enableDemoMode) return;
      if (!mounted || !demoAnnotations || demoAnnotations.length === 0) return;
      if (annotations.length > 0) return;
      const timeoutIds: number[] = [];
      timeoutIds.push(originalSetTimeout(() => (isActive = true), demoDelay - 200));
      demoAnnotations.forEach((demo, index) => {
        const annotationDelay = demoDelay + index * 300;
        timeoutIds.push(
          originalSetTimeout(() => {
            const element = document.querySelector(demo.selector) as HTMLElement;
            if (!element) return;
            const rect = element.getBoundingClientRect();
            const { name, path } = identifyElement(element);
            const newAnnotation: Annotation = {
              id: `demo-${Date.now()}-${index}`,
              x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
              y: rect.top + rect.height / 2 + window.scrollY,
              comment: demo.comment,
              element: name,
              elementPath: path,
              timestamp: Date.now(),
              selectedText: demo.selectedText,
              boundingBox: {
                x: rect.left,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
              },
              nearbyText: getNearbyText(element),
              cssClasses: getElementClasses(element),
            };
            annotations = [...annotations, newAnnotation];
          }, annotationDelay),
        );
      });
      return () => timeoutIds.forEach(clearTimeout);
    });
  });

  // Track scroll.
  $effect(() =>
    untrack(() => {
      const handleScroll = () => {
        scrollY = window.scrollY;
        isScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = originalSetTimeout(() => (isScrolling = false), 150);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }),
  );

  // Save annotations.
  $effect(() => {
    void [annotations, mounted, currentSessionId];
    untrack(() => {
      if (mounted && annotations.length > 0) {
        if (currentSessionId)
          saveAnnotationsWithSyncMarker(pathname, annotations, currentSessionId);
        else saveAnnotations(pathname, annotations);
      } else if (mounted && annotations.length === 0) {
        localStorage.removeItem(getStorageKey(pathname));
      }
    });
  });

  // Load design placements.
  $effect(() => {
    void mounted;
    untrack(() => {
      if (mounted && !designPlacementsLoaded) {
        designPlacementsLoaded = true;
        const stored = loadDesignPlacements<DesignPlacement>(pathname);
        if (stored.length > 0) designPlacements = stored;
      }
    });
  });

  // Save design placements.
  $effect(() => {
    void [designPlacements, mounted, blankCanvas];
    untrack(() => {
      if (mounted && designPlacementsLoaded && !blankCanvas) {
        if (designPlacements.length > 0) saveDesignPlacements(pathname, designPlacements);
        else clearDesignPlacements(pathname);
      }
    });
  });

  // Load rearrange state.
  $effect(() => {
    void mounted;
    untrack(() => {
      if (mounted && !rearrangeLoaded) {
        rearrangeLoaded = true;
        const stored = loadRearrangeState<RearrangeState>(pathname);
        if (stored) {
          rearrangeState = {
            ...stored,
            sections: stored.sections.map((s) => ({
              ...s,
              currentRect: s.currentRect ?? { ...s.originalRect },
            })),
          };
        }
      }
    });
  });

  // Save rearrange state.
  $effect(() => {
    void [rearrangeState, mounted, blankCanvas];
    untrack(() => {
      if (mounted && rearrangeLoaded && !blankCanvas) {
        if (rearrangeState) saveRearrangeState(pathname, rearrangeState);
        else clearRearrangeState(pathname);
      }
    });
  });

  // Load wireframe stash.
  let wireframeLoaded = false;
  $effect(() => {
    void mounted;
    untrack(() => {
      if (mounted && !wireframeLoaded) {
        wireframeLoaded = true;
        const stored = loadWireframeState<RearrangeState>(pathname);
        if (stored) {
          wireframeStash = {
            rearrange: (stored as any).rearrange,
            placements: ((stored as any).placements || []) as DesignPlacement[],
          };
          if ((stored as any).purpose) wireframePurpose = (stored as any).purpose;
        }
      }
    });
  });

  // Save wireframe stash.
  $effect(() => {
    void [rearrangeState, designPlacements, wireframePurpose, blankCanvas, mounted];
    untrack(() => {
      if (!mounted || !wireframeLoaded) return;
      const stash = wireframeStash;
      if (blankCanvas) {
        const hasContent =
          (rearrangeState?.sections?.length ?? 0) > 0 ||
          designPlacements.length > 0 ||
          wireframePurpose;
        if (hasContent)
          saveWireframeState(pathname, {
            rearrange: rearrangeState,
            placements: designPlacements,
            purpose: wireframePurpose,
          } as any);
        else clearWireframeState(pathname);
      } else {
        const hasContent =
          (stash.rearrange?.sections?.length ?? 0) > 0 ||
          stash.placements.length > 0 ||
          wireframePurpose;
        if (hasContent)
          saveWireframeState(pathname, {
            rearrange: stash.rearrange,
            placements: stash.placements,
            purpose: wireframePurpose,
          } as any);
        else clearWireframeState(pathname);
      }
    });
  });

  // Initialize empty rearrange state when entering explore mode.
  $effect(() => {
    void [isDesignMode, rearrangeState];
    untrack(() => {
      if (isDesignMode && !rearrangeState) {
        rearrangeState = { sections: [], originalOrder: [], detectedAt: Date.now() };
      }
    });
  });

  // Sync placement shadow annotations to server.
  $effect(() => {
    void [designPlacements, endpoint, currentSessionId];
    untrack(() => {
      if (!endpoint || !currentSessionId) return;
      const currentMap = placementAnnotationMap;
      const currentIds = new Set(designPlacements.map((p) => p.id));
      for (const p of designPlacements) {
        if (currentMap.has(p.id)) continue;
        currentMap.set(p.id, "");
        const pageUrl =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search + window.location.hash
            : pathname;
        syncAnnotation(endpoint, currentSessionId, {
          id: p.id,
          x: (p.x / window.innerWidth) * 100,
          y: p.y,
          comment: `Place ${p.type} at (${Math.round(p.x)}, ${Math.round(p.y)}), ${p.width}×${p.height}px${p.text ? ` — "${p.text}"` : ""}`,
          element: `[design:${p.type}]`,
          elementPath: "[placement]",
          timestamp: p.timestamp,
          url: pageUrl,
          intent: "change",
          severity: "important",
          kind: "placement",
          placement: {
            componentType: p.type,
            width: p.width,
            height: p.height,
            scrollY: p.scrollY,
            text: p.text,
          },
        } as Annotation)
          .then((serverAnnotation) => {
            if (currentMap.has(p.id)) currentMap.set(p.id, serverAnnotation.id);
          })
          .catch((err) => {
            console.warn("[Agentation] Failed to sync placement annotation:", err);
            currentMap.delete(p.id);
          });
      }
      for (const [placementId, annotationId] of currentMap) {
        if (!currentIds.has(placementId)) {
          currentMap.delete(placementId);
          if (annotationId) deleteAnnotationFromServer(endpoint, annotationId).catch(() => {});
        }
      }
    });
  });

  // Sync rearrange shadow annotations to server (debounced).
  $effect(() => {
    void [rearrangeState, endpoint, currentSessionId];
    return untrack(() => {
      if (!endpoint || !currentSessionId) return;
      if (rearrangeDebounceTimer) clearTimeout(rearrangeDebounceTimer);
      rearrangeDebounceTimer = originalSetTimeout(() => {
        const currentMap = rearrangeAnnotationMap;
        if (!rearrangeState || rearrangeState.sections.length === 0) {
          for (const [, annotationId] of currentMap) {
            if (annotationId) deleteAnnotationFromServer(endpoint, annotationId).catch(() => {});
          }
          currentMap.clear();
          return;
        }
        const currentIds = new Set(rearrangeState.sections.map((s) => s.id));
        const pageUrl =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search + window.location.hash
            : pathname;
        for (const section of rearrangeState.sections) {
          const orig = section.originalRect;
          const curr = section.currentRect;
          const hasMoved =
            Math.abs(orig.x - curr.x) > 1 ||
            Math.abs(orig.y - curr.y) > 1 ||
            Math.abs(orig.width - curr.width) > 1 ||
            Math.abs(orig.height - curr.height) > 1;
          if (!hasMoved) {
            const existingId = currentMap.get(section.id);
            if (existingId) {
              currentMap.delete(section.id);
              deleteAnnotationFromServer(endpoint, existingId).catch(() => {});
            }
            continue;
          }
          const existingAnnotationId = currentMap.get(section.id);
          const comment = `Move ${section.label} section (${section.tagName}) — from (${Math.round(orig.x)},${Math.round(orig.y)}) ${Math.round(orig.width)}×${Math.round(orig.height)} to (${Math.round(curr.x)},${Math.round(curr.y)}) ${Math.round(curr.width)}×${Math.round(curr.height)}`;
          if (existingAnnotationId) {
            updateAnnotationOnServer(endpoint, existingAnnotationId, { comment }).catch((err) => {
              console.warn("[Agentation] Failed to update rearrange annotation:", err);
            });
          } else {
            currentMap.set(section.id, "");
            syncAnnotation(endpoint, currentSessionId!, {
              id: section.id,
              x: (curr.x / window.innerWidth) * 100,
              y: curr.y,
              comment,
              element: section.selector,
              elementPath: "[rearrange]",
              timestamp: Date.now(),
              url: pageUrl,
              intent: "change",
              severity: "important",
              kind: "rearrange",
              rearrange: {
                selector: section.selector,
                label: section.label,
                tagName: section.tagName,
                originalRect: orig,
                currentRect: curr,
              },
            } as Annotation)
              .then((serverAnnotation) => {
                if (currentMap.has(section.id)) currentMap.set(section.id, serverAnnotation.id);
              })
              .catch((err) => {
                console.warn("[Agentation] Failed to sync rearrange annotation:", err);
                currentMap.delete(section.id);
              });
          }
        }
        for (const [sectionId, annotationId] of currentMap) {
          if (!currentIds.has(sectionId)) {
            currentMap.delete(sectionId);
            if (annotationId) deleteAnnotationFromServer(endpoint, annotationId).catch(() => {});
          }
        }
      }, 300);
      return () => {
        if (rearrangeDebounceTimer) clearTimeout(rearrangeDebounceTimer);
      };
    });
  });

  // Visually move/resize original DOM elements to match rearrange state.
  type MovedEntry = {
    el: HTMLElement;
    origStyles: {
      transform: string;
      transformOrigin: string;
      opacity: string;
      position: string;
      zIndex: string;
      display: string;
    };
    ancestors: { el: HTMLElement; overflow: string }[];
  };
  let rearrangeMovedEls = new Map<string, MovedEntry>();
  $effect.pre(() => {
    void [rearrangeState, isDesignMode, designOverlayExiting, isActive];
    untrack(() => {
      const sections = rearrangeState?.sections ?? [];
      const active = new Set<string>();
      if ((isDesignMode || designOverlayExiting) && isActive) {
        for (const s of sections) {
          active.add(s.id);
          try {
            const el = document.querySelector(s.selector) as HTMLElement | null;
            if (!el) continue;
            if (!rearrangeMovedEls.has(s.id)) {
              const origStyles = {
                transform: el.style.transform,
                transformOrigin: el.style.transformOrigin,
                opacity: el.style.opacity,
                position: el.style.position,
                zIndex: el.style.zIndex,
                display: el.style.display,
              };
              const ancestors: { el: HTMLElement; overflow: string }[] = [];
              let parent = el.parentElement;
              while (parent && parent !== document.body) {
                const cs = getComputedStyle(parent);
                if (
                  cs.overflow !== "visible" ||
                  cs.overflowX !== "visible" ||
                  cs.overflowY !== "visible"
                ) {
                  ancestors.push({ el: parent, overflow: parent.style.overflow });
                  parent.style.overflow = "visible";
                }
                parent = parent.parentElement;
              }
              const computed = getComputedStyle(el);
              if (computed.display === "inline") el.style.display = "inline-block";
              rearrangeMovedEls.set(s.id, { el, origStyles, ancestors });
              el.style.transformOrigin = "top left";
              el.style.zIndex = "9999";
            }
          } catch {
            /* invalid selector */
          }
        }
      }
      for (const [id, entry] of rearrangeMovedEls) {
        if (!active.has(id)) {
          const { el, origStyles, ancestors } = entry;
          el.style.transition =
            "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = origStyles.transform;
          el.style.transformOrigin = origStyles.transformOrigin;
          el.style.opacity = origStyles.opacity;
          el.style.position = origStyles.position;
          el.style.zIndex = origStyles.zIndex;
          rearrangeMovedEls.delete(id);
          originalSetTimeout(() => {
            el.style.transition = "";
            el.style.display = origStyles.display;
            for (const a of ancestors) a.el.style.overflow = a.overflow;
          }, 450);
        }
      }
    });
  });

  // Clean up all moved elements on unmount.
  $effect(() =>
    untrack(() => () => {
      for (const [, entry] of rearrangeMovedEls) {
        const { el, origStyles, ancestors } = entry;
        el.style.transition =
          "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = origStyles.transform;
        el.style.transformOrigin = origStyles.transformOrigin;
        el.style.opacity = origStyles.opacity;
        el.style.position = origStyles.position;
        el.style.zIndex = origStyles.zIndex;
        originalSetTimeout(() => {
          el.style.transition = "";
          el.style.display = origStyles.display;
          for (const a of ancestors) a.el.style.overflow = a.overflow;
        }, 450);
      }
      rearrangeMovedEls.clear();
    }),
  );

  // Reset state when deactivating.
  $effect(() => {
    void [isActive, isFrozen];
    untrack(() => {
      if (!isActive) {
        pendingAnnotation = null;
        editingAnnotation = null;
        editingTargetElement = null;
        editingTargetElements = [];
        hoverInfo = null;
        showSettings = false;
        pendingMultiSelectElements = [];
        modifiersHeld = { cmd: false, shift: false };
        if (isFrozen) unfreezeAnimations();
      }
    });
  });

  // Unmount safety — unfreeze.
  $effect(() =>
    untrack(() => () => {
      unfreezeAll();
    }),
  );

  // Custom cursor.
  $effect(() => {
    void isActive;
    return untrack(() => {
      if (!isActive) return;
      const textElementsSelector = [
        "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "label",
        "blockquote", "figcaption", "caption", "legend", "dt", "dd", "pre", "code",
        "em", "strong", "b", "i", "u", "s", "a", "time", "address", "cite", "q",
        "abbr", "dfn", "mark", "small", "sub", "sup", "[contenteditable]",
      ].join(", ");
      const notAgentationSelector = `:not([data-agentation-root]):not([data-agentation-root] *)`;
      const style = document.createElement("style");
      style.id = "feedback-cursor-styles";
      style.textContent = `
      body ${notAgentationSelector} {
        cursor: crosshair !important;
      }

      body :is(${textElementsSelector})${notAgentationSelector} {
        cursor: text !important;
      }
    `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById("feedback-cursor-styles");
        if (existingStyle) existingStyle.remove();
      };
    });
  });

  // Cursor change when hovering a drawing stroke.
  $effect(() => {
    void [hoveredDrawingIdx, isActive];
    return untrack(() => {
      if (hoveredDrawingIdx !== null && isActive) {
        document.documentElement.setAttribute("data-drawing-hover", "");
        return () => document.documentElement.removeAttribute("data-drawing-hover");
      }
    });
  });

  // Hover element identification (mousemove).
  $effect(() => {
    void [isActive, pendingAnnotation, isDrawMode, isDesignMode];
    return untrack(() => {
      if (!isActive || pendingAnnotation || isDrawMode || isDesignMode) return;
      const handleMouseMove = (e: MouseEvent) => {
        const target = (e.composedPath()[0] || e.target) as HTMLElement;
        if (closestCrossingShadow(target, "[data-feedback-toolbar]")) {
          hoverInfo = null;
          return;
        }
        const elementUnder = deepElementFromPoint(e.clientX, e.clientY);
        if (!elementUnder || closestCrossingShadow(elementUnder, "[data-feedback-toolbar]")) {
          hoverInfo = null;
          return;
        }
        const { name, elementName, path, reactComponents } = identifyElementWithReact(
          elementUnder,
          effectiveReactMode,
        );
        const rect = elementUnder.getBoundingClientRect();
        hoverInfo = { element: name, elementName, elementPath: path, rect, reactComponents };
        hoverPosition = { x: e.clientX, y: e.clientY };
      };
      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    });
  });

  // Click handler.
  $effect(() => {
    void [isActive, isDrawMode, isDesignMode];
    return untrack(() => {
      if (!isActive || isDrawMode || isDesignMode) return;
      const handleClick = (e: MouseEvent) => {
        if (justFinishedDrag) {
          justFinishedDrag = false;
          return;
        }
        const target = (e.composedPath()[0] || e.target) as HTMLElement;
        if (closestCrossingShadow(target, "[data-feedback-toolbar]")) return;
        if (closestCrossingShadow(target, "[data-annotation-popup]")) return;
        if (closestCrossingShadow(target, "[data-annotation-marker]")) return;

        if (e.metaKey && e.shiftKey && !pendingAnnotation && !editingAnnotation) {
          e.preventDefault();
          e.stopPropagation();
          const elementUnder = deepElementFromPoint(e.clientX, e.clientY);
          if (!elementUnder) return;
          const rect = elementUnder.getBoundingClientRect();
          const { name, path, reactComponents } = identifyElementWithReact(
            elementUnder,
            effectiveReactMode,
          );
          const existingIndex = pendingMultiSelectElements.findIndex(
            (item) => item.element === elementUnder,
          );
          if (existingIndex >= 0) {
            pendingMultiSelectElements = pendingMultiSelectElements.filter(
              (_, i) => i !== existingIndex,
            );
          } else {
            pendingMultiSelectElements = [
              ...pendingMultiSelectElements,
              { element: elementUnder, rect, name, path, reactComponents: reactComponents ?? undefined },
            ];
          }
          return;
        }

        const isInteractive = closestCrossingShadow(
          target,
          "button, a, input, select, textarea, [role='button'], [onclick]",
        );
        if (settings.blockInteractions && isInteractive) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (pendingAnnotation) {
          if (isInteractive && !settings.blockInteractions) return;
          e.preventDefault();
          popupRef?.shake();
          return;
        }
        if (editingAnnotation) {
          if (isInteractive && !settings.blockInteractions) return;
          e.preventDefault();
          editPopupRef?.shake();
          return;
        }
        e.preventDefault();
        const elementUnder = deepElementFromPoint(e.clientX, e.clientY);
        if (!elementUnder) return;
        const { name, path, reactComponents } = identifyElementWithReact(
          elementUnder,
          effectiveReactMode,
        );
        const rect = elementUnder.getBoundingClientRect();
        const x = (e.clientX / window.innerWidth) * 100;
        const isFixed = isElementFixed(elementUnder);
        const y = isFixed ? e.clientY : e.clientY + window.scrollY;
        const selection = window.getSelection();
        let selectedText: string | undefined;
        if (selection && selection.toString().trim().length > 0) {
          selectedText = selection.toString().trim().slice(0, 500);
        }
        const computedStylesObj = getDetailedComputedStyles(elementUnder);
        const computedStylesStr = getForensicComputedStyles(elementUnder);
        pendingAnnotation = {
          x,
          y,
          clientY: e.clientY,
          element: name,
          elementPath: path,
          selectedText,
          boundingBox: {
            x: rect.left,
            y: isFixed ? rect.top : rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
          },
          nearbyText: getNearbyText(elementUnder),
          cssClasses: getElementClasses(elementUnder),
          isFixed,
          fullPath: getFullElementPath(elementUnder),
          accessibility: getAccessibilityInfo(elementUnder),
          computedStyles: computedStylesStr,
          computedStylesObj,
          nearbyElements: getNearbyElements(elementUnder),
          reactComponents: reactComponents ?? undefined,
          sourceFile: detectSourceFile(elementUnder),
          targetElement: elementUnder,
        };
        hoverInfo = null;
      };
      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    });
  });

  // Cmd+shift+click multi-select: modifier key tracking.
  $effect(() => {
    void isActive;
    return untrack(() => {
      if (!isActive) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Meta") modifiersHeld.cmd = true;
        if (e.key === "Shift") modifiersHeld.shift = true;
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        const wasHoldingBoth = modifiersHeld.cmd && modifiersHeld.shift;
        if (e.key === "Meta") modifiersHeld.cmd = false;
        if (e.key === "Shift") modifiersHeld.shift = false;
        const nowHoldingBoth = modifiersHeld.cmd && modifiersHeld.shift;
        if (wasHoldingBoth && !nowHoldingBoth && pendingMultiSelectElements.length > 0) {
          createMultiSelectPendingAnnotation();
        }
      };
      const handleBlur = () => {
        modifiersHeld = { cmd: false, shift: false };
        pendingMultiSelectElements = [];
      };
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      window.addEventListener("blur", handleBlur);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("blur", handleBlur);
      };
    });
  });

  // Multi-select drag - mousedown.
  $effect(() => {
    void [isActive, pendingAnnotation, isDrawMode, isDesignMode];
    return untrack(() => {
      if (!isActive || pendingAnnotation || isDrawMode || isDesignMode) return;
      const handleMouseDown = (e: MouseEvent) => {
        const target = (e.composedPath()[0] || e.target) as HTMLElement;
        if (closestCrossingShadow(target, "[data-feedback-toolbar]")) return;
        if (closestCrossingShadow(target, "[data-annotation-marker]")) return;
        if (closestCrossingShadow(target, "[data-annotation-popup]")) return;
        const textTags = new Set([
          "P", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TD", "TH", "LABEL",
          "BLOCKQUOTE", "FIGCAPTION", "CAPTION", "LEGEND", "DT", "DD", "PRE", "CODE",
          "EM", "STRONG", "B", "I", "U", "S", "A", "TIME", "ADDRESS", "CITE", "Q",
          "ABBR", "DFN", "MARK", "SMALL", "SUB", "SUP",
        ]);
        if (textTags.has(target.tagName) || target.isContentEditable) return;
        e.preventDefault();
        mouseDownPos = { x: e.clientX, y: e.clientY };
      };
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    });
  });

  // Multi-select drag - mousemove.
  $effect(() => {
    void [isActive, pendingAnnotation, isDragging];
    return untrack(() => {
      if (!isActive || pendingAnnotation) return;
      const handleMouseMove = (e: MouseEvent) => {
        if (!mouseDownPos) return;
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        const distance = dx * dx + dy * dy;
        const thresholdSq = DRAG_THRESHOLD * DRAG_THRESHOLD;
        if (!isDragging && distance >= thresholdSq) {
          dragStartRef = mouseDownPos;
          isDragging = true;
          e.preventDefault();
        }
        if ((isDragging || distance >= thresholdSq) && dragStartRef) {
          if (dragRectEl) {
            const left = Math.min(dragStartRef.x, e.clientX);
            const top = Math.min(dragStartRef.y, e.clientY);
            const width = Math.abs(e.clientX - dragStartRef.x);
            const height = Math.abs(e.clientY - dragStartRef.y);
            dragRectEl.style.transform = `translate(${left}px, ${top}px)`;
            dragRectEl.style.width = `${width}px`;
            dragRectEl.style.height = `${height}px`;
          }
          const now = Date.now();
          if (now - lastElementUpdate < ELEMENT_UPDATE_THROTTLE) return;
          lastElementUpdate = now;

          const startX = dragStartRef.x;
          const startY = dragStartRef.y;
          const left = Math.min(startX, e.clientX);
          const top = Math.min(startY, e.clientY);
          const right = Math.max(startX, e.clientX);
          const bottom = Math.max(startY, e.clientY);
          const midX = (left + right) / 2;
          const midY = (top + bottom) / 2;
          const candidateElements = new Set<HTMLElement>();
          const points = [
            [left, top], [right, top], [left, bottom], [right, bottom], [midX, midY],
            [midX, top], [midX, bottom], [left, midY], [right, midY],
          ];
          for (const [x, y] of points) {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) if (el instanceof HTMLElement) candidateElements.add(el);
          }
          const nearbyElements = document.querySelectorAll(
            "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th, div, span, section, article, aside, nav",
          );
          for (const el of nearbyElements) {
            if (el instanceof HTMLElement) {
              const rect = el.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const centerInside =
                centerX >= left && centerX <= right && centerY >= top && centerY <= bottom;
              const overlapX = Math.min(rect.right, right) - Math.max(rect.left, left);
              const overlapY = Math.min(rect.bottom, bottom) - Math.max(rect.top, top);
              const overlapArea = overlapX > 0 && overlapY > 0 ? overlapX * overlapY : 0;
              const elementArea = rect.width * rect.height;
              const overlapRatio = elementArea > 0 ? overlapArea / elementArea : 0;
              if (centerInside || overlapRatio > 0.5) candidateElements.add(el);
            }
          }
          const allMatching: DOMRect[] = [];
          const meaningfulTags = new Set([
            "BUTTON", "A", "INPUT", "IMG", "P", "H1", "H2", "H3", "H4", "H5", "H6",
            "LI", "LABEL", "TD", "TH", "SECTION", "ARTICLE", "ASIDE", "NAV",
          ]);
          for (const el of candidateElements) {
            if (
              closestCrossingShadow(el, "[data-feedback-toolbar]") ||
              closestCrossingShadow(el, "[data-annotation-marker]")
            )
              continue;
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.5)
              continue;
            if (rect.width < 10 || rect.height < 10) continue;
            if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) {
              const tagName = el.tagName;
              let shouldInclude = meaningfulTags.has(tagName);
              if (!shouldInclude && (tagName === "DIV" || tagName === "SPAN")) {
                const hasText = el.textContent && el.textContent.trim().length > 0;
                const isInteractive =
                  el.onclick !== null ||
                  el.getAttribute("role") === "button" ||
                  el.getAttribute("role") === "link" ||
                  el.classList.contains("clickable") ||
                  el.hasAttribute("data-clickable");
                if (
                  (hasText || isInteractive) &&
                  !el.querySelector("p, h1, h2, h3, h4, h5, h6, button, a")
                ) {
                  shouldInclude = true;
                }
              }
              if (shouldInclude) {
                let dominated = false;
                for (const existingRect of allMatching) {
                  if (
                    existingRect.left <= rect.left &&
                    existingRect.right >= rect.right &&
                    existingRect.top <= rect.top &&
                    existingRect.bottom >= rect.bottom
                  ) {
                    dominated = true;
                    break;
                  }
                }
                if (!dominated) allMatching.push(rect);
              }
            }
          }
          if (highlightsContainer) {
            const container = highlightsContainer;
            while (container.children.length > allMatching.length) {
              container.removeChild(container.lastChild!);
            }
            allMatching.forEach((rect, i) => {
              let div = container.children[i] as HTMLDivElement;
              if (!div) {
                div = document.createElement("div");
                div.className = styles.selectedElementHighlight;
                container.appendChild(div);
              }
              div.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
              div.style.width = `${rect.width}px`;
              div.style.height = `${rect.height}px`;
            });
          }
        }
      };
      document.addEventListener("mousemove", handleMouseMove, { passive: true });
      return () => document.removeEventListener("mousemove", handleMouseMove);
    });
  });

  // Multi-select drag - mouseup.
  $effect(() => {
    void [isActive, isDragging];
    return untrack(() => {
      if (!isActive) return;
      const handleMouseUp = (e: MouseEvent) => {
        const wasDragging = isDragging;
        const dragStart = dragStartRef;
        if (isDragging && dragStart) {
          justFinishedDrag = true;
          const left = Math.min(dragStart.x, e.clientX);
          const top = Math.min(dragStart.y, e.clientY);
          const right = Math.max(dragStart.x, e.clientX);
          const bottom = Math.max(dragStart.y, e.clientY);
          const allMatching: { element: HTMLElement; rect: DOMRect }[] = [];
          const selector = "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th";
          document.querySelectorAll(selector).forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            if (
              closestCrossingShadow(el, "[data-feedback-toolbar]") ||
              closestCrossingShadow(el, "[data-annotation-marker]")
            )
              return;
            const rect = el.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.5)
              return;
            if (rect.width < 10 || rect.height < 10) return;
            if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) {
              allMatching.push({ element: el, rect });
            }
          });
          const finalElements = allMatching.filter(
            ({ element: el }) =>
              !allMatching.some(({ element: other }) => other !== el && el.contains(other)),
          );
          const x = (e.clientX / window.innerWidth) * 100;
          const y = e.clientY + window.scrollY;
          if (finalElements.length > 0) {
            const bounds = finalElements.reduce(
              (acc, { rect }) => ({
                left: Math.min(acc.left, rect.left),
                top: Math.min(acc.top, rect.top),
                right: Math.max(acc.right, rect.right),
                bottom: Math.max(acc.bottom, rect.bottom),
              }),
              { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
            );
            const elementNames = finalElements
              .slice(0, 5)
              .map(({ element }) => identifyElement(element).name)
              .join(", ");
            const suffix = finalElements.length > 5 ? ` +${finalElements.length - 5} more` : "";
            const firstElement = finalElements[0].element;
            pendingAnnotation = {
              x,
              y,
              clientY: e.clientY,
              element: `${finalElements.length} elements: ${elementNames}${suffix}`,
              elementPath: "multi-select",
              boundingBox: {
                x: bounds.left,
                y: bounds.top + window.scrollY,
                width: bounds.right - bounds.left,
                height: bounds.bottom - bounds.top,
              },
              isMultiSelect: true,
              fullPath: getFullElementPath(firstElement),
              accessibility: getAccessibilityInfo(firstElement),
              computedStyles: getForensicComputedStyles(firstElement),
              computedStylesObj: getDetailedComputedStyles(firstElement),
              nearbyElements: getNearbyElements(firstElement),
              cssClasses: getElementClasses(firstElement),
              nearbyText: getNearbyText(firstElement),
              sourceFile: detectSourceFile(firstElement),
            };
          } else {
            const width = Math.abs(right - left);
            const height = Math.abs(bottom - top);
            if (width > 20 && height > 20) {
              pendingAnnotation = {
                x,
                y,
                clientY: e.clientY,
                element: "Area selection",
                elementPath: `region at (${Math.round(left)}, ${Math.round(top)})`,
                boundingBox: { x: left, y: top + window.scrollY, width, height },
                isMultiSelect: true,
              };
            }
          }
          hoverInfo = null;
        } else if (wasDragging) {
          justFinishedDrag = true;
        }
        mouseDownPos = null;
        dragStartRef = null;
        isDragging = false;
        if (highlightsContainer) highlightsContainer.innerHTML = "";
      };
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    });
  });

  // Toolbar dragging - mousemove/up.
  $effect(() => {
    void [dragStartPos, isDraggingToolbar, isActive, connectionStatus];
    return untrack(() => {
      if (!dragStartPos) return;
      const DRAG_T = 10;
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStartPos!.x;
        const deltaY = e.clientY - dragStartPos!.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (!isDraggingToolbar && distance > DRAG_T) isDraggingToolbar = true;
        if (isDraggingToolbar || distance > DRAG_T) {
          let newX = dragStartPos!.toolbarX + deltaX;
          let newY = dragStartPos!.toolbarY + deltaY;
          const padding = 20;
          const wrapperWidth = 337;
          const toolbarHeight = 44;
          const contentWidth = isActive
            ? connectionStatus === "connected"
              ? 297
              : 257
            : 44;
          const contentOffset = wrapperWidth - contentWidth;
          const minX = padding - contentOffset;
          const maxX = window.innerWidth - padding - wrapperWidth;
          newX = Math.max(minX, Math.min(maxX, newX));
          newY = Math.max(padding, Math.min(window.innerHeight - toolbarHeight - padding, newY));
          toolbarPosition = { x: newX, y: newY };
        }
      };
      const handleMouseUp = () => {
        if (isDraggingToolbar) justFinishedToolbarDrag = true;
        isDraggingToolbar = false;
        dragStartPos = null;
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    });
  });

  // Keep toolbar in view on resize / when expanding/collapsing.
  $effect(() => {
    void [toolbarPosition, isActive, connectionStatus];
    return untrack(() => {
      if (!toolbarPosition) return;
      const constrainPosition = () => {
        const padding = 20;
        const wrapperWidth = 337;
        const toolbarHeight = 44;
        let newX = toolbarPosition!.x;
        let newY = toolbarPosition!.y;
        const contentWidth = isActive
          ? connectionStatus === "connected"
            ? 297
            : 257
          : 44;
        const contentOffset = wrapperWidth - contentWidth;
        const minX = padding - contentOffset;
        const maxX = window.innerWidth - padding - wrapperWidth;
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(padding, Math.min(window.innerHeight - toolbarHeight - padding, newY));
        if (newX !== toolbarPosition!.x || newY !== toolbarPosition!.y) {
          toolbarPosition = { x: newX, y: newY };
        }
      };
      constrainPosition();
      window.addEventListener("resize", constrainPosition);
      return () => window.removeEventListener("resize", constrainPosition);
    });
  });

  // Keyboard shortcuts.
  $effect(() =>
    untrack(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isTyping =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (e.key === "Escape") {
          if (isDesignMode) {
            if (activeDesignComponent) activeDesignComponent = null;
            else closeDesignMode();
            return;
          }
          if (isDrawMode) {
            isDrawMode = false;
            return;
          }
          if (pendingMultiSelectElements.length > 0) {
            pendingMultiSelectElements = [];
            return;
          }
          if (pendingAnnotation) {
            // Let popup handle
          } else if (isActive) {
            hideTooltipsUntilMouseLeave();
            isActive = false;
          }
        }

        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "f" || e.key === "F")) {
          e.preventDefault();
          hideTooltipsUntilMouseLeave();
          if (isActive) deactivate();
          else isActive = true;
          return;
        }

        if (isTyping || e.metaKey || e.ctrlKey) return;

        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          hideTooltipsUntilMouseLeave();
          toggleFreeze();
        }
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          hideTooltipsUntilMouseLeave();
          if (isDrawMode) isDrawMode = false;
          if (showSettings) showSettings = false;
          if (pendingAnnotation) cancelAnnotation();
          if (isDesignMode) closeDesignMode();
          else isDesignMode = true;
        }
        if (e.key === "h" || e.key === "H") {
          if (annotations.length > 0) {
            e.preventDefault();
            hideTooltipsUntilMouseLeave();
            showMarkers = !showMarkers;
          }
        }
        if (e.key === "c" || e.key === "C") {
          if (annotations.length > 0 || designPlacements.length > 0 || rearrangeState) {
            e.preventDefault();
            hideTooltipsUntilMouseLeave();
            copyOutput();
          }
        }
        if (e.key === "x" || e.key === "X") {
          if (annotations.length > 0 || designPlacements.length > 0 || rearrangeState) {
            e.preventDefault();
            hideTooltipsUntilMouseLeave();
            clearAll();
            if (designPlacements.length > 0) designPlacements = [];
            if (rearrangeState) rearrangeState = null;
          }
        }
        if (e.key === "s" || e.key === "S") {
          const hasValidWebhook = isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || "");
          if (annotations.length > 0 && hasValidWebhook && sendState === "idle") {
            e.preventDefault();
            hideTooltipsUntilMouseLeave();
            sendToWebhook();
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }),
  );
</script>

{#snippet markerItem(annotation: Annotation, layerIndex: number, layerSize: number)}
  <AnnotationMarker
    {annotation}
    globalIndex={visibleAnnotations.findIndex((a) => a.id === annotation.id)}
    {layerIndex}
    {layerSize}
    isExiting={markersExiting}
    {isClearing}
    isAnimated={animatedMarkers.has(annotation.id)}
    isHovered={!markersExiting && hoveredMarkerId === annotation.id}
    isDeleting={deletingMarkerId === annotation.id}
    isEditingAny={!!editingAnnotation}
    {renumberFrom}
    markerClickBehavior={settings.markerClickBehavior}
    tooltipStyle={getTooltipPosition(annotation)}
    onHoverEnter={(a: Annotation) =>
      !markersExiting && a.id !== recentlyAddedId && handleMarkerHover(a)}
    onHoverLeave={() => handleMarkerHover(null)}
    onClick={(a: Annotation) =>
      settings.markerClickBehavior === "delete" ? deleteAnnotation(a.id) : startEditAnnotation(a)}
    onContextMenu={startEditAnnotation}
  />
{/snippet}

{#if mounted && !isToolbarHidden}
  <!--
    Rendered inline (NOT portaled to <body>). Svelte 5 uses event delegation
    rooted at the app mount point; physically moving this subtree out of that
    root (as a portal action does) silently breaks every onclick/oninput inside
    the toolbar. The toolbar's surfaces are position:fixed with a very high
    z-index, so inline rendering escapes normal stacking. Mount <Agentation />
    near the app root and avoid transformed/filtered ancestors.
  -->
  <div
    bind:this={portalWrapper}
    style="display: contents"
    data-agentation-theme={isDarkMode ? "dark" : "light"}
    data-agentation-accent={settings.annotationColorId}
    data-agentation-root=""
  >
    <!-- Toolbar -->
    <div
      class={`${styles.toolbar}${userClassName ? ` ${userClassName}` : ""}`}
      data-feedback-toolbar
      data-agentation-toolbar
      style={toolbarPosition
        ? `left: ${toolbarPosition.x}px; top: ${toolbarPosition.y}px; right: auto; bottom: auto;`
        : undefined}
    >
      <!-- Morphing container -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class={`${styles.toolbarContainer} ${isActive ? styles.expanded : styles.collapsed} ${showEntranceAnimation ? styles.entrance : ""} ${isToolbarHiding ? styles.hiding : ""} ${!settings.webhooksEnabled && (isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || "")) ? styles.serverConnected : ""}`}
        onclick={(e) => {
          if (!isActive) {
            if (justFinishedToolbarDrag) {
              justFinishedToolbarDrag = false;
              e.preventDefault();
              return;
            }
            isActive = true;
          }
        }}
        onmousedown={handleToolbarMouseDown}
        role={!isActive ? "button" : undefined}
        tabindex={!isActive ? 0 : -1}
        title={!isActive ? "Start feedback mode" : undefined}
      >
        <!-- Toggle content - collapsed -->
        <div class={`${styles.toggleContent} ${!isActive ? styles.visible : styles.hidden}`}>
          <IconListSparkle size={24} />
          {#if hasVisibleAnnotations}
            <span
              class={`${styles.badge} ${isActive ? styles.fadeOut : ""} ${showEntranceAnimation ? styles.entrance : ""}`}
            >
              {visibleAnnotations.length}
            </span>
          {/if}
        </div>

        <!-- Controls content - expanded -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={`${styles.controlsContent} ${isActive ? styles.visible : styles.hidden} ${toolbarPosition && toolbarPosition.y < 100 ? styles.tooltipBelow : ""} ${tooltipsHidden || showSettings ? styles.tooltipsHidden : ""} ${tooltipSessionActive ? styles.tooltipsInSession : ""}`}
          onmouseenter={handleControlsMouseEnter}
          onmouseleave={handleControlsMouseLeave}
        >
          <div
            class={`${styles.buttonWrapper} ${toolbarPosition && toolbarPosition.x < 120 ? styles.buttonWrapperAlignLeft : ""}`}
          >
            <button
              class={styles.controlButton}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                toggleFreeze();
              }}
              data-active={isFrozen}
            >
              <IconPausePlayAnimated size={24} isPaused={isFrozen} />
            </button>
            <span class={styles.buttonTooltip}>
              {isFrozen ? "Resume animations" : "Pause animations"}
              <span class={styles.shortcut}>P</span>
            </span>
          </div>

          <div class={styles.buttonWrapper}>
            <button
              class={`${styles.controlButton} ${!isDarkMode ? styles.light : ""}`}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                if (isDrawMode) isDrawMode = false;
                if (showSettings) showSettings = false;
                if (pendingAnnotation) cancelAnnotation();
                if (isDesignMode) closeDesignMode();
                else isDesignMode = true;
              }}
              data-active={isDesignMode}
              style={isDesignMode && blankCanvas
                ? "color: #f97316; background: rgba(249, 115, 22, 0.25);"
                : undefined}
            >
              <IconLayout size={21} />
            </button>
            <span class={styles.buttonTooltip}>
              {isDesignMode ? "Exit layout mode" : "Layout mode"}
              <span class={styles.shortcut}>L</span>
            </span>
          </div>

          <div class={styles.buttonWrapper}>
            <button
              class={styles.controlButton}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                showMarkers = !showMarkers;
              }}
              disabled={!hasAnnotations || isDesignMode}
            >
              <IconEyeAnimated size={24} isOpen={showMarkers} />
            </button>
            <span class={styles.buttonTooltip}>
              {showMarkers ? "Hide markers" : "Show markers"}
              <span class={styles.shortcut}>H</span>
            </span>
          </div>

          <div class={styles.buttonWrapper}>
            <button
              class={`${styles.controlButton} ${copied ? styles.statusShowing : ""}`}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                copyOutput();
              }}
              disabled={isDesignMode && blankCanvas
                ? designPlacements.length === 0 && !rearrangeState?.sections?.length
                : !hasAnnotations &&
                  drawStrokes.length === 0 &&
                  designPlacements.length === 0 &&
                  !rearrangeState?.sections?.length}
              data-active={copied}
            >
              <IconCopyAnimated
                size={24}
                {copied}
                tint={isDesignMode &&
                blankCanvas &&
                (designPlacements.length > 0 || !!rearrangeState?.sections?.length)
                  ? "#f97316"
                  : undefined}
              />
            </button>
            <span class={styles.buttonTooltip}>
              {isDesignMode && blankCanvas ? "Copy layout" : "Copy feedback"}
              <span class={styles.shortcut}>C</span>
            </span>
          </div>

          <!-- Send button -->
          <div
            class={`${styles.buttonWrapper} ${styles.sendButtonWrapper} ${isActive && !settings.webhooksEnabled && (isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || "")) ? styles.sendButtonVisible : ""}`}
          >
            <button
              class={`${styles.controlButton} ${sendState === "sent" || sendState === "failed" ? styles.statusShowing : ""}`}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                sendToWebhook();
              }}
              disabled={!hasAnnotations ||
                (!isValidUrl(settings.webhookUrl) && !isValidUrl(webhookUrl || "")) ||
                sendState === "sending"}
              data-no-hover={sendState === "sent" || sendState === "failed"}
              tabindex={isValidUrl(settings.webhookUrl) || isValidUrl(webhookUrl || "") ? 0 : -1}
            >
              <IconSendArrow size={24} state={sendState} />
              {#if hasAnnotations && sendState === "idle"}
                <span class={styles.buttonBadge}>{annotations.length}</span>
              {/if}
            </button>
            <span class={styles.buttonTooltip}>
              Send Annotations
              <span class={styles.shortcut}>S</span>
            </span>
          </div>

          <div class={styles.buttonWrapper}>
            <button
              class={styles.controlButton}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                clearAll();
              }}
              disabled={!hasAnnotations &&
                drawStrokes.length === 0 &&
                designPlacements.length === 0 &&
                !rearrangeState?.sections?.length}
              data-danger
            >
              <IconTrashAlt size={24} />
            </button>
            <span class={styles.buttonTooltip}>
              Clear all
              <span class={styles.shortcut}>X</span>
            </span>
          </div>

          <div class={styles.buttonWrapper}>
            <button
              class={styles.controlButton}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                if (isDesignMode) closeDesignMode();
                showSettings = !showSettings;
              }}
            >
              <IconGear size={24} />
            </button>
            {#if endpoint && connectionStatus !== "disconnected"}
              <span
                class={`${styles.mcpIndicator} ${styles[connectionStatus]} ${showSettings ? styles.hidden : ""}`}
                title={connectionStatus === "connected" ? "MCP Connected" : "MCP Connecting..."}
              ></span>
            {/if}
            <span class={styles.buttonTooltip}>Settings</span>
          </div>

          <div class={styles.divider}></div>

          <div
            class={`${styles.buttonWrapper} ${toolbarPosition && typeof window !== "undefined" && toolbarPosition.x > window.innerWidth - 120 ? styles.buttonWrapperAlignRight : ""}`}
          >
            <button
              class={styles.controlButton}
              onclick={(e) => {
                e.stopPropagation();
                hideTooltipsUntilMouseLeave();
                deactivate();
              }}
            >
              <IconXmarkLarge size={24} />
            </button>
            <span class={styles.buttonTooltip}>
              Exit
              <span class={styles.shortcut}>Esc</span>
            </span>
          </div>
        </div>

        <!-- Layout Mode Palette -->
        <DesignPalette
          visible={isDesignMode && isActive}
          activeType={activeDesignComponent}
          onSelect={(type: DesignComponentType) => {
            activeDesignComponent = activeDesignComponent === type ? null : type;
          }}
          {isDarkMode}
          sectionCount={rearrangeState?.sections.length ?? 0}
          onDetectSections={() => {
            const sections = detectPageSections();
            const existing = rearrangeState?.sections ?? [];
            const existingSelectors = new Set(existing.map((s) => s.selector));
            const newSections = sections.filter((s) => !existingSelectors.has(s.selector));
            const merged = [...existing, ...newSections];
            const mergedOrder = [
              ...(rearrangeState?.originalOrder ?? []),
              ...newSections.map((s) => s.id),
            ];
            rearrangeState = { sections: merged, originalOrder: mergedOrder, detectedAt: Date.now() };
          }}
          placementCount={designPlacements.length}
          onClearPlacements={() => {
            designClearSignal += 1;
            rearrangeClearSignal += 1;
            originalSetTimeout(() => {
              rearrangeState = { sections: [], originalOrder: [], detectedAt: Date.now() };
            }, 200);
          }}
          {blankCanvas}
          onBlankCanvasChange={(on: boolean) => {
            const emptyRearrange = { sections: [], originalOrder: [], detectedAt: Date.now() };
            if (on) {
              exploreStash = { rearrange: rearrangeState, placements: designPlacements };
              rearrangeState = wireframeStash.rearrange || emptyRearrange;
              designPlacements = wireframeStash.placements;
              activeDesignComponent = null;
            } else {
              wireframeStash = { rearrange: rearrangeState, placements: designPlacements };
              rearrangeState = exploreStash.rearrange || emptyRearrange;
              designPlacements = exploreStash.placements;
            }
            blankCanvas = on;
          }}
          {wireframePurpose}
          onWireframePurposeChange={(v: string) => (wireframePurpose = v)}
          Tooltip={HelpTooltip}
          onDragStart={(type: DesignComponentType, e: MouseEvent) => {
            e.preventDefault();
            const def = DEFAULT_SIZES[type];
            let preview: HTMLDivElement | null = null;
            let didDrag = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const toolbar = (e.target as HTMLElement).closest("[data-feedback-toolbar]");
            const toolbarTop = toolbar?.getBoundingClientRect().top ?? window.innerHeight;
            const onMove = (ev: MouseEvent) => {
              const dx = ev.clientX - startX;
              const dy = ev.clientY - startY;
              if (!didDrag && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                didDrag = true;
                preview = document.createElement("div");
                preview.className = `${designStyles.dragPreview}${blankCanvas ? ` ${designStyles.dragPreviewWireframe}` : ""}`;
                document.body.appendChild(preview);
              }
              if (!preview) return;
              const dist = Math.max(0, toolbarTop - ev.clientY);
              const progress = Math.min(1, dist / 180);
              const eased = 1 - Math.pow(1 - progress, 2);
              const minW = 28;
              const minH = 20;
              const maxW = Math.min(140, def.width * 0.18);
              const maxH = Math.min(90, def.height * 0.18);
              const w = minW + (maxW - minW) * eased;
              const h = minH + (maxH - minH) * eased;
              preview.style.width = `${w}px`;
              preview.style.height = `${h}px`;
              preview.style.left = `${ev.clientX - w / 2}px`;
              preview.style.top = `${ev.clientY - h / 2}px`;
              preview.style.opacity = `${0.5 + 0.5 * eased}`;
              preview.textContent = eased > 0.25 ? type : "";
            };
            const onUp = (ev: MouseEvent) => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
              if (preview) document.body.removeChild(preview);
              if (didDrag) {
                const w = def.width;
                const h = def.height;
                const sy = window.scrollY;
                const x = Math.max(0, ev.clientX - w / 2);
                const y = Math.max(0, ev.clientY + sy - h / 2);
                const placement: DesignPlacement = {
                  id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  type,
                  x,
                  y,
                  width: w,
                  height: h,
                  scrollY: sy,
                  timestamp: Date.now(),
                };
                designPlacements = [...designPlacements, placement];
                activeDesignComponent = null;
                designSelectedIds = new Set();
                designDeselectSignal += 1;
              }
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />

        <SettingsPanel
          {settings}
          onSettingsChange={(patch) => (settings = { ...settings, ...patch })}
          {isDarkMode}
          onToggleTheme={toggleTheme}
          {isDevMode}
          {connectionStatus}
          {endpoint}
          isVisible={showSettingsVisible}
          toolbarNearBottom={!!toolbarPosition && toolbarPosition.y < 230}
          {settingsPage}
          onSettingsPageChange={(p) => (settingsPage = p)}
          onHideToolbar={hideToolbarTemporarily}
        />
      </div>
    </div>

    <!-- Blank canvas backdrop -->
    {#if isDesignMode || designOverlayExiting}
      <div
        class={`${designStyles.blankCanvas} ${canvasReady ? designStyles.visible : ""} ${designInteracting ? designStyles.gridActive : ""}`}
        style={`--canvas-opacity: ${canvasOpacity}`}
        data-feedback-toolbar
      ></div>
    {/if}

    <!-- Wireframe hint -->
    {#if isDesignMode && blankCanvas && canvasReady}
      <div class={designStyles.wireframeNotice} data-feedback-toolbar>
        <div class={designStyles.wireframeOpacityRow}>
          <span class={designStyles.wireframeOpacityLabel}>Toggle Opacity</span>
          <input
            type="range"
            class={designStyles.wireframeOpacitySlider}
            min={0}
            max={1}
            step={0.01}
            value={canvasOpacity}
            oninput={(e) => (canvasOpacity = Number(e.currentTarget.value))}
          />
        </div>
        <div class={designStyles.wireframeNoticeTitleRow}>
          <span class={designStyles.wireframeNoticeTitle}>Wireframe Mode</span>
          <span class={designStyles.wireframeNoticeDivider}></span>
          <button
            class={designStyles.wireframeStartOver}
            onclick={() => {
              designClearSignal += 1;
              rearrangeState = { sections: [], originalOrder: [], detectedAt: Date.now() };
              wireframeStash = { rearrange: null, placements: [] };
              wireframePurpose = "";
              clearWireframeState(pathname);
            }}
          >
            Start Over
          </button>
        </div>
        Drag components onto the canvas.<br />Copied output will only include the wireframed layout.
      </div>
    {/if}

    <!-- Layout mode overlay -->
    {#if isDesignMode || designOverlayExiting}
      <DesignMode
        placements={designPlacements}
        onChange={(p) => (designPlacements = p)}
        activeComponent={designOverlayExiting ? null : activeDesignComponent}
        onActiveComponentChange={(c) => (activeDesignComponent = c)}
        {isDarkMode}
        exiting={designOverlayExiting}
        onInteractionChange={(v) => (designInteracting = v)}
        passthrough={!activeDesignComponent}
        extraSnapRects={rearrangeState?.sections.map((s) => s.currentRect)}
        deselectSignal={designDeselectSignal}
        clearSignal={designClearSignal}
        wireframe={blankCanvas}
        onSelectionChange={(ids, isShift) => {
          designSelectedIds = ids;
          if (!isShift) {
            rearrangeSelectedIds = new Set();
            rearrangeDeselectSignal += 1;
          }
        }}
        onDragMove={(dx, dy) => {
          const selIds = rearrangeSelectedIds;
          if (!selIds.size || !rearrangeState) return;
          if (!crossDragStart) {
            crossDragStart = new Map();
            for (const s of rearrangeState.sections) {
              if (selIds.has(s.id))
                crossDragStart.set(s.id, { x: s.currentRect.x, y: s.currentRect.y });
            }
          }
          for (const s of rearrangeState.sections) {
            if (!selIds.has(s.id)) continue;
            const start = crossDragStart.get(s.id);
            if (!start) continue;
            const outlineEl = document.querySelector(
              `[data-rearrange-section="${s.id}"]`,
            ) as HTMLElement | null;
            if (outlineEl) outlineEl.style.transform = `translate(${dx}px, ${dy}px)`;
          }
        }}
        onDragEnd={(dx, dy, committed) => {
          const selIds = rearrangeSelectedIds;
          const starts = crossDragStart;
          crossDragStart = null;
          if (!selIds.size || !rearrangeState || !starts) return;
          for (const id of selIds) {
            const el = document.querySelector(
              `[data-rearrange-section="${id}"]`,
            ) as HTMLElement | null;
            if (el) el.style.transform = "";
          }
          if (committed) {
            rearrangeState = {
              ...rearrangeState,
              sections: rearrangeState.sections.map((s) => {
                const start = starts.get(s.id);
                if (!start) return s;
                return {
                  ...s,
                  currentRect: {
                    ...s.currentRect,
                    x: Math.max(0, start.x + dx),
                    y: Math.max(0, start.y + dy),
                  },
                };
              }),
            };
          }
        }}
      />
    {/if}

    <!-- Rearrange overlay -->
    {#if (isDesignMode || designOverlayExiting) && rearrangeState}
      <RearrangeOverlay
        {rearrangeState}
        onChange={(s) => (rearrangeState = s)}
        {isDarkMode}
        exiting={designOverlayExiting}
        {blankCanvas}
        extraSnapRects={designPlacements.map((p) => ({
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
        }))}
        clearSignal={rearrangeClearSignal}
        deselectSignal={rearrangeDeselectSignal}
        onSelectionChange={(ids, isShift) => {
          rearrangeSelectedIds = ids;
          if (!isShift) {
            designSelectedIds = new Set();
            designDeselectSignal += 1;
          }
        }}
        onDragMove={(dx, dy) => {
          const selIds = designSelectedIds;
          if (!selIds.size) return;
          if (!crossDragStart) {
            crossDragStart = new Map();
            for (const p of designPlacements) {
              if (selIds.has(p.id)) crossDragStart.set(p.id, { x: p.x, y: p.y });
            }
          }
          for (const id of selIds) {
            const el = document.querySelector(
              `[data-design-placement="${id}"]`,
            ) as HTMLElement | null;
            if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
          }
        }}
        onDragEnd={(dx, dy, committed) => {
          const selIds = designSelectedIds;
          const starts = crossDragStart;
          crossDragStart = null;
          if (!selIds.size || !starts) return;
          for (const id of selIds) {
            const el = document.querySelector(
              `[data-design-placement="${id}"]`,
            ) as HTMLElement | null;
            if (el) el.style.transform = "";
          }
          if (committed) {
            designPlacements = designPlacements.map((p) => {
              const start = starts.get(p.id);
              if (!start) return p;
              return { ...p, x: Math.max(0, start.x + dx), y: Math.max(0, start.y + dy) };
            });
          }
        }}
      />
    {/if}

    <!-- Draw canvas -->
    <canvas
      bind:this={drawCanvas}
      class={`${styles.drawCanvas} ${isDrawMode ? styles.active : ""}`}
      style={`opacity: ${shouldShowMarkers ? 1 : 0}; transition: opacity 0.15s ease;`}
      data-feedback-toolbar
    ></canvas>

    <!-- Markers layer (normal) -->
    <div class={styles.markersLayer} data-feedback-toolbar>
      {#if markersVisible}
        {@const normalMarkers = visibleAnnotations.filter((a) => !a.isFixed)}
        {#each normalMarkers as annotation, layerIndex (annotation.id)}
          {@render markerItem(annotation, layerIndex, normalMarkers.length)}
        {/each}
      {/if}
      {#if markersVisible && !markersExiting}
        {#each exitingAnnotationsList.filter((a) => !a.isFixed) as a (a.id)}
          <ExitingMarker annotation={a} />
        {/each}
      {/if}
    </div>

    <!-- Fixed markers layer -->
    <div class={styles.fixedMarkersLayer} data-feedback-toolbar>
      {#if markersVisible}
        {@const fixedMarkers = visibleAnnotations.filter((a) => a.isFixed)}
        {#each fixedMarkers as annotation, layerIndex (annotation.id)}
          {@render markerItem(annotation, layerIndex, fixedMarkers.length)}
        {/each}
      {/if}
      {#if markersVisible && !markersExiting}
        {#each exitingAnnotationsList.filter((a) => a.isFixed) as a (a.id)}
          <ExitingMarker annotation={a} fixed />
        {/each}
      {/if}
    </div>

    <!-- Interactive overlay -->
    {#if isActive}
      <div
        class={styles.overlay}
        data-feedback-toolbar
        style={pendingAnnotation || editingAnnotation ? "z-index: 99999;" : undefined}
      >
        <!-- Hover highlight -->
        {#if hoverInfo?.rect && !pendingAnnotation && !isScrolling && !isDragging}
          <div
            class={`${styles.hoverHighlight} ${styles.enter}`}
            style={`left: ${hoverInfo.rect.left}px; top: ${hoverInfo.rect.top}px; width: ${hoverInfo.rect.width}px; height: ${hoverInfo.rect.height}px; border-color: color-mix(in srgb, var(--agentation-color-accent) 50%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 4%, transparent);`}
          ></div>
        {/if}

        <!-- Cmd+shift+click multi-select highlights -->
        {#each pendingMultiSelectElements.filter((item) => document.contains(item.element)) as item, index (index)}
          {@const rect = item.element.getBoundingClientRect()}
          {@const isMulti = pendingMultiSelectElements.length > 1}
          <div
            class={isMulti ? styles.multiSelectOutline : styles.singleSelectOutline}
            style={`position: fixed; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;${isMulti ? "" : " border-color: color-mix(in srgb, var(--agentation-color-accent) 60%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 5%, transparent);"}`}
          ></div>
        {/each}

        <!-- Marker hover outline -->
        {#if hoveredMarkerId && !pendingAnnotation}
          {@const hoveredAnnotation = annotations.find((a) => a.id === hoveredMarkerId)}
          {#if hoveredAnnotation?.boundingBox}
            {#if hoveredAnnotation.elementBoundingBoxes?.length}
              {#if hoveredTargetElements.length > 0}
                {#each hoveredTargetElements.filter((el) => document.contains(el)) as el, index (index)}
                  {@const rect = el.getBoundingClientRect()}
                  <div
                    class={`${styles.multiSelectOutline} ${styles.enter}`}
                    style={`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`}
                  ></div>
                {/each}
              {:else}
                {#each hoveredAnnotation.elementBoundingBoxes as bb, index (index)}
                  <div
                    class={`${styles.multiSelectOutline} ${styles.enter}`}
                    style={`left: ${bb.x}px; top: ${bb.y - scrollY}px; width: ${bb.width}px; height: ${bb.height}px;`}
                  ></div>
                {/each}
              {/if}
            {:else}
              {@const liveRect =
                hoveredTargetElement && document.contains(hoveredTargetElement)
                  ? hoveredTargetElement.getBoundingClientRect()
                  : null}
              {@const bb = liveRect
                ? { x: liveRect.left, y: liveRect.top, width: liveRect.width, height: liveRect.height }
                : {
                    x: hoveredAnnotation.boundingBox.x,
                    y: hoveredAnnotation.isFixed
                      ? hoveredAnnotation.boundingBox.y
                      : hoveredAnnotation.boundingBox.y - scrollY,
                    width: hoveredAnnotation.boundingBox.width,
                    height: hoveredAnnotation.boundingBox.height,
                  }}
              <div
                class={`${hoveredAnnotation.isMultiSelect ? styles.multiSelectOutline : styles.singleSelectOutline} ${styles.enter}`}
                style={`left: ${bb.x}px; top: ${bb.y}px; width: ${bb.width}px; height: ${bb.height}px;${hoveredAnnotation.isMultiSelect ? "" : " border-color: color-mix(in srgb, var(--agentation-color-accent) 60%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 5%, transparent);"}`}
              ></div>
            {/if}
          {/if}
        {/if}

        <!-- Hover tooltip -->
        {#if hoverInfo && !pendingAnnotation && !isScrolling && !isDragging}
          <div
            class={`${styles.hoverTooltip} ${styles.enter}`}
            style={`left: ${Math.max(8, Math.min(hoverPosition.x, window.innerWidth - 100))}px; top: ${Math.max(hoverPosition.y - (hoverInfo.reactComponents ? 48 : 32), 8)}px;`}
          >
            {#if hoverInfo.reactComponents}
              <div class={styles.hoverReactPath}>{hoverInfo.reactComponents}</div>
            {/if}
            <div class={styles.hoverElementName}>{hoverInfo.elementName}</div>
          </div>
        {/if}

        <!-- Pending annotation -->
        {#if pendingAnnotation}
          {#if pendingAnnotation.multiSelectElements?.length}
            {#each pendingAnnotation.multiSelectElements.filter((el) => document.contains(el)) as el, index (index)}
              {@const rect = el.getBoundingClientRect()}
              <div
                class={`${styles.multiSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                style={`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`}
              ></div>
            {/each}
          {:else if pendingAnnotation.targetElement && document.contains(pendingAnnotation.targetElement)}
            {@const rect = pendingAnnotation.targetElement.getBoundingClientRect()}
            <div
              class={`${styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
              style={`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px; border-color: color-mix(in srgb, var(--agentation-color-accent) 60%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 5%, transparent);`}
            ></div>
          {:else if pendingAnnotation.boundingBox}
            <div
              class={`${pendingAnnotation.isMultiSelect ? styles.multiSelectOutline : styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
              style={`left: ${pendingAnnotation.boundingBox.x}px; top: ${pendingAnnotation.boundingBox.y - scrollY}px; width: ${pendingAnnotation.boundingBox.width}px; height: ${pendingAnnotation.boundingBox.height}px;${pendingAnnotation.isMultiSelect ? "" : " border-color: color-mix(in srgb, var(--agentation-color-accent) 60%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 5%, transparent);"}`}
            ></div>
          {/if}

          {@const markerX = pendingAnnotation.x}
          {@const markerY = pendingAnnotation.isFixed
            ? pendingAnnotation.y
            : pendingAnnotation.y - scrollY}
          <PendingMarker
            x={markerX}
            y={markerY}
            isMultiSelect={pendingAnnotation.isMultiSelect}
            isExiting={pendingExiting}
          />
          <AnnotationPopupCSS
            bind:this={popupRef}
            element={pendingAnnotation.element}
            selectedText={pendingAnnotation.selectedText}
            computedStyles={pendingAnnotation.computedStylesObj}
            placeholder={pendingAnnotation.element === "Area selection"
              ? "What should change in this area?"
              : pendingAnnotation.isMultiSelect
                ? "Feedback for this group of elements..."
                : "What should change?"}
            onSubmit={addAnnotation}
            onCancel={cancelAnnotation}
            isExiting={pendingExiting}
            lightMode={!isDarkMode}
            accentColor={pendingAnnotation.isMultiSelect
              ? "var(--agentation-color-green)"
              : "var(--agentation-color-accent)"}
            style={`left: ${Math.max(160, Math.min(window.innerWidth - 160, (markerX / 100) * window.innerWidth))}px; ${markerY > window.innerHeight - 290 ? `bottom: ${window.innerHeight - markerY + 20}px;` : `top: ${markerY + 20}px;`}`}
          />
        {/if}

        <!-- Edit annotation popup -->
        {#if editingAnnotation}
          {#if editingAnnotation.elementBoundingBoxes?.length}
            {#if editingTargetElements.length > 0}
              {#each editingTargetElements.filter((el) => document.contains(el)) as el, index (index)}
                {@const rect = el.getBoundingClientRect()}
                <div
                  class={`${styles.multiSelectOutline} ${styles.enter}`}
                  style={`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`}
                ></div>
              {/each}
            {:else}
              {#each editingAnnotation.elementBoundingBoxes as bb, index (index)}
                <div
                  class={`${styles.multiSelectOutline} ${styles.enter}`}
                  style={`left: ${bb.x}px; top: ${bb.y - scrollY}px; width: ${bb.width}px; height: ${bb.height}px;`}
                ></div>
              {/each}
            {/if}
          {:else}
            {@const liveRect =
              editingTargetElement && document.contains(editingTargetElement)
                ? editingTargetElement.getBoundingClientRect()
                : null}
            {@const bb = liveRect
              ? { x: liveRect.left, y: liveRect.top, width: liveRect.width, height: liveRect.height }
              : editingAnnotation.boundingBox
                ? {
                    x: editingAnnotation.boundingBox.x,
                    y: editingAnnotation.isFixed
                      ? editingAnnotation.boundingBox.y
                      : editingAnnotation.boundingBox.y - scrollY,
                    width: editingAnnotation.boundingBox.width,
                    height: editingAnnotation.boundingBox.height,
                  }
                : null}
            {#if bb}
              <div
                class={`${editingAnnotation.isMultiSelect ? styles.multiSelectOutline : styles.singleSelectOutline} ${styles.enter}`}
                style={`left: ${bb.x}px; top: ${bb.y}px; width: ${bb.width}px; height: ${bb.height}px;${editingAnnotation.isMultiSelect ? "" : " border-color: color-mix(in srgb, var(--agentation-color-accent) 60%, transparent); background-color: color-mix(in srgb, var(--agentation-color-accent) 5%, transparent);"}`}
              ></div>
            {/if}
          {/if}

          {@const editMarkerY = editingAnnotation.isFixed
            ? editingAnnotation.y
            : editingAnnotation.y - scrollY}
          <AnnotationPopupCSS
            bind:this={editPopupRef}
            element={editingAnnotation.element}
            selectedText={editingAnnotation.selectedText}
            computedStyles={parseComputedStylesString(editingAnnotation.computedStyles)}
            placeholder="Edit your feedback..."
            initialValue={editingAnnotation.comment}
            submitLabel="Save"
            onSubmit={updateAnnotation}
            onCancel={cancelEditAnnotation}
            onDelete={() => deleteAnnotation(editingAnnotation!.id)}
            isExiting={editExiting}
            lightMode={!isDarkMode}
            accentColor={editingAnnotation.isMultiSelect
              ? "var(--agentation-color-green)"
              : "var(--agentation-color-accent)"}
            style={`left: ${Math.max(160, Math.min(window.innerWidth - 160, (editingAnnotation.x / 100) * window.innerWidth))}px; ${editMarkerY > window.innerHeight - 290 ? `bottom: ${window.innerHeight - editMarkerY + 20}px;` : `top: ${editMarkerY + 20}px;`}`}
          />
        {/if}

        <!-- Drag selection -->
        {#if isDragging}
          <div bind:this={dragRectEl} class={styles.dragSelection}></div>
          <div bind:this={highlightsContainer} class={styles.highlightsContainer}></div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
