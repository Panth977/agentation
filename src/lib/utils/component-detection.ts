// =============================================================================
// Svelte Component Detection
// =============================================================================
//
// This is the Svelte 5 equivalent of the React version's `react-detection.ts`
// and `source-location.ts`. Instead of walking React fibers / `_debugSource`,
// it reads Svelte 5's dev-mode `__svelte_meta` metadata which the compiler
// attaches to DOM elements in development builds:
//
//   element.__svelte_meta = { loc: { file, line, column, char? } }
//
// This is the direct analog of React's `_debugSource`. It is only present in
// DEV builds — production builds strip it, so every public function here
// DEGRADES GRACEFULLY to `null` when the metadata is absent so production
// builds never crash.
//
// The public function names/signatures mirror what the toolbar imported from
// the React modules so callers port 1:1:
//   - getReactComponentName(element, { mode }) -> { name, path }
//   - getSourceLocation(element)               -> SourceLocation | null
//   - findNearestComponentSource(element)      -> SourceLocation | null
//   - formatSourceLocation(loc)                -> string
// =============================================================================

import { getShadowHost } from "./element-identification.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Source location information for a Svelte component element.
 * Mirrors the shape consumed by the toolbar (file/line/column/name).
 */
export interface SourceLocation {
  /** File path (relative-looking; cwd-stripped when obviously absolute) */
  file: string;
  /** Line number (1-indexed), if known */
  line?: number;
  /** Column number (0-indexed), if known */
  column?: number;
  /** Component display name derived from the .svelte filename, if known */
  name?: string;
}

/** Detection mode — same vocabulary as the React version. */
export type DetectionMode = "smart" | "filtered" | "all" | "off";

/**
 * Svelte 5 dev-mode metadata attached to DOM nodes.
 * `char` is the absolute char offset; not always present.
 */
interface SvelteMetaLoc {
  file: string;
  line: number;
  column: number;
  char?: number;
}

interface SvelteMeta {
  loc?: SvelteMetaLoc;
}

/** DOM element augmented with Svelte's dev metadata. */
type SvelteMetaElement = HTMLElement & { __svelte_meta?: SvelteMeta };

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Read the raw Svelte dev-mode loc off an element, or null.
 */
function getSvelteLoc(element: HTMLElement): SvelteMetaLoc | null {
  if (!element || typeof element !== "object") return null;
  const meta = (element as SvelteMetaElement).__svelte_meta;
  const loc = meta?.loc;
  if (!loc || typeof loc.file !== "string") return null;
  return loc;
}

/**
 * Walk up the DOM (crossing shadow boundaries via the shadow host) and yield
 * each ancestor element, starting with `element` itself.
 */
function* walkAncestors(
  element: HTMLElement,
  maxDepth: number,
): Generator<HTMLElement> {
  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < maxDepth) {
    yield current;
    const next: Element | null =
      current.parentElement ?? getShadowHost(current);
    current = next instanceof HTMLElement ? next : null;
    depth++;
  }
}

/**
 * Strip an obviously-absolute path prefix so the file looks relative, mirroring
 * what the React `source-location` formatter does. We strip up to and including
 * a common project-root marker (`/src/`, `/lib/`) when present; otherwise, if
 * an absolute cwd is detectable, strip it.
 */
