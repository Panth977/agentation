/**
 * Is this key press someone typing into an editor? Then the toolbar's single-key shortcuts
 * (P, L, C, H, X, Backspace…) must leave it alone.
 *
 * `e.target` alone misses two common cases:
 *  - shadow DOM: at the document the target is retargeted to the shadow host, so read the
 *    real origin from `composedPath()`;
 *  - editors that take text without a textarea or contenteditable: Monaco in Chromium types
 *    through an EditContext `<div role="textbox">`, and other editors use `role="textbox"`.
 */
export function isTypingEvent(e: Event): boolean {
  const origin = (e.composedPath?.()[0] ?? e.target) as Element | null;
  if (!origin || typeof (origin as Element).closest !== "function") return false;
  const el = origin as HTMLElement & { editContext?: unknown };
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  if (el.isContentEditable || el.editContext) return true;
  return !!el.closest('[role="textbox"], [role="combobox"], [role="searchbox"]');
}
