# Layout Editor v2 — design (from scratch)

> Replaces the flat x/y "Layout Mode" with a Figma-like, **semantic** layout
> editor. The document is a tree that serializes to **XML** carrying each
> component's props + prompt. Position is expressed by **stacking + alignment**,
> not coordinates. Raw x/y is a last-resort escape hatch.

## 1. The document model (semantic, XML-serializable)

A tree of nodes. Two kinds:

```ts
type SizeMode = "hug" | "fill" | { fixed: number };          // fit-content | flex:1 | Npx
type Align = "start" | "center" | "end" | "stretch";          // cross-axis (align-items / -self)
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly"; // main-axis

type ContainerNode = {
  id: string;
  kind: "container";
  name: string;                       // "Header", "Card grid"
  layout: "stack" | "grid" | "free";  // free = absolute children (last resort)
  direction: "row" | "column";        // stack
  gap: number;                        // px (spacing token)
  padding: { t: number; r: number; b: number; l: number };
  align: Align;                       // cross-axis alignment of children
  justify: Justify;                   // main-axis distribution
  wrap: boolean;
  cols?: number;                      // grid
  width: SizeMode; height: SizeMode;
  // per-axis absolute coords only when parent.layout === "free":
  x?: number; y?: number;
  children: Node[];
};

type ComponentNode = {
  id: string;
  kind: "component";
  name: string;                       // display = registry label
  componentKey: string;               // registry key
  src?: string;                       // import path → agent
  variantValues: Record<string, unknown>;
  note?: string;                      // the per-instance prompt/context
  alignSelf?: Align;                  // override parent align (left/center/right)
  width: SizeMode; height: SizeMode;  // seeded from registry intrinsic/fluid
  x?: number; y?: number;             // only in a free parent
};

type Node = ContainerNode | ComponentNode;
type Document = { root: ContainerNode; };   // root is always a container (the screen/frame)
```

- **Alignment replaces x/y.** "Left / center / right" = `align`/`alignSelf` (cross-axis)
  or `justify` (main-axis), depending on the parent's direction. The inspector
  shows intuitive align buttons + "stack vertical/horizontal", not number fields.