function cleanFilePath(file: string): string {
  let path = file.replace(/\\/g, "/");

  // Strip query params / hashes some bundlers append.
  path = path.replace(/[?#].*$/, "");

  // Vite/Svelte often emit absolute paths in __svelte_meta. Strip the cwd if we
  // can detect it from the running process (Node/SSR) — guarded for the browser.
  try {
    const cwd =
      typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd().replace(/\\/g, "/")
        : null;
    if (cwd && path.startsWith(cwd + "/")) {
      path = path.slice(cwd.length + 1);
    }
  } catch {
    // process not available (browser) — fall through to marker-based stripping
  }

  // If still absolute, trim down to the last recognizable project root marker.
  if (path.startsWith("/")) {
    const markerMatch = path.match(/\/((?:src|lib|app|routes)\/.*)$/);
    if (markerMatch) {
      path = markerMatch[1];
    } else {
      // Last resort: drop the leading slash so it reads relative-ish.
      path = path.replace(/^\/+/, "");
    }
  }

  // Leading "./"
  path = path.replace(/^\.\//, "");

  return path;
}

/**
 * Derive a component name from a .svelte file path:
 *   "src/lib/Button.svelte" -> "Button"
 * Returns null when the basename can't be derived.
 */
function componentNameFromFile(file: string): string | null {
  const cleaned = file.replace(/\\/g, "/").replace(/[?#].*$/, "");
  const base = cleaned.split("/").pop();
  if (!base) return null;
  const name = base.replace(/\.svelte$/i, "").replace(/\.[a-z0-9]+$/i, "");
  return name.length > 0 ? name : null;
}

/**
 * Convert a raw Svelte loc into a SourceLocation, cleaning the path and
 * deriving the component name from the filename.
 */
function locToSource(loc: SvelteMetaLoc): SourceLocation {
  const file = cleanFilePath(loc.file);
  const name = componentNameFromFile(loc.file);
  return {
    file,
    line: typeof loc.line === "number" ? loc.line : undefined,
    column: typeof loc.column === "number" ? loc.column : undefined,
    ...(name ? { name } : {}),
  };
}

// =============================================================================
// Source location API (port of source-location.ts)
// =============================================================================

/**
 * Get the Svelte source location for a DOM element, read from its dev-mode
 * `__svelte_meta`. Returns null when metadata is unavailable (prod builds).
 */
export function getSourceLocation(element: HTMLElement): SourceLocation | null {
  const loc = getSvelteLoc(element);
  if (!loc) return null;
  return locToSource(loc);
}

/**
 * Walk up the DOM (and across shadow boundaries) from `element` until an
 * ancestor carries `__svelte_meta`, returning its source location. Returns null
 * if none is found within `maxAncestors`.
 */
export function findNearestComponentSource(
  element: HTMLElement,
  maxAncestors = 25,
): SourceLocation | null {
  for (const el of walkAncestors(element, maxAncestors)) {
    const loc = getSvelteLoc(el);
    if (loc) return locToSource(loc);
  }
  return null;
}

/**
 * Format a source location as "file:line" (omitting ":line" when unknown),
 * matching the React `formatSourceLocation(..., "path")` style.
 */
export function formatSourceLocation(loc: SourceLocation): string {
  if (typeof loc.line === "number") {
    return `${loc.file}:${loc.line}`;
  }
  return loc.file;
}

// =============================================================================
// Component name / path API (port of react-detection.ts public surface)
// =============================================================================

/**
 * Names that are clearly framework/layout noise rather than user components.
 * Used by "filtered" and "smart" modes. Conservative to avoid false positives.
 */
const SKIP_PATTERNS: RegExp[] = [
  /^(Root|Layout|App)$/, // top-level shells
  /Provider$/,
  /Boundary$/,
  /^\+/, // SvelteKit route files: +page.svelte, +layout.svelte
  /^Error$/,
];

function isNoise(name: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(name));
}

/**
 * Walk ancestors and collect DISTINCT consecutive component names derived from
 * each element's `__svelte_meta.loc.file` basename, skipping repeats from the
 * same file (consecutive duplicates collapse).
 *
 * Mode semantics (analogous to the React version):
 *  - "all"      → full chain, no filtering.
 *  - "filtered" → drop obvious framework/layout noise (Root/Layout/Provider/…).
 *  - "smart"    → filtered, then trimmed to the nearest few (most relevant).
 *
 * @returns `{ name, path }` where `path` is "<Outer> <Inner> <Leaf>"
 * (outermost first, matching the React ordering) or null when unavailable.
 */
export function getReactComponentName(
  element: HTMLElement,
  options?: { mode?: DetectionMode },
): { name: string | null; path: string | null } {
  const mode = options?.mode ?? "filtered";

  if (mode === "off") {
    return { name: null, path: null };
  }

  if (!element || typeof element !== "object") {
    return { name: null, path: null };
  }

  const maxDepth = 30;
  // Collected innermost → outermost (DOM walk order is leaf → root).
  const namesInnerFirst: string[] = [];
  let lastFile: string | null = null;

  for (const el of walkAncestors(element, maxDepth)) {
    const loc = getSvelteLoc(el);
    if (!loc) continue;

    // Skip consecutive repeats from the same source file.
    if (loc.file === lastFile) continue;
    lastFile = loc.file;

    const name = componentNameFromFile(loc.file);
    if (!name) continue;

    if (mode !== "all" && isNoise(name)) continue;

    namesInnerFirst.push(name);
  }

  if (namesInnerFirst.length === 0) {
    return { name: null, path: null };
  }

  // "smart" keeps only the nearest few components (most relevant to the target).
  let collected = namesInnerFirst;
  if (mode === "smart") {
    collected = namesInnerFirst.slice(0, 3);
  } else {
    // Cap the chain length for "all"/"filtered" to keep paths readable.
    collected = namesInnerFirst.slice(0, 6);
  }

  // Build outermost-first path: "<Outer> <Inner> <Leaf>".
  const path = collected
    .slice()
    .reverse()
    .map((c) => `<${c}>`)
    .join(" ");

  // `name` mirrors the React version: the leaf component name (innermost).
  return { name: collected[0] ?? null, path };
}
