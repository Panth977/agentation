// =============================================================================
// Layout Editor — document model (semantic, alignment-based, XML-serializable)
// =============================================================================
// See docs/LAYOUT_EDITOR.md. A Document is a tree whose root is a container.
// Position is expressed by stacking + alignment, NOT coordinates (x/y is only
// used inside a `free` container as a last resort).

export type SizeMode = "hug" | "fill" | { fixed: number };
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
export type LayoutMode = "stack" | "grid" | "free";
export type Direction = "row" | "column";
export type Padding = { t: number; r: number; b: number; l: number };

export type ContainerNode = {
  id: string;
  kind: "container";
  name: string;
  layout: LayoutMode;
  direction: Direction;
  gap: number;
  padding: Padding;
  align: Align;
  justify: Justify;
  wrap: boolean;
  cols?: number; // grid
  width: SizeMode;
  height: SizeMode;
  x?: number; // only meaningful when the PARENT layout is "free"
  y?: number;
  hidden?: boolean;
  locked?: boolean;
  children: Node[];
};

export type ComponentNode = {
  id: string;
  kind: "component";
  name: string;
  componentKey: string;
  src?: string;
  variantValues: Record<string, unknown>;
  note?: string;
  alignSelf?: Align;
  width: SizeMode;
  height: SizeMode;
  x?: number;
  y?: number;
  hidden?: boolean;
  locked?: boolean;
};

export type Node = ContainerNode | ComponentNode;
export type Document = { root: ContainerNode };

export const isContainer = (n: Node): n is ContainerNode => n.kind === "container";

// -----------------------------------------------------------------------------
// IDs
// -----------------------------------------------------------------------------

let _idSeq = 0;
/** Stable-enough unique id (avoids Date/Math.random determinism concerns). */
export function newId(prefix = "n"): string {
  _idSeq += 1;
  return `${prefix}_${_idSeq.toString(36)}_${(_idSeq * 2654435761 % 1e6).toString(36)}`;
}

// -----------------------------------------------------------------------------
// Factories
// -----------------------------------------------------------------------------

export function emptyPadding(): Padding {
  return { t: 0, r: 0, b: 0, l: 0 };
}

export function makeContainer(partial: Partial<ContainerNode> = {}): ContainerNode {
  return {
    id: partial.id ?? newId("c"),
    kind: "container",
    name: partial.name ?? "Frame",
    layout: partial.layout ?? "stack",
    direction: partial.direction ?? "column",
    gap: partial.gap ?? 12,
    padding: partial.padding ?? emptyPadding(),
    align: partial.align ?? "stretch",
    justify: partial.justify ?? "start",
    wrap: partial.wrap ?? false,
    cols: partial.cols,
    width: partial.width ?? "hug",
    height: partial.height ?? "hug",
    x: partial.x,
    y: partial.y,
    hidden: partial.hidden,
    locked: partial.locked,
    children: partial.children ?? [],
  };
}

export function makeRoot(children: Node[] = []): ContainerNode {
  return makeContainer({
    id: "root",
    name: "Screen",
    layout: "stack",
    direction: "column",
    gap: 16,
    padding: { t: 24, r: 24, b: 24, l: 24 },
    align: "stretch",
    width: { fixed: 1024 },
    height: "hug",
    children,
  });
}

export function emptyDocument(): Document {
  return { root: makeRoot() };
}

// -----------------------------------------------------------------------------
// Traversal / lookup (read-only)
// -----------------------------------------------------------------------------

export function walk(node: Node, fn: (n: Node, parent: ContainerNode | null) => void, parent: ContainerNode | null = null): void {
  fn(node, parent);
  if (isContainer(node)) for (const c of node.children) walk(c, fn, node);
}

export function find(doc: Document, id: string): Node | null {
  let found: Node | null = null;
  walk(doc.root, (n) => {
    if (n.id === id) found = n;
  });
  return found;
}

