// =============================================================================
// Agentation (Svelte 5)
// =============================================================================
//
// A floating toolbar for annotating web pages and collecting structured feedback
// for AI coding agents.
//
// Usage:
//   import { Agentation } from 'agentation-svelte';
//   <Agentation />
//
// =============================================================================

// Main component — CSS-only toolbar (default export "Agentation").
export {
  Agentation,
  PageFeedbackToolbarCSS,
} from "./components/page-toolbar-css/index.js";
export type {
  DemoAnnotation,
  AgentationProps,
  PageFeedbackToolbarCSSProps,
  OutputDetailLevel,
  ReactComponentMode,
  ToolbarSettings,
} from "./components/page-toolbar-css/index.js";
export { COLOR_OPTIONS } from "./components/page-toolbar-css/index.js";

// Shared component for building custom UIs.
export { AnnotationPopupCSS } from "./components/annotation-popup-css/index.js";
export type {
  AnnotationPopupCSSProps,
  AnnotationPopupCSSHandle,
} from "./components/annotation-popup-css/index.js";

// Layout Mode component registry (developer-supplied component library).
export { builtinComponents } from "./components/design-mode/builtins.js";
export type {
  AgentationComponentDef,
  AgentationComponents,
  VariantSpec,
} from "./components/design-mode/registry.js";

// Icons (pure SVG Svelte components).
export * from "./components/icons/index.js";

// Utilities (for building custom UIs).
export {
  identifyElement,
  identifyAnimationElement,
  getElementPath,
  getNearbyText,
  getElementClasses,
  // Shadow DOM support
  isInShadowDOM,
  getShadowHost,
  closestCrossingShadow,
} from "./utils/element-identification.js";

export {
  loadAnnotations,
  saveAnnotations,
  getStorageKey,
} from "./utils/storage.js";

// Shared types
export type {
  Annotation,
  AnnotationIntent,
  AnnotationSeverity,
  AnnotationStatus,
  Session,
  SessionStatus,
  SessionWithAnnotations,
  ThreadMessage,
} from "./types.js";
