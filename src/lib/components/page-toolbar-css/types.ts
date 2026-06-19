// =============================================================================
// Toolbar shared types & config
// =============================================================================
// Extracted from the React toolbar so framework-agnostic utils (e.g.
// generate-output) can import these without depending on the .svelte component.

import type { Annotation } from "../../types.js";

export type OutputDetailLevel = "compact" | "standard" | "detailed" | "forensic";

// Component-detection mode, derived from outputDetail when detection is enabled.
// (Named "React*" for protocol/back-compat; in the Svelte port it drives Svelte
// component detection.)
export type ReactComponentMode = "smart" | "filtered" | "all" | "off";

export type MarkerClickBehavior = "edit" | "delete";

export type ToolbarSettings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColorId: string;
  blockInteractions: boolean;
  reactEnabled: boolean;
  markerClickBehavior: MarkerClickBehavior;
  webhookUrl: string;
  webhooksEnabled: boolean;
};

export const DEFAULT_SETTINGS: ToolbarSettings = {
  outputDetail: "standard",
  autoClearAfterCopy: false,
  annotationColorId: "blue",
  blockInteractions: true,
  reactEnabled: true,
  markerClickBehavior: "edit",
  webhookUrl: "",
  webhooksEnabled: true,
};

// Maps output detail level to component-detection mode.
export const OUTPUT_TO_REACT_MODE: Record<OutputDetailLevel, ReactComponentMode> = {
  compact: "off",
  standard: "filtered",
  detailed: "smart",
  forensic: "all",
};

export const COLOR_OPTIONS = [
  { id: "indigo", label: "Indigo", srgb: "#6155F5", p3: "color(display-p3 0.38 0.33 0.96)" },
  { id: "blue", label: "Blue", srgb: "#0088FF", p3: "color(display-p3 0.00 0.53 1.00)" },
  { id: "cyan", label: "Cyan", srgb: "#00C3D0", p3: "color(display-p3 0.00 0.76 0.82)" },
  { id: "green", label: "Green", srgb: "#34C759", p3: "color(display-p3 0.20 0.78 0.35)" },
  { id: "yellow", label: "Yellow", srgb: "#FFCC00", p3: "color(display-p3 1.00 0.80 0.00)" },
  { id: "orange", label: "Orange", srgb: "#FF8D28", p3: "color(display-p3 1.00 0.55 0.16)" },
  { id: "red", label: "Red", srgb: "#FF383C", p3: "color(display-p3 1.00 0.22 0.24)" },
];

/** Simple URL validation — checks for a valid http(s) URL format. */
export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/** Demo annotation descriptor — resolved against the DOM by selector. */
export type DemoAnnotation = {
  selector: string;
  comment: string;
  selectedText?: string;
};

export type PageFeedbackToolbarCSSProps = {
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  /** Callback fired when an annotation is added. */
  onAnnotationAdd?: (annotation: Annotation) => void;
  /** Callback fired when an annotation is deleted. */
  onAnnotationDelete?: (annotation: Annotation) => void;
  /** Callback fired when an annotation comment is edited. */
  onAnnotationUpdate?: (annotation: Annotation) => void;
  /** Callback fired when all annotations are cleared. Receives the annotations that were cleared. */
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  /** Callback fired when the copy button is clicked. Receives the markdown output. */
  onCopy?: (markdown: string) => void;
  /** Callback fired when "Send to Agent" is clicked. Receives the markdown output and annotations. */
  onSubmit?: (output: string, annotations: Annotation[]) => void;
  /** Whether to copy to clipboard when the copy button is clicked. Defaults to true. */
  copyToClipboard?: boolean;
  /** Server URL for sync (e.g., "http://localhost:4747"). If not provided, uses localStorage only. */
  endpoint?: string;
  /** Pre-existing session ID to join. If not provided with endpoint, creates a new session. */
  sessionId?: string;
  /** Called when a new session is created (only when endpoint is provided without sessionId). */
  onSessionCreated?: (sessionId: string) => void;
  /** Webhook URL to receive annotation events. */
  webhookUrl?: string;
  /** Custom class name applied to the toolbar container. Use to adjust positioning or z-index. */
  className?: string;
};

/** Alias for PageFeedbackToolbarCSSProps */
export type AgentationProps = PageFeedbackToolbarCSSProps;
