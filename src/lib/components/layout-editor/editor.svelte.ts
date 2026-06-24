// =============================================================================
// Layout Editor — reactive store (Svelte 5 runes) + undo/redo
// =============================================================================
// Wraps the pure model ops, holds selection/hover, and snapshots the immutable
// Document for undo/redo. One instance per editor mount.

import { SvelteSet } from "svelte/reactivity";
import * as M from "./model.js";
import type { Document, Node, ContainerNode, ComponentNode, Align, Justify, Direction, SizeMode } from "./model.js";
import { toXml } from "./xml.js";
import { componentFromDef } from "./defaults.js";
import type { NormalizedRegistry, NormalizedDef } from "../design-mode/registry.js";

export class EditorStore {
  doc = $state<Document>(M.emptyDocument());
  selection = new SvelteSet<string>();
  hover = $state<string | null>(null);

  registry: NormalizedRegistry;

  #past: Document[] = $state([]);
  #future: Document[] = $state([]);

  constructor(registry: NormalizedRegistry, initial?: Document) {
    this.registry = registry;
    if (initial) this.doc = initial;
  }

  // --- derived selection helpers -------------------------------------------
  get selectedNodes(): Node[] {
    return [...this.selection].map((id) => M.find(this.doc, id)).filter(Boolean) as Node[];
  }
  get selectedNode(): Node | null {
    return this.selection.size === 1 ? this.selectedNodes[0] ?? null : null;
  }
  get canUndo() {
    return this.#past.length > 0;
  }
  get canRedo() {
    return this.#future.length > 0;
  }
  defOf(node: Node | null): NormalizedDef | null {
    if (!node || node.kind !== "component") return null;
    return this.registry.byKey[node.componentKey] ?? null;
  }

  // --- history --------------------------------------------------------------
  /** Apply a new immutable document, recording the previous one for undo. */
  #commit(next: Document) {
    if (next === this.doc) return;
    this.#past = [...this.#past, this.doc].slice(-100);
    this.#future = [];
    this.doc = next;
  }
  undo() {
    const prev = this.#past.at(-1);
    if (!prev) return;
    this.#past = this.#past.slice(0, -1);
    this.#future = [this.doc, ...this.#future];
    this.doc = prev;
    this.#prune();
  }
  redo() {
    const next = this.#future[0];
    if (!next) return;
    this.#future = this.#future.slice(1);
    this.#past = [...this.#past, this.doc];
    this.doc = next;
    this.#prune();
  }
  /** Drop selection/hover ids that no longer exist (after undo/redo/remove). */
  #prune() {
    for (const id of [...this.selection]) if (!M.find(this.doc, id)) this.selection.delete(id);
    if (this.hover && !M.find(this.doc, this.hover)) this.hover = null;
  }

  // --- selection ------------------------------------------------------------
  select(id: string, additive = false) {
    if (additive) {
      if (this.selection.has(id)) this.selection.delete(id);
      else this.selection.add(id);
    } else {
      this.selection.clear();
      this.selection.add(id);
    }
  }
  selectOnly(ids: string[]) {
    this.selection.clear();
    for (const id of ids) this.selection.add(id);
  }
  clearSelection() {
    this.selection.clear();
  }
  isSelected(id: string) {
    return this.selection.has(id);
  }

  // --- mutations (each commits to history) ---------------------------------
  /** Where new nodes land: the single selected container, else the root. */
  #insertTarget(): string {
    const n = this.selectedNode;
    return n && n.kind === "container" ? n.id : this.doc.root.id;
  }

  addComponent(def: NormalizedDef, parentId?: string, index?: number): string {
    const node = componentFromDef(def);
    this.#commit(M.insert(this.doc, parentId ?? this.#insertTarget(), node, index));
    this.selectOnly([node.id]);
    return node.id;
  }
  addContainer(parentId?: string, index?: number): string {
    const node = M.makeContainer({ name: "Frame", direction: "column" });
    this.#commit(M.insert(this.doc, parentId ?? this.#insertTarget(), node, index));
    this.selectOnly([node.id]);
    return node.id;
  }
  insertNode(node: Node, parentId: string, index?: number) {
    this.#commit(M.insert(this.doc, parentId, node, index));
  }

  group() {
    const { doc, groupId } = M.group(this.doc, [...this.selection]);
    if (!groupId) return;
    this.#commit(doc);
    this.selectOnly([groupId]);
  }
  ungroup() {
    let next = this.doc;
    for (const id of [...this.selection]) {
      const n = M.find(next, id);
      if (n && n.kind === "container" && id !== next.root.id) next = M.ungroup(next, id);
    }
    this.#commit(next);
    this.#prune();
  }
  remove(ids: string[] = [...this.selection]) {
    this.#commit(M.remove(this.doc, ids));
    this.#prune();
  }
  duplicate(ids: string[] = [...this.selection]) {
    const { doc, newIds } = M.duplicate(this.doc, ids);
    this.#commit(doc);
    if (newIds.length) this.selectOnly(newIds);
  }
  move(ids: string[], targetParentId: string, index: number) {
    this.#commit(M.move(this.doc, ids, targetParentId, index));
  }

  update(id: string, patch: Partial<ContainerNode> & Partial<ComponentNode>) {
    this.#commit(M.update(this.doc, id, patch));
  }
  setVariant(id: string, key: string, value: unknown) {
    this.#commit(M.setVariant(this.doc, id, key, value));
  }
  setNote(id: string, note: string) {
    this.#commit(M.setNote(this.doc, id, note));
  }
  setDirection(id: string, direction: Direction) {
    this.update(id, { direction });
  }
  setAlign(id: string, align: Align) {
    this.update(id, { align });
  }
  setJustify(id: string, justify: Justify) {
    this.update(id, { justify });
  }
  setGap(id: string, gap: number) {
    this.update(id, { gap });
  }
  setWidth(id: string, width: SizeMode) {
    this.update(id, { width });
  }
  setHeight(id: string, height: SizeMode) {
    this.update(id, { height });
  }

  // --- output ---------------------------------------------------------------
  toXml() {
    return toXml(this.doc);
  }

  load(doc: Document) {
    this.#past = [];
    this.#future = [];
    this.selection.clear();
    this.hover = null;
    this.doc = doc;
  }
}