export function parentOf(doc: Document, id: string): ContainerNode | null {
  let parent: ContainerNode | null = null;
  walk(doc.root, (n, p) => {
    if (n.id === id) parent = p;
  });
  return parent;
}

/** Ancestor chain from root → node's parent (inclusive of root, excluding node). */
export function ancestors(doc: Document, id: string): ContainerNode[] {
  const path: ContainerNode[] = [];
  function rec(node: Node): boolean {
    if (node.id === id) return true;
    if (isContainer(node)) {
      for (const c of node.children) {
        if (rec(c)) {
          path.unshift(node);
          return true;
        }
      }
    }
    return false;
  }
  rec(doc.root);
  return path;
}

/** True if `maybeAncestorId` is an ancestor of (or equal to) `id`. */
export function isAncestor(doc: Document, maybeAncestorId: string, id: string): boolean {
  if (maybeAncestorId === id) return true;
  const node = find(doc, maybeAncestorId);
  if (!node || !isContainer(node)) return false;
  let hit = false;
  walk(node, (n) => {
    if (n.id === id) hit = true;
  });
  return hit;
}

// -----------------------------------------------------------------------------
// Immutable transforms
// -----------------------------------------------------------------------------

/**
 * Rebuild the tree, replacing the node with `id` by `fn(node)`. Returning the
 * node unchanged is fine; returning `null` removes it. Only nodes on the path to
 * the target are re-created (structural sharing elsewhere).
 */
function mapNode(node: Node, id: string, fn: (n: Node) => Node | null): Node | null {
  if (node.id === id) return fn(node);
  if (!isContainer(node)) return node;
  let changed = false;
  const next: Node[] = [];
  for (const c of node.children) {
    const r = mapNode(c, id, fn);
    if (r !== c) changed = true;
    if (r) next.push(r);
  }
  return changed ? { ...node, children: next } : node;
}

function withRoot(doc: Document, root: Node | null): Document {
  if (!root || !isContainer(root)) return doc; // never drop/replace root with a leaf
  return { root };
}

/** Generic shallow patch of a node by id. */
export function update(doc: Document, id: string, patch: Partial<ContainerNode> & Partial<ComponentNode>): Document {
  return withRoot(doc, mapNode(doc.root, id, (n) => ({ ...n, ...patch }) as Node));
}

export function setVariant(doc: Document, id: string, key: string, value: unknown): Document {
  const n = find(doc, id);
  if (!n || n.kind !== "component") return doc;
  return update(doc, id, { variantValues: { ...n.variantValues, [key]: value } });
}

export function setNote(doc: Document, id: string, note: string): Document {
  return update(doc, id, { note });
}

/** Insert `node` as a child of `parentId` at `index` (default: append). */
export function insert(doc: Document, parentId: string, node: Node, index?: number): Document {
  return withRoot(
    doc,
    mapNode(doc.root, parentId, (p) => {
      if (!isContainer(p)) return p;
      const children = [...p.children];
      children.splice(index ?? children.length, 0, node);
      return { ...p, children };
    }),
  );
}

/** Remove nodes by id (root is never removed). */
export function remove(doc: Document, ids: string[]): Document {
  const idSet = new Set(ids.filter((id) => id !== doc.root.id));
  function rec(node: Node): Node {
    if (!isContainer(node)) return node;
    const children = node.children.filter((c) => !idSet.has(c.id)).map(rec);
    return { ...node, children };
  }
  return { root: rec(doc.root) as ContainerNode };
}

/**
 * Move `ids` into `targetParentId` at `index`. Skips moves that would create a
 * cycle (moving a container into its own descendant). Preserves order of ids.
 */
