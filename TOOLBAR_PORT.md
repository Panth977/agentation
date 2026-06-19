# Main toolbar port — integration contract

Source: `../agentation-react/package/src/components/page-toolbar-css/index.tsx` (4709 lines)
Target: `src/lib/components/page-toolbar-css/Agentation.svelte` (+ keep `types.ts` already created)

The toolbar is the integration point. Everything else is already ported and
type-checks. Port the WHOLE component faithfully (Svelte 5 runes). Below is the
exact contract so nothing is recreated and integration is clean.

## Public API (preserve EXACTLY)

- Default export equivalent: component `Agentation.svelte`.
- Props = `PageFeedbackToolbarCSSProps` (aliased `AgentationProps`). All optional:
  `demoAnnotations?, demoDelay=1000, enableDemoMode=false, onAnnotationAdd?,
  onAnnotationDelete?, onAnnotationUpdate?, onAnnotationsClear?, onCopy?,
  onSubmit?, copyToClipboard=true, endpoint?, sessionId?, onSessionCreated?,
  webhookUrl?, className?` (note: `sessionId` is destructured as `initialSessionId`,
  `className` as `userClassName`).
- `DemoAnnotation` type = `{ selector: string; comment: string; selectedText?: string }`.
  (Already present in `./types.ts` is a DIFFERENT DemoAnnotation = Annotation & {isDemo?}.
   Reconcile: the PUBLIC prop type is the `{selector,comment,selectedText?}` shape —
   keep that name for the public API; rename the internal one if it conflicts.)
