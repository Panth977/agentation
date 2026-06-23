// =============================================================================
// Layout Mode — developer component registry
// =============================================================================
// The single interface between Agentation and the developer's component library.
// See docs/LAYOUT_MODE_REGISTRY.md.

import type { Component, Snippet } from "svelte";

export type VariantSpec =
  | string[] // shorthand enum: ["primary","ghost"]
  | { type: "enum"; options: string[]; default?: string }
  | { type: "boolean"; default?: boolean }
  | { type: "number"; min?: number; max?: number; step?: number; default?: number }
  | { type: "text"; default?: string };

/**
 * How a component sizes on the canvas, per axis:
 *  - "intrinsic" (default): the component defines its own size on that axis. It
 *    renders at its natural measured size and the axis is LOCKED — no resize
 *    handle (e.g. a DatePicker, Button, Badge whose width/height come from the
 *    component itself).
 *  - "fluid": the component fills the placement box on that axis and IS
 *    resizable (e.g. a Navbar's width, a Card or Grid). Fluid axes start at
 *    `defaultSize` (or a sensible default) since there's no natural size.
 */
export type AxisSizing = "intrinsic" | "fluid";
export type AgentationSizing = AxisSizing | { width?: AxisSizing; height?: AxisSizing };

export type AgentationComponentDef = {
  /** Display name in the palette + registry key (should be unique). */
  label: string;
  /** The real component → rendered as the palette icon AND on the canvas. */
  component?: Component<any>;
  /**
   * Import source, e.g. "$lib/ui/Button.svelte" or "@acme/ui". NOT used to
   * render — injected into the agent output so the agent knows where to import.
   */
  src?: string;
  /** Palette section + search facet (or use the grouped-object registry form). */
  group?: string;
  /** What the component is for — palette tooltip AND sent to the agent. */
  description?: string;
  /** Extra search terms. */
  keywords?: string[];
  /** Configurable variants — chosen in the inspector, included in agent output. */
  variants?: Record<string, VariantSpec>;
  /** Props always passed to `component`. */
  defaultProps?: Record<string, unknown>;
  /** Map chosen variant values -> component props. Default: identity. */
  toProps?: (values: Record<string, unknown>) => Record<string, unknown>;
  /** Escape hatch: full render control (children/context). Used instead of `component`. */
  preview?: Snippet<[values: Record<string, unknown>]>;
  /**
   * Canvas sizing behaviour. Default: "intrinsic" on both axes (the component
   * sizes itself; the axis is locked / not resizable). Use "fluid" — or a
   * per-axis object like `{ width: "fluid", height: "intrinsic" }` for a navbar —
   * to let the component fill (and be resized within) the placement box.
   */
  sizing?: AgentationSizing;
  /** Initial px size for FLUID axes only (intrinsic axes are auto-measured). */
  defaultSize?: { width?: number; height?: number };
};

export type AgentationComponents =
  | AgentationComponentDef[]
  | Record<string, AgentationComponentDef[]>;

export type NormalizedDef = AgentationComponentDef & { key: string; group: string };
export type NormalizedSection = { section: string; items: NormalizedDef[] };
export type NormalizedRegistry = {
  sections: NormalizedSection[];
  byKey: Record<string, NormalizedDef>;
};

/** Flatten a flat|grouped registry into ordered sections + a key lookup. */
export function normalizeRegistry(components: AgentationComponents): NormalizedRegistry {
  const sections: NormalizedSection[] = [];
  const byKey: Record<string, NormalizedDef> = {};
  const sectionMap = new Map<string, NormalizedDef[]>();
  const used = new Set<string>();

  const add = (def: AgentationComponentDef, groupHint?: string) => {
    const group = def.group || groupHint || "Components";
    // Stable unique key: prefer label, fall back to group/label, then suffix.
    let key = def.label;
    if (used.has(key)) key = `${group}/${def.label}`;
    let n = 2;
    while (used.has(key)) key = `${group}/${def.label} ${n++}`;
    used.add(key);

    const norm: NormalizedDef = { ...def, key, group };
    byKey[key] = norm;
    if (!sectionMap.has(group)) {
      const items: NormalizedDef[] = [];
      sectionMap.set(group, items);
      sections.push({ section: group, items });
    }
    sectionMap.get(group)!.push(norm);
  };

  if (Array.isArray(components)) {
    for (const def of components) add(def);
  } else {
    for (const [group, defs] of Object.entries(components)) {
      for (const def of defs) add(def, group);
    }
  }
  return { sections, byKey };
}

