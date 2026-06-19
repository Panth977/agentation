# Porting agentation (React) → agentation-svelte (Svelte 5)

Reference source (READ-ONLY): `../agentation-react/package/src`
Target: `./src/lib`

This is a **complete, feature-for-feature rework**. Every behavior in the React
version must exist in the Svelte version. Reference the React source for logic,
but write idiomatic Svelte 5.

## Conventions (MANDATORY — all ported code must follow these)

### Language / runtime

- **Svelte 5 + runes only.** Use `$state`, `$derived`, `$effect`, `$props`,
  `$bindable`. No legacy `export let`, no stores unless genuinely shared
  cross-component state (prefer a `.svelte.ts` rune module for that).
- TypeScript everywhere. Keep the React file's types; translate `React.X` types
  to DOM/Svelte equivalents.
- ESM imports use explicit `.js` / `.svelte.js` extensions where TS requires for
  the package build (svelte-package). For `.ts` util files import as `./foo.js`.

### Files

- Framework-agnostic `.ts` utils → copy nearly verbatim into `src/lib/utils/`
  (same filename). Strip `"use client"`. Keep logic identical.
- React `.tsx` components → `*.svelte` files. One component per `.svelte` file.
- A folder `foo/index.tsx` becomes `src/lib/components/foo/Foo.svelte` (PascalCase
  component file) — update imports accordingly. Re-export from a barrel only via
  `src/lib/index.ts` for the PUBLIC API.

### Styling — KEEP CSS MODULES (validated approach)

We mirror the React setup exactly using **Vite CSS Modules** (`sass` is installed,
Vite resolves `.module.scss` natively — confirmed working with `vite build` and
`svelte-package`). This makes the port nearly mechanical AND preserves the
critical pattern of passing class names down to child components (CSS Modules
emit real hashed global class strings, so `class={styles.foo}` on a child works
exactly like React).

Rules:
- **Copy each `styles.module.scss` verbatim** next to its component (same
  filename). Do NOT rewrite selectors or rename classes.
- In the `.svelte` file: `import styles from "./styles.module.scss";` in the
  `<script>` and reference classes as `class={styles.fooBar}` — a 1:1 swap for
  React's `className={styles.fooBar}`.
- Combine with a passed class via template literal:
  `class={`${styles.container} ${className}`}`.
- A type decl for `*.module.scss` already exists at `src/lib/scss.d.ts`.
- For nodes relocated by the `portal` action (rendered into `<body>`), put their
  CSS in a `:global(...)` block (component-scoped `<style>` won't reach them) OR
  keep using the component's `.module.scss` classes (those are global hashed
  names and still apply after relocation). Prefer the `.module.scss` route.
- Non-module `.scss` (e.g. icon-transitions) can also be imported for side-effect
  styles; but the icons layer inlines its transition CSS into scoped `<style>` —
  that's fine since icons own their animation classes internally.
- Keep all React class names verbatim. Do not invent a new design.

### React → Svelte translation cheatsheet

| React | Svelte 5 |
|---|---|
| `useState(x)` | `let v = $state(x)` |
| `useRef(null)` (DOM) | `let el: HTMLElement; <div bind:this={el}>` |
| `useRef(x)` (mutable, non-DOM) | plain `let v = x` (module/local) or `$state` if reactive |
| `useEffect(fn, deps)` | `$effect(() => { ... })` (auto-tracked) |
| `useLayoutEffect` | `$effect.pre(...)` |
| `useCallback`/`useMemo` | plain function / `$derived` |
| `useImperativeHandle` | `export function method() {}` from the component |
| props | `let { a, b = default, onX } = $props()` |
| callbacks `onFoo` props | keep as `onFoo` function props |
| `createPortal(node, target)` | a Svelte `portal` action, or render into a
  fixed container created in the toolbar. See `src/lib/actions/portal.ts`. |
| children | `{@render children?.()}` with `Snippet` prop |
| conditional `{x && <A/>}` | `{#if x}<A/>{/if}` |
| `.map(...)` | `{#each items as item (item.id)}` |
| `style={{a:b}}` | `style="a: {b}"` or `style:a={b}` |
| event `onClick` | `onclick` |

### Framework detection (react-detection.ts + source-location.ts)