- Export `PageFeedbackToolbarCSSProps`, `AgentationProps`, `DemoAnnotation`,
  `OutputDetailLevel`, `ReactComponentMode`, `ToolbarSettings`, `COLOR_OPTIONS`
  from a sibling `types.ts` / barrel `index.ts` so `src/lib/index.ts` can re-export.
  (The shared config types already live in `./types.ts` — reuse, don't duplicate.)

## Already-ported imports (DO NOT recreate — use these paths)

Components:
- `import AnnotationPopupCSS from "../annotation-popup-css/AnnotationPopupCSS.svelte"`
  (instance method `shake()` via `bind:this`; props per AnnotationPopupCSSProps)
- `import { AnnotationMarker, PendingMarker, ExitingMarker } from "./annotation-marker/index.js"`
- `import { SettingsPanel } from "./settings-panel/index.js"`
- `import DesignMode from "../design-mode/DesignMode.svelte"`
- `import DesignPalette from "../design-mode/DesignPalette.svelte"`
- `import RearrangeOverlay from "../design-mode/RearrangeOverlay.svelte"`
- Icons: `import IconX from "../icons/IconX.svelte"` (names per PORTING.md icon list:
  IconListSparkle, IconGear, IconCopyAnimated, IconSendArrow, IconTrashAlt,
  IconEyeAnimated, IconPausePlayAnimated, IconXmarkLarge, IconEdit,
  IconChevronLeft, IconChevronRight, IconLayout, etc.)
- Tooltip/HelpTooltip from `../tooltip/Tooltip.svelte`, `../help-tooltip/HelpTooltip.svelte`.

Shared config/types: `./types.js` →
`OutputDetailLevel, ReactComponentMode, MarkerClickBehavior, ToolbarSettings,
DEFAULT_SETTINGS, OUTPUT_TO_REACT_MODE, COLOR_OPTIONS, isValidUrl`.
(The React source defines these inline at lines 142-186 + injectAgentationColorTokens
at 198-227. Reuse from ./types.js; port `injectAgentationColorTokens` into the
component module — keep it, it injects accent CSS vars on load.)

Design-mode logic: `../design-mode/output.js` (generateDesignOutput,
generateRearrangeOutput), `../design-mode/section-detection.js` (detectPageSections),
`../design-mode/types.js` (DEFAULT_SIZES, DesignPlacement, ComponentType as
DesignComponentType, RearrangeState).

Utils:
- `$lib/utils/element-identification.js`: identifyElement, getNearbyText,
  getElementClasses, getDetailedComputedStyles, getForensicComputedStyles,
  parseComputedStylesString, getFullElementPath, getAccessibilityInfo,
  getNearbyElements, closestCrossingShadow.
- `$lib/utils/storage.js`: loadAnnotations, loadAllAnnotations, saveAnnotations,
  getStorageKey, loadSessionId, saveSessionId, clearSessionId,
  saveAnnotationsWithSyncMarker, loadDesignPlacements, saveDesignPlacements,
  clearDesignPlacements, loadRearrangeState, saveRearrangeState,
  clearRearrangeState, loadWireframeState, saveWireframeState, clearWireframeState,
  loadToolbarHidden, saveToolbarHidden.
- `$lib/utils/sync.js`: createSession, getSession, syncAnnotation,
  updateAnnotation (as updateAnnotationOnServer), deleteAnnotation (as
  deleteAnnotationFromServer).
- `$lib/utils/generate-output.js`: generateOutput.
- `$lib/utils/freeze-animations.js`: freeze (as freezeAll), unfreeze (as
  unfreezeAll), originalSetTimeout, originalSetInterval,
  originalRequestAnimationFrame.

## Component detection — ADAPT call sites (signatures changed in the Svelte rework)

`$lib/utils/component-detection.js` replaces React's react-detection + source-location.
New signatures:
- `getReactComponentName(el, { mode }): { name: string|null; path: string|null }`
  → SAME as before. `identifyElementWithReact` (source lines 97-125) ports unchanged
  (uses `reactInfo.path`).
- `getSourceLocation(el): SourceLocation | null`
- `findNearestComponentSource(el): SourceLocation | null`
- `formatSourceLocation(loc): string`  (ONE arg, returns "file:line")

So `detectSourceFile` (source lines 269-276) must be rewritten as:
```ts
function detectSourceFile(element: Element): string | undefined {
  const result = getSourceLocation(element as HTMLElement);
  const loc = result ?? findNearestComponentSource(element as HTMLElement);
  return loc ? formatSourceLocation(loc) : undefined;
}
```

## Svelte translation notes specific to the toolbar

- `"use client"` → drop. Module-level `hasPlayedEntranceAnimation` flag → keep as
  module-level `let`. `injectAgentationColorTokens()` call on module load → keep.
- Many `useState` → `$state`; refs → `bind:this` or plain `let`; `useEffect`/
  `useLayoutEffect` → `$effect`/`$effect.pre` (replicate the dependency intent);
  `useCallback`/`useMemo` → functions/`$derived`.
- `createPortal(node, document.body)` → `use:portal` (from `$lib/actions/portal.js`).
- Child instance method: render `<AnnotationPopupCSS bind:this={popupRef} .../>`
  and call `popupRef.shake()`.
- `className={styles.x}` → `class={styles.x}`; `style={{...}}` → style string or
  `style:` directives; `.map` → `{#each}`; `&&`/ternary render → `{#if}`.
- Global listeners (mousemove/keydown/scroll/resize/clipboard), MutationObserver,
  ResizeObserver, and freeze/unfreeze — attach in `$effect`, detach in cleanup.
- Preserve EVERYTHING: activation toggle + entrance animation, hover highlight
  + element identification, click-to-annotate, drag multi-select, marker
  rendering/renumber/exit, popup add/edit, copy (+ clipboard) / send-to-agent /
  webhook, clear-all, settings panel + persisted settings, theme (light/dark)
  detection + toggle, block-interactions overlay, server sync (session create/
  join, per-annotation sync/update/delete), design mode (placement) + palette +
  rearrange overlay + wireframe/blank-canvas, demo mode, hide-until-restart,
  output detail levels, accent color tokens.

## Verify

`cd /Users/panth977/Dev/npm-package/agentation/agentation-svelte && pnpm exec svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -15`
Then wire `src/lib/index.ts` exports and run `pnpm exec vite build` + `pnpm package`.
