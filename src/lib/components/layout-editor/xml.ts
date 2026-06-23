// =============================================================================
// Layout Editor — XML serialization (agent artifact)
// =============================================================================
// Turns the semantic layout tree into clean XML the AI can read: structure +
// alignment + each component's props + prompt/note + import src. No pixel coords
// unless a `free` container is used.

import type { ContainerNode, ComponentNode, Document, Node, SizeMode, Padding } from "./model.js";
import { isContainer } from "./model.js";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sizeStr(s: SizeMode): string {
  return s === "hug" || s === "fill" ? s : String(s.fixed);
}

function padStr(p: Padding): string | null {
  const { t, r, b, l } = p;
  if (!t && !r && !b && !l) return null;
  if (t === r && r === b && b === l) return String(t);
  if (t === b && l === r) return `${t} ${r}`;
  return `${t} ${r} ${b} ${l}`;
}

function attrs(pairs: Array<[string, string | number | boolean | null | undefined]>): string {
  const out: string[] = [];
  for (const [k, v] of pairs) {
    if (v === null || v === undefined || v === false || v === "") continue;
    out.push(v === true ? k : `${k}="${esc(String(v))}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

function containerTag(c: ContainerNode, isRoot: boolean): string {
  if (isRoot) return "screen";
  if (c.layout === "grid") return "grid";
  if (c.layout === "free") return "frame";
  return c.direction === "row" ? "row" : "column";
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}

function serializeNode(node: Node, depth: number, isRoot = false): string {
  const pad = indent(depth);
  if (isContainer(node)) {
    const tag = containerTag(node, isRoot);
    const a = attrs([
      ["name", isRoot || node.name === "Frame" || node.name === "Group" ? null : node.name],
      ["cols", node.layout === "grid" ? node.cols ?? null : null],
      ["gap", node.gap || null],
      ["padding", padStr(node.padding)],
      ["align", node.align !== "stretch" ? node.align : null],
      ["justify", node.justify !== "start" ? node.justify : null],
      ["wrap", node.wrap || null],
      ["width", node.width !== "hug" ? sizeStr(node.width) : null],
      ["height", node.height !== "hug" ? sizeStr(node.height) : null],
      ["x", node.x],
      ["y", node.y],
      ["hidden", node.hidden || null],
    ]);
    if (node.children.length === 0) return `${pad}<${tag}${a} />`;
    const inner = node.children.map((c) => serializeNode(c, depth + 1)).join("\n");
    return `${pad}<${tag}${a}>\n${inner}\n${pad}</${tag}>`;
  }

  // component
  const a = attrs([
    ["name", node.name],
    ["src", node.src],
    ["align", node.alignSelf ?? null],
    ["width", node.width !== "hug" ? sizeStr(node.width) : null],
    ["height", node.height !== "hug" ? sizeStr(node.height) : null],
    ["x", node.x],
    ["y", node.y],
    ["hidden", node.hidden || null],
  ]);
  const propEntries = Object.entries(node.variantValues ?? {}).filter(
    ([, v]) => v !== undefined && v !== "" && v !== false,
  );
  if (propEntries.length === 0 && !node.note) return `${pad}<component${a} />`;
  const lines: string[] = [`${pad}<component${a}>`];
  for (const [k, v] of propEntries) {
    lines.push(`${indent(depth + 1)}<prop name="${esc(k)}" value="${esc(String(v))}" />`);
  }
  if (node.note) lines.push(`${indent(depth + 1)}<note>${esc(node.note)}</note>`);
  lines.push(`${pad}</component>`);
  return lines.join("\n");
}

/** Serialize a document to the semantic layout XML. */
export function toXml(doc: Document): string {
  return serializeNode(doc.root, 0, true);
}

// -----------------------------------------------------------------------------
// Persistence (JSON — lossless round-trip of the Document)
// -----------------------------------------------------------------------------

export function serializeDoc(doc: Document): string {
  return JSON.stringify(doc);
}

export function deserializeDoc(json: string): Document | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.root && parsed.root.kind === "container") return parsed as Document;
  } catch {
    /* ignore */
  }
  return null;
}