These read React fibers off DOM nodes. **Rework for Svelte**: create
`src/lib/utils/component-detection.ts` that detects Svelte components where
possible (dev-mode source via `data-svelte-*` / Svelte's dev metadata if present),
and otherwise returns `null` gracefully. The public field stays
`reactComponents` / `sourceFile` on `Annotation` for protocol compatibility, but
the value reflects Svelte components. Keep the same exported function names used
by the toolbar (`getComponentName`, `getSourceLocation`, etc.) — adapt callers.

### Don't

- Don't run `npm publish` or bump versions.
- Don't change the visual design, class names, or output formats.
- Don't add runtime deps beyond `svelte` (peer).

## Layered plan & status

- [x] L0 Scaffold (package.json, vite, svelte.config, tsconfig, dev playground)
- [x] L0 `types.ts` + toolbar `types.ts` (shared config) + portal action + scss.d.ts
- [x] L1 Framework-agnostic utils: element-identification, storage, sync,
      generate-output, screenshot, freeze-animations
- [x] L1 component-detection (rework of react-detection + source-location,
      uses Svelte `__svelte_meta`)
- [x] L2 design-mode logic: types, section-detection, spatial, output
- [x] L3 leaf components: icons (37), switch, checkbox, tooltip, help-tooltip,
      checkbox-field
- [x] L4 composite: annotation-popup (+ shake() handle), annotation-marker
      (AnnotationMarker/PendingMarker/ExitingMarker), settings-panel
- [x] L4 design-mode UI: palette (DesignPalette/ComponentGrid/PaletteIconSvg/
      RollingCount), rearrange (RearrangeOverlay), skeletons (Skeleton, 64 types)
- [x] L4 design-mode container: DesignMode (integrates the above)
- [x] L5 main toolbar: page-toolbar-css → Agentation.svelte (see TOOLBAR_PORT.md)
- [x] L6 wire public exports in index.ts; svelte-check 0 errors; `vite build` +
      `svelte-package` + `publint` all clean
- [x] L7 example test site (multi-route SvelteKit app: home/dashboard/pricing,
      toolbar mounted in +layout.svelte)
- [x] L7 headless runtime verification (playwright-core + cached chromium):
      mounts on all routes with ZERO console errors/exceptions; annotate flow
      PASSES end-to-end (activate → popup → comment → marker → copy).
      Scripts: `scripts/verify-runtime.mjs`, `scripts/verify-flow.mjs`.

## Key runtime fix found during verification

The toolbar was originally rendered via a `portal` action (move node to <body>),
mirroring React's createPortal. But **Svelte 5 event delegation is rooted at the
app mount point** — moving the subtree out of that root silently breaks every
`onclick`/`oninput` inside it (no error, just dead handlers). Fix: render the
toolbar INLINE (it's position:fixed + high z-index). See the comment at the
toolbar wrapper in Agentation.svelte. The `portal` action is still used by the
non-interactive Tooltip (pointer-events:none), which is unaffected.

## Verify command for subagents (avoids svelte-kit sync race)

`cd /Users/panth977/Dev/npm-package/agentation/agentation-svelte && pnpm exec svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
(`.svelte-kit` is already synced; do NOT run `pnpm check` which re-runs sync.)

## Icon exports available (import default from `src/lib/components/icons/<Name>.svelte`)

IconClose, IconPlus, IconCheck, IconCheckSmall, IconListSparkle, IconHelp,
IconCheckSmallAnimated, IconCopyAlt, IconCopyAnimated, IconSendArrow,
IconSendAnimated, IconEye, IconEyeAlt, IconEyeClosed, IconEyeAnimated,
IconPausePlayAnimated, IconEyeMinus, IconGear, IconPauseAlt, IconPause,
IconPlayAlt, IconTrashAlt, IconChatEllipsis, IconCheckmark, IconCheckmarkLarge,
IconCheckmarkCircle, IconXmark, IconXmarkLarge, IconSun, IconMoon, IconEdit,
IconTrash, IconChevronLeft, IconChevronRight, AnimatedBunny, IconLayout.
(Animated icons keep the source's state prop names: e.g. IconCopyAnimated
`copied`, IconSendArrow `state`, IconSendAnimated `sent`, IconEyeAnimated
`isOpen`, IconPausePlayAnimated `isPaused`. `style`-taking icons accept a string.)
