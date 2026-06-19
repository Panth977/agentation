<script lang="ts">
  import type { ComponentType } from "./types.js";

  let { type }: { type: ComponentType } = $props();

  const s = "currentColor";
  const sw = "0.5";
</script>

{#if type === "navigation"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="4" width="18" height="8" rx="1" stroke={s} stroke-width={sw} />
    <rect x="2.5" y="7" width="3" height="1.5" rx=".5" fill={s} opacity=".4" />
    <rect x="7" y="7" width="2.5" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="11" y="7" width="2.5" height="1.5" rx=".5" fill={s} opacity=".25" />
  </svg>
{:else if type === "header"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="2" width="18" height="12" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3" y="5.5" width="8" height="2" rx=".5" fill={s} opacity=".35" />
    <rect x="3" y="9" width="12" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "hero"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="1" width="18" height="14" rx="1" stroke={s} stroke-width={sw} />
    <rect x="5" y="5" width="10" height="1.5" rx=".5" fill={s} opacity=".35" />
    <rect x="7" y="8" width="6" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="7.5" y="10.5" width="5" height="2.5" rx="1" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "section"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="1" width="18" height="14" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3" y="4" width="6" height="1" rx=".5" fill={s} opacity=".3" />
    <rect x="3" y="6.5" width="14" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="3" y="9" width="10" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "sidebar"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="1" width="7" height="14" rx="1" stroke={s} stroke-width={sw} />
    <rect x="2.5" y="4" width="4" height="1" rx=".5" fill={s} opacity=".3" />
    <rect x="2.5" y="6.5" width="3.5" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="2.5" y="9" width="4" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "footer"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="7" width="18" height="8" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3" y="9.5" width="4" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="9" y="9.5" width="4" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="15" y="9.5" width="3" height="1" rx=".5" fill={s} opacity=".2" />
  </svg>
{:else if type === "modal"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="2" width="14" height="12" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="5" y="4.5" width="7" height="1" rx=".5" fill={s} opacity=".3" />
    <rect x="5" y="7" width="10" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="11" y="11" width="5" height="2" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "divider"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <line x1="2" y1="8" x2="18" y2="8" stroke={s} stroke-width="0.5" opacity=".3" />
  </svg>
{:else if type === "card"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1" width="16" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="2" y="1" width="16" height="5.5" rx="1" fill={s} opacity=".04" />
    <rect x="4" y="8.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="4" y="11" width="11" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "text"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="4" width="14" height="1.5" rx=".5" fill={s} opacity=".3" />
    <rect x="2" y="7" width="11" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="2" y="9.5" width="13" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="2" y="12" width="8" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "image"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="12" rx="1" stroke={s} stroke-width={sw} />
    <line x1="2" y1="2" x2="18" y2="14" stroke={s} stroke-width=".3" opacity=".25" />
    <line x1="18" y1="2" x2="2" y2="14" stroke={s} stroke-width=".3" opacity=".25" />
  </svg>
{:else if type === "video"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="12" rx="1" stroke={s} stroke-width={sw} />
    <path d="M8.5 5.5v5l4.5-2.5z" stroke={s} stroke-width={sw} fill={s} opacity=".15" />
  </svg>
{:else if type === "table"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="2" width="18" height="12" rx="1" stroke={s} stroke-width={sw} />
    <line x1="1" y1="5.5" x2="19" y2="5.5" stroke={s} stroke-width=".3" opacity=".25" />
    <line x1="1" y1="9" x2="19" y2="9" stroke={s} stroke-width=".3" opacity=".25" />
    <line x1="7" y1="2" x2="7" y2="14" stroke={s} stroke-width=".3" opacity=".25" />
    <line x1="13" y1="2" x2="13" y2="14" stroke={s} stroke-width=".3" opacity=".25" />
  </svg>
{:else if type === "grid"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1.5" y="2" width="7" height="5.5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="11.5" y="2" width="7" height="5.5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="1.5" y="9.5" width="7" height="5.5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="11.5" y="9.5" width="7" height="5.5" rx="1" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "list"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="3.5" cy="4.5" r="1" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="4" width="10" height="1" rx=".5" fill={s} opacity=".2" />
    <circle cx="3.5" cy="8" r="1" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".2" />
    <circle cx="3.5" cy="11.5" r="1" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="11" width="11" height="1" rx=".5" fill={s} opacity=".2" />
  </svg>
{:else if type === "chart"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="9" width="2.5" height="4" rx=".5" fill={s} opacity=".2" />
    <rect x="7" y="6" width="2.5" height="7" rx=".5" fill={s} opacity=".25" />
    <rect x="11" y="3" width="2.5" height="10" rx=".5" fill={s} opacity=".3" />
    <rect x="15" y="5" width="2.5" height="8" rx=".5" fill={s} opacity=".2" />
  </svg>
{:else if type === "accordion"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1.5" y="2" width="17" height="4" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3" y="3.5" width="6" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="1.5" y="7.5" width="17" height="3" rx="1" stroke={s} stroke-width={sw} />
    <rect x="1.5" y="12" width="17" height="3" rx="1" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "carousel"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="2" width="14" height="10" rx="1" stroke={s} stroke-width={sw} />
    <path d="M1.5 7L3 8.5 1.5 10" stroke={s} stroke-width={sw} opacity=".35" />
    <path d="M18.5 7L17 8.5 18.5 10" stroke={s} stroke-width={sw} opacity=".35" />
    <circle cx="8.5" cy="14" r=".6" fill={s} opacity=".35" />
    <circle cx="10" cy="14" r=".6" fill={s} opacity=".15" />
    <circle cx="11.5" cy="14" r=".6" fill={s} opacity=".15" />
  </svg>
{:else if type === "button"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="5" width="14" height="6" rx="2" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="7.5" width="7" height="1" rx=".5" fill={s} opacity=".25" />
  </svg>
{:else if type === "input"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="4" width="5.5" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="2" y="6.5" width="16" height="5.5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3.5" y="8.5" width="7" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "search"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="4.5" width="16" height="7" rx="3.5" stroke={s} stroke-width={sw} />
    <circle cx="6" cy="8" r="2" stroke={s} stroke-width={sw} opacity=".3" />
    <line x1="7.5" y1="9.5" x2="9" y2="11" stroke={s} stroke-width={sw} opacity=".3" />
    <rect x="9.5" y="7.5" width="6" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "form"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1.5" width="5.5" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="2" y="3.5" width="16" height="3" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="2" y="8" width="7" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="2" y="10" width="16" height="3" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="12" y="14" width="6" height="2" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "tabs"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="5" width="18" height="10" rx="1" stroke={s} stroke-width={sw} />
    <rect x="1" y="2" width="6" height="3.5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="2.5" y="3.25" width="3" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="7" y="2" width="6" height="3.5" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "dropdown"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="4" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3.5" y="3.5" width="7" height="1" rx=".5" fill={s} opacity=".2" />
    <path d="M15 3.5l1.5 1.5L18 3.5" stroke={s} stroke-width={sw} opacity=".3" />
    <rect x="2" y="7" width="16" height="7" rx="1" stroke={s} stroke-width={sw} stroke-dasharray="2 1" opacity=".3" />
  </svg>
{:else if type === "toggle"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="4" y="5" width="12" height="6" rx="3" stroke={s} stroke-width={sw} />
    <circle cx="13" cy="8" r="2" fill={s} opacity=".3" />
  </svg>
{:else if type === "avatar"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="10" cy="8" r="6" stroke={s} stroke-width={sw} />
    <circle cx="10" cy="6.5" r="2" stroke={s} stroke-width={sw} />
    <path d="M6.5 13c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "badge"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="5" width="14" height="6" rx="3" stroke={s} stroke-width={sw} />
    <rect x="6" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
  </svg>
{:else if type === "breadcrumb"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1.5" y="7" width="3.5" height="1" rx=".5" fill={s} opacity=".3" />
    <path d="M6.5 7l1 1-1 1" stroke={s} stroke-width={sw} opacity=".2" />
    <rect x="9" y="7" width="3.5" height="1" rx=".5" fill={s} opacity=".2" />
    <path d="M14 7l1 1-1 1" stroke={s} stroke-width={sw} opacity=".2" />
    <rect x="16.5" y="7" width="2" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "pagination"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="5.5" width="3.5" height="5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="5.5" width="3.5" height="5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="11" y="5.5" width="3.5" height="5" rx="1" fill={s} opacity=".15" stroke={s} stroke-width={sw} />
    <rect x="15.5" y="5.5" width="3.5" height="5" rx="1" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "progress"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="7" width="16" height="2" rx="1" stroke={s} stroke-width={sw} />
    <rect x="2" y="7" width="10" height="2" rx="1" fill={s} opacity=".2" />
  </svg>
{:else if type === "toast"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="4" width="16" height="8" rx="1.5" stroke={s} stroke-width={sw} />
    <circle cx="5" cy="8" r="1.5" stroke={s} stroke-width={sw} opacity=".3" />
    <rect x="8" y="6.5" width="7" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="8" y="9" width="5" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "tooltip"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="3" width="14" height="7" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="5.5" y="5.5" width="9" height="1" rx=".5" fill={s} opacity=".25" />
    <path d="M9 10l1 2.5 1-2.5" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "pricing"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1" width="16" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="6" y="3" width="8" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="7" y="5.5" width="6" height="2" rx=".5" fill={s} opacity=".15" />
    <rect x="5" y="9" width="10" height="1" rx=".5" fill={s} opacity=".1" />
    <rect x="5" y="11" width="10" height="1" rx=".5" fill={s} opacity=".1" />
    <rect x="6" y="13" width="8" height="1.5" rx=".5" fill={s} opacity=".2" />
  </svg>
{:else if type === "testimonial"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1" width="16" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <text x="4" y="5.5" font-size="4" fill={s} opacity=".2" font-family="serif">&ldquo;</text>
    <rect x="4" y="7" width="12" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="4" y="9" width="9" height="1" rx=".5" fill={s} opacity=".12" />
    <circle cx="5.5" cy="12.5" r="1.5" stroke={s} stroke-width={sw} opacity=".25" />
    <rect x="8" y="12" width="5" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "cta"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="2" width="18" height="12" rx="1" stroke={s} stroke-width={sw} />
    <rect x="5" y="4.5" width="10" height="1.5" rx=".5" fill={s} opacity=".3" />
    <rect x="6" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="7" y="10" width="6" height="2.5" rx="1" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "alert"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="4" width="16" height="8" rx="1.5" stroke={s} stroke-width={sw} />
    <circle cx="6" cy="8" r="2" stroke={s} stroke-width={sw} opacity=".3" />
    <line x1="6" y1="7" x2="6" y2="8.5" stroke={s} stroke-width="0.6" opacity=".5" />
    <circle cx="6" cy="9.3" r=".3" fill={s} opacity=".5" />
    <rect x="9.5" y="7" width="6" height="1" rx=".5" fill={s} opacity=".2" />
  </svg>
{:else if type === "banner"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1" y="5" width="18" height="6" rx="1" stroke={s} stroke-width={sw} />
    <rect x="4" y="7.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="14" y="7" width="3.5" height="2" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "stat"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="2" width="14" height="12" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="6" y="4.5" width="8" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="5" y="7" width="10" height="2.5" rx=".5" fill={s} opacity=".3" />
    <rect x="7" y="11" width="6" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "stepper"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="4" cy="8" r="2" fill={s} opacity=".2" stroke={s} stroke-width={sw} />
    <line x1="6" y1="8" x2="8" y2="8" stroke={s} stroke-width=".4" opacity=".3" />
    <circle cx="10" cy="8" r="2" stroke={s} stroke-width={sw} />
    <line x1="12" y1="8" x2="14" y2="8" stroke={s} stroke-width=".4" opacity=".3" />
    <circle cx="16" cy="8" r="2" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "tag"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="5" width="14" height="6" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="5.5" y="7.5" width="6" height="1" rx=".5" fill={s} opacity=".25" />
    <line x1="14" y1="6.5" x2="15.5" y2="9.5" stroke={s} stroke-width={sw} opacity=".2" />
    <line x1="15.5" y1="6.5" x2="14" y2="9.5" stroke={s} stroke-width={sw} opacity=".2" />
  </svg>
{:else if type === "rating"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <path d="M4 5.5l1 2 2.2.3-1.6 1.5.4 2.2L4 10.3l-2 1.2.4-2.2L.8 7.8 3 7.5z" fill={s} opacity=".25" />
    <path d="M10 5.5l1 2 2.2.3-1.6 1.5.4 2.2L10 10.3l-2 1.2.4-2.2L6.8 7.8 9 7.5z" fill={s} opacity=".25" />
    <path d="M16 5.5l1 2 2.2.3-1.6 1.5.4 2.2L16 10.3l-2 1.2.4-2.2-1.6-1.5 2.2-.3z" stroke={s} stroke-width={sw} opacity=".25" />
  </svg>
{:else if type === "map"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="12" rx="1" stroke={s} stroke-width={sw} />
    <line x1="2" y1="6" x2="18" y2="10" stroke={s} stroke-width=".3" opacity=".15" />
    <line x1="7" y1="2" x2="11" y2="14" stroke={s} stroke-width=".3" opacity=".15" />
    <path d="M10 5c-1.7 0-3 1.3-3 3 0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.3-3-3-3z" fill={s} opacity=".15" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "timeline"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <line x1="5" y1="2" x2="5" y2="14" stroke={s} stroke-width=".4" opacity=".25" />
    <circle cx="5" cy="4" r="1.5" fill={s} opacity=".2" stroke={s} stroke-width={sw} />
    <rect x="8" y="3" width="8" height="1" rx=".5" fill={s} opacity=".25" />
    <circle cx="5" cy="8.5" r="1.5" stroke={s} stroke-width={sw} />
    <rect x="8" y="7.5" width="6" height="1" rx=".5" fill={s} opacity=".15" />
    <circle cx="5" cy="13" r="1.5" stroke={s} stroke-width={sw} />
    <rect x="8" y="12" width="7" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "fileUpload"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="2" width="14" height="12" rx="1.5" stroke={s} stroke-width={sw} stroke-dasharray="2 1" />
    <path d="M10 10V5.5m0 0L7.5 8m2.5-2.5L12.5 8" stroke={s} stroke-width={sw} opacity=".3" />
    <rect x="7" y="11.5" width="6" height="1" rx=".5" fill={s} opacity=".15" />
  </svg>
{:else if type === "codeBlock"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="12" rx="1" stroke={s} stroke-width={sw} />
    <circle cx="4" cy="4" r=".6" fill={s} opacity=".3" />
    <circle cx="5.5" cy="4" r=".6" fill={s} opacity=".3" />
    <circle cx="7" cy="4" r=".6" fill={s} opacity=".3" />
    <rect x="4" y="7" width="7" height="1" rx=".5" fill={s} opacity=".2" />
    <rect x="6" y="9" width="5" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="4" y="11" width="8" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "calendar"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="3" width="16" height="12" rx="1" stroke={s} stroke-width={sw} />
    <line x1="2" y1="6.5" x2="18" y2="6.5" stroke={s} stroke-width=".4" opacity=".25" />
    <rect x="5" y="4" width="1" height="1.5" rx=".3" fill={s} opacity=".2" />
    <rect x="14" y="4" width="1" height="1.5" rx=".3" fill={s} opacity=".2" />
    <circle cx="7" cy="9" r=".6" fill={s} opacity=".2" />
    <circle cx="10" cy="9" r=".6" fill={s} opacity=".2" />
    <circle cx="13" cy="9" r=".6" fill={s} opacity=".3" />
    <circle cx="7" cy="12" r=".6" fill={s} opacity=".2" />
    <circle cx="10" cy="12" r=".6" fill={s} opacity=".2" />
  </svg>
{:else if type === "notification"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="3" width="16" height="10" rx="1.5" stroke={s} stroke-width={sw} />
    <circle cx="5.5" cy="8" r="2" stroke={s} stroke-width={sw} opacity=".25" />
    <rect x="9" y="6" width="6" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="9" y="8.5" width="4.5" height="1" rx=".5" fill={s} opacity=".12" />
    <circle cx="16.5" cy="4.5" r="1.5" fill={s} opacity=".25" />
  </svg>
{:else if type === "productCard"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="1" width="14" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="3" y="1" width="14" height="6" rx="1" fill={s} opacity=".04" />
    <rect x="5" y="8.5" width="7" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="5" y="10.5" width="4" height="1.5" rx=".5" fill={s} opacity=".15" />
    <rect x="12" y="12" width="4" height="2" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "profile"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="10" cy="5" r="3" stroke={s} stroke-width={sw} />
    <rect x="5" y="10" width="10" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="7" y="12.5" width="6" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "drawer"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="9" y="1" width="10" height="14" rx="1" stroke={s} stroke-width={sw} />
    <rect x="10.5" y="4" width="5" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="10.5" y="6.5" width="7" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="10.5" y="9" width="6" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="1" y="1" width="7" height="14" rx="1" stroke={s} stroke-width={sw} opacity=".15" />
  </svg>
{:else if type === "popover"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="2" width="14" height="9" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="5" y="4.5" width="8" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="5" y="7" width="6" height="1" rx=".5" fill={s} opacity=".15" />
    <path d="M9 11l1 2.5 1-2.5" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "logo"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="3" width="10" height="10" rx="2" stroke={s} stroke-width={sw} />
    <path d="M5 9.5l2-4 2 4" stroke={s} stroke-width={sw} opacity=".3" />
    <rect x="14" y="6" width="4" height="1" rx=".5" fill={s} opacity=".2" />
    <rect x="14" y="8.5" width="3" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "faq"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <text x="2.5" y="5.5" font-size="4" fill={s} opacity=".3" font-weight="bold">?</text>
    <rect x="7" y="3" width="10" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="7" y="5.5" width="8" height="1" rx=".5" fill={s} opacity=".12" />
    <text x="2.5" y="11.5" font-size="4" fill={s} opacity=".3" font-weight="bold">?</text>
    <rect x="7" y="9" width="9" height="1" rx=".5" fill={s} opacity=".25" />
    <rect x="7" y="11.5" width="7" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "gallery"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1.5" y="1.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="7.5" y="1.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="13.5" y="1.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="1.5" y="9.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="7.5" y="9.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="13.5" y="9.5" width="5" height="5" rx=".75" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "checkbox"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="5" y="4" width="8" height="8" rx="1.5" stroke={s} stroke-width={sw} />
    <path d="M7.5 8l1.5 1.5 3-3" stroke={s} stroke-width={sw} opacity=".35" />
  </svg>
{:else if type === "radio"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="10" cy="8" r="4" stroke={s} stroke-width={sw} />
    <circle cx="10" cy="8" r="2" fill={s} opacity=".3" />
  </svg>
{:else if type === "slider"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="7.5" width="16" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="2" y="7.5" width="10" height="1" rx=".5" fill={s} opacity=".25" />
    <circle cx="12" cy="8" r="2.5" stroke={s} stroke-width={sw} />
  </svg>
{:else if type === "datePicker"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1" width="16" height="5" rx="1" stroke={s} stroke-width={sw} />
    <rect x="3.5" y="3" width="5" height="1" rx=".5" fill={s} opacity=".2" />
    <rect x="14" y="2.5" width="2.5" height="2" rx=".5" fill={s} opacity=".12" />
    <rect x="2" y="7" width="16" height="8" rx="1" stroke={s} stroke-width={sw} stroke-dasharray="2 1" opacity=".3" />
    <circle cx="6" cy="10" r=".6" fill={s} opacity=".2" />
    <circle cx="10" cy="10" r=".6" fill={s} opacity=".3" />
    <circle cx="14" cy="10" r=".6" fill={s} opacity=".2" />
    <circle cx="6" cy="13" r=".6" fill={s} opacity=".2" />
    <circle cx="10" cy="13" r=".6" fill={s} opacity=".2" />
  </svg>
{:else if type === "skeleton"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="16" height="3" rx="1" fill={s} opacity=".08" />
    <rect x="2" y="7" width="10" height="2" rx=".75" fill={s} opacity=".08" />
    <rect x="2" y="11" width="13" height="2" rx=".75" fill={s} opacity=".08" />
  </svg>
{:else if type === "chip"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="1.5" y="5" width="10" height="6" rx="3" fill={s} opacity=".08" stroke={s} stroke-width={sw} />
    <rect x="4" y="7.5" width="4" height="1" rx=".5" fill={s} opacity=".25" />
    <line x1="9.5" y1="6.5" x2="10.5" y2="9.5" stroke={s} stroke-width={sw} opacity=".2" />
    <line x1="10.5" y1="6.5" x2="9.5" y2="9.5" stroke={s} stroke-width={sw} opacity=".2" />
    <rect x="13" y="5" width="5.5" height="6" rx="3" stroke={s} stroke-width={sw} opacity=".25" />
  </svg>
{:else if type === "icon"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <path d="M10 3l1.5 3 3.5.5-2.5 2.5.5 3.5L10 11l-3 1.5.5-3.5L5 6.5l3.5-.5z" stroke={s} stroke-width={sw} opacity=".3" />
  </svg>
{:else if type === "spinner"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="10" cy="8" r="5" stroke={s} stroke-width={sw} opacity=".12" />
    <path d="M10 3a5 5 0 0 1 5 5" stroke={s} stroke-width={sw} opacity=".35" stroke-linecap="round" />
  </svg>
{:else if type === "feature"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1.5" stroke={s} stroke-width={sw} />
    <path d="M4.5 3.5v3m-1.5-1.5h3" stroke={s} stroke-width={sw} opacity=".25" />
    <rect x="9" y="2.5" width="8" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="9" y="5.5" width="6" height="1" rx=".5" fill={s} opacity=".12" />
    <rect x="2" y="10" width="5" height="5" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="9" y="10.5" width="7" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="9" y="13.5" width="5" height="1" rx=".5" fill={s} opacity=".12" />
  </svg>
{:else if type === "team"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <circle cx="5" cy="5" r="2.5" stroke={s} stroke-width={sw} />
    <rect x="2.5" y="9" width="5" height="1" rx=".5" fill={s} opacity=".2" />
    <circle cx="15" cy="5" r="2.5" stroke={s} stroke-width={sw} />
    <rect x="12.5" y="9" width="5" height="1" rx=".5" fill={s} opacity=".2" />
    <circle cx="10" cy="5" r="2.5" stroke={s} stroke-width={sw} opacity=".5" />
    <rect x="7.5" y="9" width="5" height="1" rx=".5" fill={s} opacity=".15" />
    <rect x="4" y="12" width="12" height="1" rx=".5" fill={s} opacity=".1" />
  </svg>
{:else if type === "login"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="3" y="1" width="14" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="6" y="3" width="8" height="1.5" rx=".5" fill={s} opacity=".25" />
    <rect x="5" y="5.5" width="10" height="3" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="5" y="9.5" width="10" height="3" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="6.5" y="13.5" width="7" height="2" rx=".75" fill={s} opacity=".2" />
  </svg>
{:else if type === "contact"}
  <svg viewBox="0 0 20 16" width="20" height="16" fill="none">
    <rect x="2" y="1" width="16" height="14" rx="1.5" stroke={s} stroke-width={sw} />
    <rect x="4" y="3" width="5" height="1" rx=".5" fill={s} opacity=".2" />
    <rect x="4" y="5" width="12" height="2.5" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="4" y="8.5" width="12" height="4" rx=".75" stroke={s} stroke-width={sw} />
    <rect x="11" y="13.5" width="5" height="1.5" rx=".5" fill={s} opacity=".2" />
  </svg>
{/if}
