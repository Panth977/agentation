// =============================================================================
// Built-in component registry
// =============================================================================
// The original 64 generic wireframe types, exposed through the SAME registry
// interface a developer uses. Each entry renders the built-in Skeleton.
// Users without their own UI lib import and pass this:
//   import { builtinComponents } from "@panth977/agentation-svelte";
//   <Agentation components={builtinComponents} />
// (It is also the default value of <Agentation>'s `components` prop.)

import type { AgentationComponentDef } from "./registry.js";
import { COMPONENT_REGISTRY } from "./types.js";
import Skeleton from "./Skeleton.svelte";

export const builtinComponents: AgentationComponentDef[] = COMPONENT_REGISTRY.flatMap((section) =>
  section.items.map(
    (item): AgentationComponentDef => ({
      label: item.label,
      group: section.section,
      // No `src` — these are generic placeholders, not real importable components.
      component: Skeleton as unknown as AgentationComponentDef["component"],
      defaultProps: { type: item.type, width: item.width, height: item.height },
    }),
  ),
);
