<script lang="ts">
  import { LayoutEditor } from "$lib/components/layout-editor/index.js";
  import { normalizeRegistry } from "$lib/components/design-mode/registry.js";
  import { builtinComponents } from "$lib/components/design-mode/builtins.js";

  const registry = normalizeRegistry(builtinComponents);
  let lastXml = $state("");
</script>

<LayoutEditor {registry} onCopy={(xml) => (lastXml = xml)} />

{#if lastXml}
  <pre style="position:fixed;bottom:8px;left:8px;max-width:40vw;max-height:30vh;overflow:auto;background:#000;color:#9f9;font:11px/1.4 monospace;padding:8px;z-index:100050;border:1px solid #333">{lastXml}</pre>
{/if}