export function move(doc: Document, ids: string[], targetParentId: string, index: number): Document {
  const target = find(doc, targetParentId);
  if (!target || !isContainer(target)) return doc;
  // Filter out ids that are ancestors of the target (would create a cycle) or the target itself.
  const movable = ids.filter((id) => id !== doc.root.id && !isAncestor(doc, id, targetParentId));
  if (movable.length === 0) return doc;

  const nodes = movable.map((id) => find(doc, id)).filter(Boolean) as Node[];
  // Adjust index if removing earlier siblings from the same parent shifts it.
  const targetChildrenIds = (target.children ?? []).map((c) => c.id);
  let adjusted = index;
  for (const id of movable) {
    const pos = targetChildrenIds.indexOf(id);
    if (pos !== -1 && pos < index) adjusted -= 1;
  }

  let next = remove(doc, movable);
  // Re-insert in order at the (adjusted) position.
  next = withRoot(
    next,
    mapNode(next.root, targetParentId, (p) => {
      if (!isContainer(p)) return p;
      const children = [...p.children];
      children.splice(Math.max(0, Math.min(adjusted, children.length)), 0, ...nodes);
      return { ...p, children };
    }),
  );
  return next;
}

/**
 * Group `ids` (which must be siblings under one parent) into a new container,
 * placed at the position of the earliest selected sibling. Returns the new doc
 * and the new container id (or null if not groupable).
 */
export function group(doc: Document, ids: string[]): { doc: Document; groupId: string | null } {
  const idSet = new Set(ids);
  const parent = ids.length ? parentOf(doc, ids[0]) : null;
  if (!parent || ids.length < 1) return { doc, groupId: null };
  // All must share the same parent.
  if (!ids.every((id) => parentOf(doc, id)?.id === parent.id)) return { doc, groupId: null };

  const selected = parent.children.filter((c) => idSet.has(c.id));
  const firstIndex = parent.children.findIndex((c) => idSet.has(c.id));
  const groupNode = makeContainer({
    name: "Group",
    layout: "stack",
    direction: "column",
    align: "stretch",
    width: "hug",
    height: "hug",
    children: selected,
  });
  const nextChildren: Node[] = [];
  parent.children.forEach((c, i) => {
    if (i === firstIndex) nextChildren.push(groupNode);
    if (!idSet.has(c.id)) nextChildren.push(c);
  });
  const nextDoc = withRoot(
    doc,
    mapNode(doc.root, parent.id, (p) => (isContainer(p) ? { ...p, children: nextChildren } : p)),
  );
  return { doc: nextDoc, groupId: groupNode.id };
}

/** Ungroup a container: replace it in its parent with its children. */
export function ungroup(doc: Document, containerId: string): Document {
  if (containerId === doc.root.id) return doc;
  const node = find(doc, containerId);
  if (!node || !isContainer(node)) return doc;
  const parent = parentOf(doc, containerId);
  if (!parent) return doc;
  const nextChildren: Node[] = [];
  for (const c of parent.children) {
    if (c.id === containerId) nextChildren.push(...node.children);
    else nextChildren.push(c);
  }
  return withRoot(
    doc,
    mapNode(doc.root, parent.id, (p) => (isContainer(p) ? { ...p, children: nextChildren } : p)),
  );
}

/** Deep-clone a subtree with fresh ids. */
export function cloneWithNewIds(node: Node): Node {
  if (isContainer(node)) {
    return { ...node, id: newId("c"), children: node.children.map(cloneWithNewIds) };
  }
  return { ...node, id: newId("n") };
}

/** Duplicate nodes in place (right after each original). */
export function duplicate(doc: Document, ids: string[]): { doc: Document; newIds: string[] } {
  const newIds: string[] = [];
  let next = doc;
  for (const id of ids) {
    const parent = parentOf(next, id);
    const node = find(next, id);
    if (!parent || !node) continue;
    const idx = parent.children.findIndex((c) => c.id === id);
    const clone = cloneWithNewIds(node);
    newIds.push(clone.id);
    next = insert(next, parent.id, clone, idx + 1);
  }
  return { doc: next, newIds };
}