- **`hug | fill | fixed`** = the intrinsic/fluid model generalized (Figma's resizing).
- **A group is a container.** Group = wrap selection in a new container; ungroup =
  splice children into the parent. Nesting is free.
- **`free` layout** is the escape hatch: children get absolute `x/y`.

### XML serialization (the agent artifact + persistence)

```xml
<screen gap="24" padding="32" align="stretch">
  <row justify="between" align="center" padding="16">
    <component name="Logo" src="@envizom/ui-lib"/>
    <row gap="8" width="hug">
      <component name="Button" src="@envizom/ui-lib">
        <prop name="intent" value="ghost"/>
        <prop name="size" value="md"/>
        <note>Secondary action</note>
      </component>
      <component name="Button" src="@envizom/ui-lib">
        <prop name="intent" value="primary"/>
        <note>Submits the signup form</note>
      </component>
    </row>
  </row>
  <grid cols="3" gap="16">
    <component name="Card" src="@envizom/ui-lib" width="fill"/>
    <component name="Card" src="@envizom/ui-lib" width="fill"/>
    <component name="Card" src="@envizom/ui-lib" width="fill"/>
  </grid>
</screen>
```
`<stack direction="row">` is sugar-printed as `<row>` / `<column>`; `<grid>` for grid;
`<screen>` for root. The AI turns this into real flex/grid + the named components.

## 2. The editor shell (full, Figma-like)

Layout Mode becomes a full-bleed overlay editor:

```
┌── LEFT ─────────┬──────── CANVAS ────────┬──── RIGHT (Inspector) ───┐
│ [Components|Layers]                       │ selection-contextual     │
│ Components: search + list (drag / click)  │  Container:               │
│ Layers: the tree — group/ungroup,         │   stack dir · align ·     │
│   reorder & reparent (drag), rename,       │   justify · gap · padding │
│   hide, lock, multiselect                  │   · wrap · grid cols      │
│                                            │  Size: hug/fill/fixed     │
│   canvas renders the tree with REAL        │  Component: variant form  │
│   flex/grid; select, drag-reorder,         │   (reuse VariantInspector)│
│   resize, drop-from-palette, group         │   + note/prompt + src(ro) │
└─────────────────┴────────────────────────┴──────────────────────────┘
 top bar: group ⌘G · ungroup ⌘⇧G · align L/C/R + T/M/B · distribute ·
          stack→row/col · duplicate ⌘D · delete · undo/redo · copy XML
```

## 3. Modules to build (`src/lib/components/layout-editor/`)

| Module | Responsibility |
|---|---|
| `model.ts` | Node/Document types, `SizeMode`/`Align`; **pure** ops: `insert`, `remove`, `move`(reparent+index), `group`, `ungroup`, `duplicate`, `setLayout`, `setSize`, `setVariant`, `setNote`, `find`, `walk`, `ancestors`. Immutable updates. |
| `xml.ts` | `toXml(doc)` / `fromXml(str)` (persistence + agent output). |
| `defaults.ts` | seed a `ComponentNode` from a registry def (sizing→hug/fill, default variants, src, name). |
| `editor.svelte.ts` | rune store: `doc`, `selection:Set`, `hover`, `clipboard`, `dragState`, derived `selectedNodes`; wraps ops + pushes history. |
| `history.svelte.ts` | undo/redo stack of immutable `Document` snapshots. |
| `NodeView.svelte` | **recursive**: container → flex/grid div rendering children; component → `ComponentPreview`. Applies layout/align/size as CSS. |
| `Canvas.svelte` | hosts root `NodeView`; selection/hover overlays + resize handles; drop targets; marquee; drag-move/reparent. |
| `LeftPanel.svelte` | tabs: `Palette.svelte` (reuse search list) + `LayersTree.svelte` (recursive, drag-reparent). |
| `Inspector.svelte` (right) | container controls + size + align + `VariantInspector` + note + src. |
| `Toolbar.svelte` + `shortcuts.ts` | group/ungroup/align/distribute/duplicate/delete/undo + copy-XML. |
| `output.ts` | `toXml` wrapper for the toolbar's "copy/send" pipeline. |
| integration | toolbar "Layout" button mounts `LayoutEditor.svelte`; migrate old placements → root `free` frame; drop old DesignMode/palette/rearrange-as-placement. |

**Reused as-is:** registry (`registry.ts`, `builtins.ts`), `ComponentPreview.svelte`
(renders leaves — already handles hug/fill via the sizing work), `VariantInspector.svelte`,
the freeze-animation + storage utils.

## 4. Interactions (full editor)
- Add: drag Components→canvas/frame, or select→click-place into a frame.
- Select: click; shift/marquee multi-select; Esc deselect.
- Group ⌘G (wrap in new auto-layout frame) · Ungroup ⌘⇧G.
- Reparent/reorder: drag in Layers tree (precise) and on canvas (into frames).
- Align: L/C/R + T/M/B buttons set `align`/`justify`/`alignSelf` (the x/y replacement).
- Resize: handles gated by hug/fill/fixed (no stretch on hug axes).
- Rename, hide, lock, duplicate ⌘D, delete, undo/redo ⌘Z/⌘⇧Z.
- Canvas renders **real** flex/grid → WYSIWYG layout.

## 5. Output
The "copy / send to agent" buttons emit `toXml(doc)` — the semantic tree above,
with props + notes + src. (Optionally also a Markdown summary.) No pixel coords
unless a `free` frame is used.

## 6. Build order (full, but sequenced for verifiability)
1. `model.ts` + `xml.ts` + `defaults.ts` (+ unit checks) — pure core.
2. `editor.svelte.ts` + `history.svelte.ts`.
3. `NodeView.svelte` (render tree w/ flex/grid) + `Canvas.svelte` (select/hover).
4. `LeftPanel` (Palette + LayersTree) + reparent.
5. `Inspector` (container + size + variants + note).
6. Canvas drag-move/resize/marquee + align/group toolbar + shortcuts + undo/redo.
7. `output.ts` (XML) + wire into toolbar copy/send.
8. Replace DesignMode in the toolbar; migrate persisted placements; remove dead code.
9. svelte-check 0/0 + headless verify (build a sample tree, assert XML + layout).
