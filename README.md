<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/benjitaylor/agentation/main/package/logo-dark.svg">
  <img src="https://raw.githubusercontent.com/benjitaylor/agentation/main/package/logo.svg" alt="Agentation" width="200">
</picture>

<br>

**agentation-svelte** is a **Svelte 5 port** of [**Agentation**](https://github.com/benjitaylor/agentation) — an agent-agnostic visual feedback tool. Click elements on your page, add notes, and copy structured output that helps AI coding agents find the exact code you're referring to.

> 🙏 **Credit & origin.** This package is a community port of [`agentation`](https://github.com/benjitaylor/agentation) by [Benji Taylor](https://github.com/benjitaylor), ported from React → Svelte 5. All concepts, design, output formats, and the original implementation come from the upstream project: **https://github.com/benjitaylor/agentation**. For the original React package, docs, and hosted app see [agentation.com](https://agentation.com).

## Install

```bash
npm install agentation-svelte -D
# optional — enables DOM screenshot capture for drawings:
npm install modern-screenshot -D
```

Requires **Svelte 5** (peer dependency). Works with Vite / SvelteKit / Tauri.

## Usage

```svelte
<script lang="ts">
  import { Agentation } from 'agentation-svelte';
</script>

<YourApp />
<Agentation />
```

The toolbar appears in the bottom-right corner. Click to activate, then click any element to annotate it.

## Features

- **Click to annotate** – Click any element with automatic selector identification
- **Text selection** – Select text to annotate specific content
- **Multi-select** – Drag to select multiple elements at once
- **Area selection** – Drag to annotate any region, even empty space
- **Animation pause** – Freeze all animations (CSS, JS, videos) to capture specific states
- **Design mode** – Place and rearrange component skeletons in-page
- **Structured output** – Copy markdown with selectors, positions, and context
- **Programmatic access** – Callback props for direct integration with tools
- **Agent Sync & webhooks** – Sync annotations to an MCP server or POST them to a webhook
- **Dark/light mode** – Toggle in settings, persists to localStorage
- **Component detection** – Reads Svelte 5 dev-mode `__svelte_meta` for source files / component names (gracefully no-ops in production)
- **Zero runtime dependencies** – Pure CSS animations; only `svelte` (peer) + tiny `esm-env`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAnnotationAdd` | `(annotation: Annotation) => void` | - | Called when an annotation is created |
| `onAnnotationDelete` | `(annotation: Annotation) => void` | - | Called when an annotation is deleted |
| `onAnnotationUpdate` | `(annotation: Annotation) => void` | - | Called when an annotation is edited |
| `onAnnotationsClear` | `(annotations: Annotation[]) => void` | - | Called when all annotations are cleared |
| `onCopy` | `(markdown: string) => void` | - | Callback with markdown output when copy is clicked |
| `onSubmit` | `(output: string, annotations: Annotation[]) => void` | - | Called when "Send Annotations" is clicked |
| `copyToClipboard` | `boolean` | `true` | Set to false to prevent writing to clipboard |
| `endpoint` | `string` | - | Server URL for Agent Sync (e.g., `"http://localhost:4747"`) |
| `sessionId` | `string` | - | Pre-existing session ID to join |
| `onSessionCreated` | `(sessionId: string) => void` | - | Called when a new session is created |
| `webhookUrl` | `string` | - | Webhook URL to receive annotation events |
| `className` | `string` | - | Custom class on the toolbar container (positioning/z-index) |

### Programmatic Integration

Use callbacks to receive annotation data directly:

```svelte
<script lang="ts">
  import { Agentation, type Annotation } from 'agentation-svelte';

  function handleAnnotation(annotation: Annotation) {
    // Structured data - no parsing needed
    console.log(annotation.element);      // "Button"
    console.log(annotation.elementPath);  // "body > div > button"
    console.log(annotation.boundingBox);  // { x, y, width, height }
    console.log(annotation.cssClasses);   // "btn btn-primary"

    // Send to your agent, API, etc.
    sendToAgent(annotation);
  }
</script>

<YourApp />
<Agentation
  onAnnotationAdd={handleAnnotation}
  copyToClipboard={false}
/>
```

### Annotation Type

```typescript
type Annotation = {
  id: string;
  x: number;                    // % of viewport width
  y: number;                    // px from top of document (absolute) OR viewport (if isFixed)
  comment: string;              // User's note
  element: string;              // e.g., "Button"
  elementPath: string;          // e.g., "body > div > button"
  timestamp: number;

  // Optional metadata (when available)
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
};
```

> **Note:** This is a simplified type. The full type includes additional fields for Agent Sync (`url`, `status`, `thread`, `reactComponents`, etc.). See the upstream [schema](https://agentation.com/schema) for the complete definition.

## How it works

Agentation captures class names, selectors, and element positions so AI agents can `grep` for the exact code you're referring to. Instead of describing "the blue button in the sidebar," you give the agent `.sidebar > button.primary` and your feedback.

## Differences from the React original

- **Svelte 5 runes** throughout (`$state` / `$derived` / `$effect` / `$props`).
- **Component detection** reworked from React fiber inspection to Svelte 5's dev-mode `__svelte_meta`.
- Rendered **inline** (not portaled) — Svelte 5 event delegation requires the toolbar to stay within the app's mount root. The toolbar is `position: fixed` with a high z-index; mount `<Agentation />` near your app root and avoid transformed/filtered ancestors.

## Requirements

- Svelte 5+
- Desktop browser (mobile not supported)

## Credits & License

Ported from [**benjitaylor/agentation**](https://github.com/benjitaylor/agentation) (React) by Benji Taylor.

© 2026 Benji Taylor — Licensed under PolyForm Shield 1.0.0 (same as upstream).