// -----------------------------------------------------------------------------
// Variant helpers
// -----------------------------------------------------------------------------

export function variantKind(spec: VariantSpec): "enum" | "boolean" | "number" | "text" {
  return Array.isArray(spec) ? "enum" : spec.type;
}

export function variantOptions(spec: VariantSpec): string[] {
  if (Array.isArray(spec)) return spec;
  if (spec.type === "enum") return spec.options;
  return [];
}

export function variantDefault(spec: VariantSpec): unknown {
  if (Array.isArray(spec)) return spec[0];
  switch (spec.type) {
    case "enum":
      return spec.default ?? spec.options[0];
    case "boolean":
      return spec.default ?? false;
    case "number":
      return spec.default ?? spec.min ?? 0;
    case "text":
      return spec.default ?? "";
  }
}

export function defaultVariantValues(def: AgentationComponentDef): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (def.variants) {
    for (const [k, spec] of Object.entries(def.variants)) out[k] = variantDefault(spec);
  }
  return out;
}

/** Merge defaultProps with the variant→prop mapping (identity by default). */
export function resolveProps(
  def: AgentationComponentDef,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const mapped = def.toProps ? def.toProps(values) : values;
  return { ...(def.defaultProps ?? {}), ...mapped };
}

/** Human-readable variant string for output, e.g. "intent=primary, size=lg". */
export function formatVariants(values: Record<string, unknown> | undefined): string {
  if (!values) return "";
  const parts = Object.entries(values)
    .filter(([, v]) => v !== undefined && v !== "" && v !== false)
    .map(([k, v]) => `${k}=${v}`);
  return parts.join(", ");
}

// -----------------------------------------------------------------------------
// Auto-measured sizes (populated by ComponentPreview when palette tiles mount)
// -----------------------------------------------------------------------------

export const FALLBACK_SIZE = { width: 240, height: 160 };

// Shared, reactive across the toolbar instance. Keyed by component key.
const _measured = new Map<string, { width: number; height: number }>();

export function setMeasuredSize(key: string, size: { width: number; height: number }) {
  _measured.set(key, size);
}

export function sizeForKey(key: string | null | undefined): { width: number; height: number } {
  if (key && _measured.has(key)) return _measured.get(key)!;
  return FALLBACK_SIZE;
}

// -----------------------------------------------------------------------------
// Sizing model (intrinsic vs fluid)
// -----------------------------------------------------------------------------

/** Sensible starting box for fluid axes that have no natural size. */
export const FLUID_DEFAULT = { width: 800, height: 140 };

/** Resolve a def's sizing to an explicit per-axis pair (default: intrinsic). */
export function resolveSizing(def: AgentationComponentDef): { width: AxisSizing; height: AxisSizing } {
  const s = def.sizing;
  if (s === "fluid") return { width: "fluid", height: "fluid" };
  if (s == null || s === "intrinsic") return { width: "intrinsic", height: "intrinsic" };
  return { width: s.width ?? "intrinsic", height: s.height ?? "intrinsic" };
}

/**
 * Initial canvas box for a placement: intrinsic axes use the measured natural
 * size; fluid axes use `defaultSize` (or FLUID_DEFAULT) since they have none.
 */
export function initialSize(
  def: AgentationComponentDef,
  measured: { width: number; height: number },
): { width: number; height: number } {
  const sz = resolveSizing(def);
  const w =
    sz.width === "fluid"
      ? (def.defaultSize?.width ?? FLUID_DEFAULT.width)
      : measured.width || FALLBACK_SIZE.width;
  const h =
    sz.height === "fluid"
      ? (def.defaultSize?.height ?? FLUID_DEFAULT.height)
      : measured.height || FALLBACK_SIZE.height;
  return { width: Math.max(8, Math.round(w)), height: Math.max(8, Math.round(h)) };
}
