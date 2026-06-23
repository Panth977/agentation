// =============================================================================
// Layout Editor — seed nodes from the component registry
// =============================================================================

import { newId, type ComponentNode, type SizeMode } from "./model.js";
import { defaultVariantValues, resolveSizing, type NormalizedDef } from "../design-mode/registry.js";

function axisToSize(a: "intrinsic" | "fluid"): SizeMode {
  // intrinsic → hug its own content; fluid → fill the container.
  return a === "fluid" ? "fill" : "hug";
}

/** Build a fresh ComponentNode for a registry component definition. */
export function componentFromDef(def: NormalizedDef): ComponentNode {
  const sz = resolveSizing(def);
  return {
    id: newId("n"),
    kind: "component",
    name: def.label,
    componentKey: def.key,
    src: def.src,
    variantValues: defaultVariantValues(def),
    width: axisToSize(sz.width),
    height: axisToSize(sz.height),
  };
}
