# Design: developer component registry for Layout Mode

> Status: **proposal / brainstorm** (not yet implemented). Captures the agreed
> interface so we can iterate before building.

## Goal

Replace Agentation's hardcoded 64 generic wireframe types with the **developer's
own component library**. The developer registers their components (with variants,
a description, and an import source) at init; Layout Mode renders *their* real
components as palette icons and on the canvas, and emits an agent spec that names
the exact component + variants + where to import it.

## The interface (the entire contract)

A single prop on `<Agentation>`:

```svelte
<Agentation components={registry} wrapper={providerSnippet} />
```

```ts
type AgentationComponents =
  | AgentationComponentDef[]                      // flat
  | Record<string, AgentationComponentDef[]>;     // grouped: { Actions: [...], Layout: [...] }

type AgentationComponentDef = {
  /** Display name in the palette + registry key (unique within the registry). */
  label: string;

  /** The real component → rendered as the palette icon AND on the canvas. */
  component?: Component;

  /**
   * Import source of the component, e.g. "$lib/ui/Button.svelte" or "@acme/ui".
   * NOT used for rendering — it is injected into the agent prompt so the agent
   * knows exactly where to import this component from. (Replaces an `id`.)
   */
  src?: string;

  /** Palette section + search facet. (Or use the grouped-object form of the registry.) */
  group?: string;

  /** What the component is for. Shown as a palette tooltip AND sent to the agent. */
  description?: string;

  /** Extra search terms beyond label/description. */
  keywords?: string[];

  /**
   * Configurable variants. Values are chosen in the inspector and appear in the
   * agent output (e.g. `size=lg`). This is how "size" is expressed — NOT pixels.
   */
  variants?: Record<string, VariantSpec>;

  /** Props always passed to `component`. */
  defaultProps?: Record<string, unknown>;

  /** Map chosen variant values -> component props. Default: identity (pass-through). */
  toProps?: (values: Record<string, unknown>) => Record<string, unknown>;

  /**
   * Escape hatch: full control over rendering (children/slots, context, wrapping).
   * Receives the current variant values. When present, used instead of `component`.
   */
  preview?: Snippet<[values: Record<string, unknown>]>;

  // NOTE: no `defaultSize`. Canvas footprint is AUTO-MEASURED from the render
  // (mounted offscreen, measured, clamped). Size is never part of the agent spec.
};

type VariantSpec =
  | string[]                                              // shorthand enum: ["primary","ghost"]
  | { type: "enum"; options: string[]; default?: string }
  | { type: "boolean"; default?: boolean }
  | { type: "number"; min?: number; max?: number; step?: number; default?: number }
  | { type: "text"; default?: string };
```

Top-level options:
- `wrapper?: Snippet<[children]>` — applied around every preview/placement so the
  dev can inject their `<ThemeProvider>` / context once.

### Minimal usage

```svelte
<Agentation components={[
  { label: "Button", component: Button, src: "$lib/ui/Button.svelte" },
  { label: "Card",   component: Card,   src: "$lib/ui/Card.svelte" },
]} />
```

`{ label, component }` is the floor — icon (render), size (measured), and search
index (label) are all derived.

### Rich usage

```svelte
<Agentation
  wrapper={withTheme}
  components={{
    Actions: [{
      label: "Button",
      component: Button,
      src: "$lib/ui/Button.svelte",
      description: "Primary call-to-action. One per view; the main action on a screen.",
      keywords: ["cta", "submit"],
      variants: {
        intent: ["primary", "secondary", "danger"],
        size:   ["sm", "md", "lg"],
        disabled: { type: "boolean", default: false },
      },
      defaultProps: { children: "Button" },
    }],
    Surfaces: [
      { label: "Card", component: Card, src: "$lib/ui/Card.svelte", preview: cardPreview },
    ],
  }}
/>
```

## Requirement → mechanism

| Requirement | Mechanism |
|---|---|
| Registry of components at init | `components` prop (flat or grouped) |
| Component variants | `variants` schema → **inspector panel** on the selected placement; values stored on the placement |
| Configure variants | inspector controls: enum→segmented, boolean→switch, number→slider, text→input |
| Prompt + label | `label` (display) + `description` (tooltip **and** agent prompt) |
| Search bar | filters palette by label / keywords / description / group |
| Icons from the component render | palette tile mounts the real component, scaled (`transform: scale()`, `pointer-events:none`, `inert`, `contain: layout paint`, clipped), lazy-mounted via IntersectionObserver |
| Where to get the component | `src` injected into the agent spec |

## Agent output (no pixel sizes)

```
## Layout (3 components)

1. Button — src: $lib/ui/Button.svelte
   variants: intent=primary, size=lg
   purpose: Primary call-to-action. One per view; the main action on a screen.
   placement: top-right of the header row
   note: "submits the signup form"

2. Card — src: $lib/ui/Card.svelte
   variants: (default)
   placement: 3-up grid below the hero
...
```

