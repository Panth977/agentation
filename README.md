# agentation-svelte

**Visual feedback for AI coding agents** — a Svelte 5 port of [agentation](../agentation-react).

A floating toolbar you drop into any app. Click elements to leave comments,
select text, drag to multi-select, and stream structured, source-located feedback
to an AI coding agent (copy as Markdown, send to a webhook, or sync to an MCP
server). Includes "design mode" for placing/rearranging component skeletons.

## Install

```bash
pnpm add agentation-svelte
# optional — enables DOM screenshot capture for drawings:
pnpm add modern-screenshot
```

Requires **Svelte 5** (peer dependency). Works great with Vite / SvelteKit / Tauri.

## Usage

```svelte
<script lang="ts">
  import { Agentation } from "agentation-svelte";
</script>

<!-- mount once, anywhere (client-side) -->
<Agentation />
```

### Props (all optional)

| Prop | Type | Default | Description |
|---|---|---|---|
| `onAnnotationAdd` | `(a: Annotation) => void` | — | Fired when an annotation is created |
| `onAnnotationDelete` | `(a: Annotation) => void` | — | Fired when an annotation is deleted |
| `onAnnotationUpdate` | `(a: Annotation) => void` | — | Fired when an annotation is edited |
| `onAnnotationsClear` | `(a: Annotation[]) => void` | — | Fired when all are cleared |
| `onCopy` | `(markdown: string) => void` | — | Fired on copy |
| `onSubmit` | `(output: string, a: Annotation[]) => void` | — | Fired on "Send to Agent" |
| `copyToClipboard` | `boolean` | `true` | Copy markdown to clipboard on copy |
| `endpoint` | `string` | — | MCP/sync server URL (e.g. `http://localhost:4747`) |
| `sessionId` | `string` | — | Join an existing session |
| `onSessionCreated` | `(id: string) => void` | — | Fired when a new session is created |
| `webhookUrl` | `string` | — | Webhook to receive annotation events |
| `className` | `string` | — | Class on the toolbar container (positioning/z-index) |
| `demoAnnotations` / `demoDelay` / `enableDemoMode` | — | — | Demo playback |

### What changed from the React version

- **Svelte 5 runes** throughout (`$state`/`$derived`/`$effect`/`$props`).
- **Component detection**: React fiber inspection was reworked to read Svelte 5's
  dev-mode `__svelte_meta` for source files / component names. It degrades
  gracefully (no detection) in production builds. The `Annotation.reactComponents`
  / `sourceFile` fields are preserved for protocol compatibility.
- **Styling**: keeps the original SCSS via Vite CSS Modules — identical visuals.

## Develop

```bash
pnpm install
pnpm dev      # playground at / with the toolbar mounted
pnpm check    # svelte-check
pnpm build    # vite build + svelte-package (-> dist/) + publint
```

See `PORTING.md` and `TOOLBAR_PORT.md` for the port architecture and conventions.

## License

PolyForm-Shield-1.0.0 (same as upstream).
