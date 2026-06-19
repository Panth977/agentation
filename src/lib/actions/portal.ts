// Svelte action that relocates a node to another part of the DOM (default
// document.body). Mirrors React's createPortal — used to render overlays/popups
// outside the component's DOM subtree so they escape stacking/overflow contexts.
//
// Usage: <div use:portal>...</div>  or  <div use:portal={"#some-id"}>...</div>

export function portal(node: HTMLElement, target: HTMLElement | string = "body") {
  let targetEl: HTMLElement | null = null;

  function resolve(t: HTMLElement | string): HTMLElement | null {
    if (typeof t === "string") {
      return (document.querySelector(t) as HTMLElement | null) ?? document.body;
    }
    return t ?? document.body;
  }

  function mount(t: HTMLElement | string) {
    targetEl = resolve(t);
    if (targetEl) targetEl.appendChild(node);
  }

  mount(target);

  return {
    update(t: HTMLElement | string) {
      mount(t);
    },
    destroy() {
      if (node.parentNode) node.parentNode.removeChild(node);
    },
  };
}