The agent gets: exact component, where to import it (`src`), variant config,
intent (`description` + instance note), and relative placement/order. No
guessing, no pixel dimensions.

## Integration onto the existing code

- `ComponentType` (closed union) → open `string` key; keep the 64 built-ins as a
  **default registry** so the tool still works with zero config / as a fallback.
- `<Agentation>` threads `components` + `wrapper` → `DesignMode` → `DesignPalette`/`ComponentGrid`.
- `ComponentGrid`: iterate the registry, render live previews, add the search box.
- `Skeleton.svelte` (canvas render): render the dev's component / `preview`; fall
  back to the built-in skeleton when no `component` is supplied.
- `DesignPlacement`: add `componentKey` + `variantValues` (drop reliance on pixel size for the spec; keep measured size for canvas layout only).
- New `VariantInspector` panel.
- `output.ts`: emit `src` + variants + description; drop pixel dimensions.

## Locked decisions (build these)

- **Full feature in one pass**: registry + data-driven palette + search + live
  render-icons + variant inspector + new output format.
- **No implicit built-ins.** The 64 generic types are exported as
  `builtinComponents: AgentationComponentDef[]` and flow through the *same*
  registry interface. A user with no UI lib imports and passes them:
  `import { builtinComponents } from "@panth977/agentation-svelte"`.
  - `<Agentation>`'s `components` prop **defaults to `builtinComponents`** (zero
    config still works); when the dev passes their own, ONLY theirs are shown
    (built-ins are never merged in).
- `builtinComponents` entries render the existing `Skeleton` via a `preview`
  snippet (`src` undefined; groups/labels from the current `COMPONENT_REGISTRY`).

## File-by-file plan

1. `design-mode/registry.ts` (NEW): `AgentationComponentDef`, `VariantSpec`,
   `AgentationComponents`, plus helpers: `normalizeRegistry()` (flat|grouped →
   internal list with stable keys + resolved groups), `defaultVariantValues(def)`,
   `resolveProps(def, values)` (defaultProps ∪ toProps(values) ∪ identity).
2. `design-mode/builtins.ts` (NEW): build `builtinComponents` from the existing
   `COMPONENT_REGISTRY`/`DEFAULT_SIZES`, each a `preview` snippet rendering
   `Skeleton`. Re-export from `lib/index.ts`.
3. `design-mode/ComponentPreview.svelte` (NEW): mounts a def's `component`/`preview`
   with resolved props inside an isolated, scaled, `inert`, clipped box. Used for
   palette icons AND canvas placements. Emits measured natural size (ResizeObserver)
   for auto-sizing.
4. `design-mode/VariantInspector.svelte` (NEW): controls per `VariantSpec`
   (enum→segmented, boolean→Switch, number→slider, text→input) bound to the
   selected placement's `variantValues`.
5. `ComponentGrid.svelte`: iterate normalized registry; render `ComponentPreview`
   as the tile icon; add a **search input** (label/keywords/description/group).
6. `DesignPalette.svelte`: pass registry + search through; wire inspector entry.
7. `Skeleton.svelte` usage on canvas → replaced by `ComponentPreview` for the
   placed def; auto-measure sets placement `width`/`height` (canvas layout only).
8. `types.ts`: `DesignPlacement` → reuse `type` field as the component **key**
   (open string) + add `variantValues?: Record<string, unknown>`; keep `text` as note.
9. `output.ts`: `generateDesignOutput` → emit `src`, `variants` (k=v), `description`,
   relative placement + note; **drop pixel dimensions**.
10. `DesignMode.svelte`: accept `components` + `wrapper`; resolve def by key on
    placement; default variant values on create; render placements via `ComponentPreview`.
11. `Agentation.svelte`: add `components` (default `builtinComponents`) + `wrapper`
    props; thread to `DesignMode`/`DesignPalette`.
12. `lib/index.ts`: export `builtinComponents`, `AgentationComponentDef`,
    `VariantSpec`, `AgentationComponents`.

## Open concerns to resolve during build

- **Context/theme:** the `wrapper` snippet covers providers; verify it wraps both
  palette previews and canvas placements.
- **Isolation:** dev components may have side-effecting `onMount`, fixed/absolute
  children, or heavy render cost. Previews are `inert` + clipped + lazy; consider
  shadow-DOM isolation if global CSS bleed becomes a problem.
- **Preview faithfulness for children/slots:** `defaultProps.children` (string) is
  enough for simple cases; the `preview` snippet handles real slotted content.
- **Key uniqueness:** `label` is the registry key — must be unique (or we key by
  `group/label`). `src` is metadata, not a key (two entries can share a `src`).
