<script lang="ts">
  import type { ComponentType } from "./types.js";

  // =============================================================================
  // Wireframe Skeleton Renderers
  // =============================================================================
  //
  // Each component type gets a skeleton wireframe that scales to the given dimensions.
  // Uses inline styles referencing CSS custom properties from the layout mode overlay.

  let {
    type,
    width,
    height,
    text,
  }: { type: ComponentType; width: number; height: number; text?: string } = $props();

  const KNOWN_TYPES = new Set<ComponentType>([
    "navigation",
    "hero",
    "sidebar",
    "footer",
    "modal",
    "card",
    "text",
    "image",
    "table",
    "list",
    "button",
    "input",
    "form",
    "tabs",
    "avatar",
    "badge",
    "header",
    "section",
    "grid",
    "dropdown",
    "toggle",
    "search",
    "toast",
    "progress",
    "chart",
    "video",
    "tooltip",
    "breadcrumb",
    "pagination",
    "divider",
    "accordion",
    "carousel",
    "pricing",
    "testimonial",
    "cta",
    "alert",
    "banner",
    "stat",
    "stepper",
    "tag",
    "rating",
    "map",
    "timeline",
    "fileUpload",
    "codeBlock",
    "calendar",
    "notification",
    "productCard",
    "profile",
    "drawer",
    "popover",
    "logo",
    "faq",
    "gallery",
    "checkbox",
    "radio",
    "slider",
    "datePicker",
    "skeleton",
    "chip",
    "icon",
    "spinner",
    "feature",
    "team",
    "login",
    "contact",
  ]);

  const known = $derived(KNOWN_TYPES.has(type));

  function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  function dim(v: number | string): string {
    return typeof v === "number" ? `${v}px` : v;
  }
</script>

<!-- ===================== Helper snippets ===================== -->

{#snippet Bar(w: number | string, h: number = 3, strong: boolean = false)}
  <div
    style="width: {dim(w)}; height: {h}px; border-radius: 2px; background: {strong
      ? 'var(--agd-bar-strong)'
      : 'var(--agd-bar)'}; flex-shrink: 0;"
  ></div>
{/snippet}

{#snippet Block(w: number | string, h: number | string, radius: number = 3, extra: string = "")}
  <div
    style="width: {dim(w)}; height: {dim(
      h,
    )}; border-radius: {radius}px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); flex-shrink: 0;{extra}"
  ></div>
{/snippet}

{#snippet Circle(size: number)}
  <div
    style="width: {size}px; height: {size}px; border-radius: 50%; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); flex-shrink: 0;"
  ></div>
{/snippet}

<!-- ===================== Per-type skeletons ===================== -->

{#snippet NavigationSkeleton()}
  {@const pad = Math.max(8, height * 0.2)}
  <div style="display: flex; align-items: center; height: 100%; padding: 0 {pad}px; gap: {width * 0.02}px;">
    {@render Block(Math.max(20, height * 0.5), Math.max(12, height * 0.4), 2)}
    <div style="flex: 1; display: flex; gap: {width * 0.03}px; margin-left: {width * 0.04}px;">
      {@render Bar(width * 0.06)}
      {@render Bar(width * 0.07)}
      {@render Bar(width * 0.05)}
      {@render Bar(width * 0.06)}
    </div>
    {@render Block(width * 0.1, Math.min(28, height * 0.5), 4)}
  </div>
{/snippet}

{#snippet HeroSkeleton()}
  <div
    style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: {height *
      0.05}px;"
  >
    {#if text}
      <span
        style="font-size: {Math.min(20, height * 0.08)}px; font-weight: 600; color: var(--agd-text-3); text-align: center; max-width: 80%;"
        >{text}</span
      >
    {:else}
      {@render Bar(width * 0.5, Math.max(6, height * 0.04), true)}
    {/if}
    {@render Bar(width * 0.6)}
    {@render Bar(width * 0.4)}
    {@render Block(Math.min(140, width * 0.2), Math.min(36, height * 0.12), 6, ` margin-top: ${height * 0.06}px;`)}
  </div>
{/snippet}

{#snippet SidebarSkeleton()}
  {@const items = Math.max(3, Math.floor(height / 36))}
  <div style="padding: {width * 0.08}px; display: flex; flex-direction: column; gap: {height * 0.03}px;">
    {@render Bar(width * 0.6, 4, true)}
    {#each range(items) as i (i)}
      <div style="display: flex; align-items: center; gap: 6px;">
        {@render Block(10, 10, 2)}
        {@render Bar(width * (0.4 + ((i * 17) % 30) / 100))}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet FooterSkeleton()}
  {@const cols = Math.max(2, Math.min(4, Math.floor(width / 160)))}
  <div style="display: flex; padding: {height * 0.12}px {width * 0.03}px; gap: {width * 0.05}px;">
    {#each range(cols) as i (i)}
      <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        {@render Bar("60%", 3, true)}
        {@render Bar("80%", 2)}
        {@render Bar("70%", 2)}
        {@render Bar("60%", 2)}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet ModalSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div
      style="padding: 10px 12px; border-bottom: 1px solid var(--agd-stroke); display: flex; align-items: center; justify-content: space-between;"
    >
      {@render Bar(width * 0.3, 4, true)}
      <div style="width: 14px; height: 14px; border: 1px solid var(--agd-stroke); border-radius: 3px;"></div>
    </div>
    <div style="flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
      {@render Bar("90%")}
      {@render Bar("70%")}
      {@render Bar("80%")}
    </div>
    <div
      style="padding: 10px 12px; border-top: 1px solid var(--agd-stroke); display: flex; justify-content: flex-end; gap: 8px;"
    >
      {@render Block(70, 26, 4)}
      {@render Block(70, 26, 4, " background: var(--agd-bar);")}
    </div>
  </div>
{/snippet}

{#snippet CardSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="height: 40%; background: var(--agd-fill); border-bottom: 1px dashed var(--agd-stroke);"></div>
    <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 5px;">
      {@render Bar("70%", 4, true)}
      {@render Bar("95%", 2)}
      {@render Bar("85%", 2)}
      {@render Bar("50%", 2)}
    </div>
  </div>
{/snippet}

{#snippet TextSkeleton()}
  {#if text}
    <div
      style="padding: 4px; font-size: {Math.min(
        14,
        height * 0.3,
      )}px; line-height: 1.5; color: var(--agd-text-3); word-break: break-word; overflow: hidden;"
    >
      {text}
    </div>
  {:else}
    {@const lines = Math.max(2, Math.floor(height / 18))}
    <div style="display: flex; flex-direction: column; gap: 6px; padding: 4px;">
      {@render Bar(width * 0.6, 5, true)}
      {#each range(lines) as i (i)}
        {@render Bar(`${70 + ((i * 13) % 25)}%`, 2)}
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet ImageSkeleton()}
  <div style="height: 100%; position: relative;">
    <svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="none" fill="none">
      <line x1="0" y1="0" x2={width} y2={height} stroke="var(--agd-stroke)" stroke-width="1" />
      <line x1={width} y1="0" x2="0" y2={height} stroke="var(--agd-stroke)" stroke-width="1" />
      <circle
        cx={width * 0.3}
        cy={height * 0.3}
        r={Math.min(width, height) * 0.08}
        fill="var(--agd-fill)"
        stroke="var(--agd-stroke)"
        stroke-width="0.8"
      />
    </svg>
  </div>
{/snippet}

{#snippet TableSkeleton()}
  {@const cols = Math.max(2, Math.min(5, Math.floor(width / 100)))}
  {@const rows = Math.max(2, Math.min(6, Math.floor(height / 32)))}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="display: flex; border-bottom: 1px solid var(--agd-stroke); padding: 6px 0;">
      {#each range(cols) as i (i)}
        <div style="flex: 1; padding: 0 8px;">{@render Bar("70%", 3, true)}</div>
      {/each}
    </div>
    {#each range(rows) as r (r)}
      <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.03); padding: 6px 0;">
        {#each range(cols) as c (c)}
          <div style="flex: 1; padding: 0 8px;">{@render Bar(`${50 + ((r * 7 + c * 13) % 40)}%`, 2)}</div>
        {/each}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet ListSkeleton()}
  {@const items = Math.max(2, Math.floor(height / 28))}
  <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
    {#each range(items) as i (i)}
      <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
        {@render Circle(8)}
        {@render Bar(`${55 + ((i * 17) % 35)}%`, 2)}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet ButtonSkeleton()}
  <div
    style="height: 100%; border-radius: {Math.min(
      8,
      height / 3,
    )}px; border: 1px solid var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; justify-content: center;"
  >
    {#if text}
      <span
        style="font-size: {Math.min(
          13,
          height * 0.4,
        )}px; font-weight: 500; color: var(--agd-text-3); letter-spacing: -0.01em;">{text}</span
      >
    {:else}
      {@render Bar(Math.max(20, width * 0.5), 3, true)}
    {/if}
  </div>
{/snippet}

{#snippet InputSkeleton()}
  <div style="display: flex; flex-direction: column; gap: 4px; height: 100%; justify-content: center;">
    {@render Bar(Math.min(80, width * 0.3), 2)}
    <div
      style="height: {Math.min(
        36,
        height * 0.6,
      )}px; border-radius: 4px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding-left: 8px;"
    >
      {@render Bar("40%", 2)}
    </div>
  </div>
{/snippet}

{#snippet FormSkeleton()}
  {@const fields = Math.max(2, Math.min(5, Math.floor(height / 56)))}
  <div style="display: flex; flex-direction: column; gap: {height * 0.04}px; padding: 8px;">
    {#each range(fields) as i (i)}
      <div style="display: flex; flex-direction: column; gap: 4px;">
        {@render Bar(60 + ((i * 17) % 30), 2)}
        {@render Block("100%", 28, 4)}
      </div>
    {/each}
    {@render Block(
      Math.min(120, width * 0.35),
      30,
      6,
      " margin-top: 8px; align-self: flex-end; background: var(--agd-bar);",
    )}
  </div>
{/snippet}

{#snippet TabsSkeleton()}
  {@const tabCount = Math.max(2, Math.min(4, Math.floor(width / 120)))}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="display: flex; gap: 2px; border-bottom: 1px solid var(--agd-stroke);">
      {#each range(tabCount) as i (i)}
        <div style="padding: 8px 12px; border-bottom: {i === 0 ? '2px solid var(--agd-bar-strong)' : 'none'};">
          {@render Bar(60, 3, i === 0)}
        </div>
      {/each}
    </div>
    <div style="flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 6px;">
      {@render Bar("80%", 2)}
      {@render Bar("65%", 2)}
      {@render Bar("75%", 2)}
    </div>
  </div>
{/snippet}

{#snippet AvatarSkeleton()}
  {@const r = Math.min(width, height) / 2}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <circle
      cx={width / 2}
      cy={height / 2}
      r={r - 1}
      stroke="var(--agd-stroke)"
      fill="var(--agd-fill)"
      stroke-width="1.5"
      stroke-dasharray="3 2"
    />
    <circle
      cx={width / 2}
      cy={height * 0.38}
      r={r * 0.28}
      stroke="var(--agd-stroke)"
      fill="var(--agd-fill)"
      stroke-width="0.8"
    />
    <path
      d="M{width / 2 - r * 0.55} {height * 0.78} C{width / 2 - r * 0.55} {height * 0.55} {width / 2 +
        r * 0.55} {height * 0.55} {width / 2 + r * 0.55} {height * 0.78}"
      stroke="var(--agd-stroke)"
      fill="var(--agd-fill)"
      stroke-width="0.8"
    />
  </svg>
{/snippet}

{#snippet BadgeSkeleton()}
  <div
    style="height: 100%; border-radius: {height /
      2}px; border: 1px solid var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; justify-content: center;"
  >
    {@render Bar(Math.max(16, width * 0.5), 2, true)}
  </div>
{/snippet}

{#snippet HeaderSkeleton()}
  <div
    style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: {height *
      0.08}px;"
  >
    {@render Bar(width * 0.5, Math.max(5, height * 0.06), true)}
    {@render Bar(width * 0.35)}
  </div>
{/snippet}

{#snippet SectionSkeleton()}
  <div
    style="display: flex; flex-direction: column; height: 100%; gap: {height * 0.04}px; padding: {width *
      0.04}px;"
  >
    {@render Bar(width * 0.3, 4, true)}
    {@render Bar(width * 0.7)}
    {@render Bar(width * 0.5)}
    <div style="flex: 1; display: flex; gap: {width * 0.03}px; margin-top: {height * 0.06}px;">
      {@render Block("33%", "100%", 4)}
      {@render Block("33%", "100%", 4)}
      {@render Block("33%", "100%", 4)}
    </div>
  </div>
{/snippet}

{#snippet GridSkeleton()}
  {@const cols = Math.max(2, Math.min(4, Math.floor(width / 140)))}
  {@const rows = Math.max(1, Math.min(3, Math.floor(height / 120)))}
  <div
    style="display: grid; grid-template-columns: repeat({cols}, 1fr); grid-template-rows: repeat({rows}, 1fr); gap: 6px; height: 100%;"
  >
    {#each range(cols * rows) as i (i)}
      {@render Block("100%", "100%", 4)}
    {/each}
  </div>
{/snippet}

{#snippet DropdownSkeleton()}
  {@const items = Math.max(2, Math.floor((height - 32) / 28))}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 6px 8px; border-bottom: 1px solid var(--agd-stroke);">
      {@render Bar(width * 0.5, 3, true)}
    </div>
    <div style="flex: 1; padding: 4px; display: flex; flex-direction: column; gap: 2px;">
      {#each range(items) as i (i)}
        <div style="padding: 4px 6px; border-radius: 3px; background: {i === 0 ? 'var(--agd-fill)' : 'transparent'};">
          {@render Bar(`${50 + ((i * 17) % 35)}%`, 2, i === 0)}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet ToggleSkeleton()}
  {@const r = Math.min(width, height) / 2}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <rect x="1" y="1" width={width - 2} height={height - 2} rx={r} stroke="var(--agd-stroke)" stroke-width="1" />
    <circle cx={width - r} cy={height / 2} r={r * 0.7} fill="var(--agd-bar)" />
  </svg>
{/snippet}

{#snippet SearchSkeleton()}
  {@const r = Math.min(height / 2, 20)}
  <div
    style="height: 100%; border-radius: {r}px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 {r *
      0.6}px; gap: 6px;"
  >
    {@render Circle(Math.min(14, height * 0.4))}
    {@render Bar("50%", 2)}
  </div>
{/snippet}

{#snippet ToastSkeleton()}
  <div
    style="height: 100%; border-radius: 8px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 10px; gap: 8px;"
  >
    {@render Circle(Math.min(20, height * 0.5))}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
      {@render Bar("60%", 3, true)}
      {@render Bar("80%", 2)}
    </div>
    <div style="width: 14px; height: 14px; border: 1px solid var(--agd-stroke); border-radius: 3px; flex-shrink: 0;"></div>
  </div>
{/snippet}

{#snippet ProgressSkeleton()}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <rect x="0" y="0" width={width} height={height} rx={height / 2} stroke="var(--agd-stroke)" stroke-width="0.8" />
    <rect x="1" y="1" width={width * 0.65} height={height - 2} rx={(height - 2) / 2} fill="var(--agd-bar)" />
  </svg>
{/snippet}

{#snippet ChartSkeleton()}
  {@const bars = Math.max(3, Math.min(7, Math.floor(width / 50)))}
  {@const barW = width / (bars * 2)}
  <div
    style="height: 100%; display: flex; align-items: flex-end; justify-content: space-around; padding: 0 4px; border-bottom: 1px solid var(--agd-stroke);"
  >
    {#each range(bars) as i (i)}
      {@render Block(barW, `${30 + ((i * 37 + 17) % 55)}%`, 2)}
    {/each}
  </div>
{/snippet}

{#snippet VideoSkeleton()}
  {@const btnR = Math.min(width, height) * 0.12}
  <div style="height: 100%; position: relative; display: flex; align-items: center; justify-content: center;">
    {@render Block("100%", "100%", 4)}
    <div
      style="position: absolute; width: {btnR * 2}px; height: {btnR *
        2}px; border-radius: 50%; border: 1.5px solid var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; justify-content: center;"
    >
      <div
        style="width: 0; height: 0; border-left: {btnR * 0.6}px solid var(--agd-bar-strong); border-top: {btnR *
          0.4}px solid transparent; border-bottom: {btnR * 0.4}px solid transparent; margin-left: {btnR * 0.15}px;"
      ></div>
    </div>
  </div>
{/snippet}

{#snippet TooltipSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column; align-items: center;">
    <div
      style="flex: 1; width: 100%; border-radius: 6px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; justify-content: center;"
    >
      {@render Bar("60%", 2)}
    </div>
    <div
      style="width: 8px; height: 8px; background: var(--agd-fill); border: 1px dashed var(--agd-stroke); border-top: none; border-left: none; transform: rotate(45deg); margin-top: -5px;"
    ></div>
  </div>
{/snippet}

{#snippet BreadcrumbSkeleton()}
  {@const items = Math.max(2, Math.min(4, Math.floor(width / 80)))}
  <div style="display: flex; align-items: center; height: 100%; gap: 4px;">
    {#each range(items) as i (i)}
      <div style="display: flex; align-items: center; gap: 4px;">
        {#if i > 0}
          <span style="color: var(--agd-stroke); font-size: 10px;">/</span>
        {/if}
        {@render Bar(40 + ((i * 13) % 20), 2, i === items - 1)}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet PaginationSkeleton()}
  {@const count = Math.max(3, Math.min(5, Math.floor(width / 40)))}
  {@const sz = Math.min(28, height * 0.8)}
  <div style="display: flex; align-items: center; justify-content: center; height: 100%; gap: 4px;">
    {#each range(count) as i (i)}
      {@render Block(sz, sz, 4, i === 1 ? " background: var(--agd-bar);" : "")}
    {/each}
  </div>
{/snippet}

{#snippet DividerSkeleton()}
  <div style="display: flex; align-items: center; height: 100%;">
    <div style="width: 100%; height: 1px; background: var(--agd-stroke);"></div>
  </div>
{/snippet}

{#snippet AccordionSkeleton()}
  {@const items = Math.max(2, Math.min(4, Math.floor(height / 40)))}
  <div style="display: flex; flex-direction: column; height: 100%;">
    {#each range(items) as i (i)}
      <div
        style="border-bottom: 1px solid var(--agd-stroke); padding: 8px 6px; display: flex; align-items: center; justify-content: space-between; flex: {i ===
        0
          ? 2
          : 1};"
      >
        {@render Bar(`${40 + ((i * 17) % 25)}%`, 3, true)}
        <span style="font-size: 8px; color: var(--agd-stroke);">{i === 0 ? "▼" : "▶"}</span>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet CarouselSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column; gap: 6px;">
    <div style="flex: 1; display: flex; gap: 6px; align-items: center;">
      <span style="font-size: 12px; color: var(--agd-stroke);">‹</span>
      {@render Block("100%", "100%", 4)}
      <span style="font-size: 12px; color: var(--agd-stroke);">›</span>
    </div>
    <div style="display: flex; justify-content: center; gap: 4px;">
      {@render Circle(5)}
      {@render Circle(5)}
      {@render Circle(5)}
    </div>
  </div>
{/snippet}

{#snippet PricingSkeleton()}
  <div
    style="height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px; gap: {height *
      0.04}px;"
  >
    {@render Bar(width * 0.4, 3, true)}
    {@render Bar(width * 0.3, 6, true)}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 8px 0;">
      {#each range(4) as i (i)}
        <div style="display: flex; align-items: center; gap: 4px;">
          {@render Circle(5)}
          {@render Bar(`${50 + ((i * 17) % 35)}%`, 2)}
        </div>
      {/each}
    </div>
    {@render Block(width * 0.7, Math.min(32, height * 0.1), 6, " background: var(--agd-bar);")}
  </div>
{/snippet}

{#snippet TestimonialSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column; padding: 10px; gap: 8px;">
    <span style="font-size: 18px; line-height: 1; color: var(--agd-stroke); font-family: serif;">&ldquo;</span>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
      {@render Bar("90%", 2)}
      {@render Bar("75%", 2)}
      {@render Bar("60%", 2)}
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      {@render Circle(20)}
      <div style="display: flex; flex-direction: column; gap: 2px;">
        {@render Bar(60, 3, true)}
        {@render Bar(40, 2)}
      </div>
    </div>
  </div>
{/snippet}

{#snippet CtaSkeleton()}
  <div
    style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: {height *
      0.08}px;"
  >
    {@render Bar(width * 0.5, Math.max(4, height * 0.05), true)}
    {@render Bar(width * 0.35)}
    {@render Block(
      Math.min(140, width * 0.25),
      Math.min(32, height * 0.15),
      6,
      ` margin-top: ${height * 0.04}px; background: var(--agd-bar);`,
    )}
  </div>
{/snippet}

{#snippet AlertSkeleton()}
  <div
    style="height: 100%; border-radius: 6px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 10px; gap: 8px;"
  >
    <div
      style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--agd-bar-strong); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
    >
      <div style="width: 2px; height: 6px; background: var(--agd-bar-strong); border-radius: 1px;"></div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
      {@render Bar("40%", 3, true)}
      {@render Bar("70%", 2)}
    </div>
  </div>
{/snippet}

{#snippet BannerSkeleton()}
  <div
    style="height: 100%; background: var(--agd-fill); display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 12px;"
  >
    {@render Bar(width * 0.4, 3, true)}
    {@render Block(60, Math.min(24, height * 0.6), 4)}
  </div>
{/snippet}

{#snippet StatSkeleton()}
  <div
    style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {height *
      0.06}px;"
  >
    {@render Bar(width * 0.5, 2)}
    {@render Bar(width * 0.4, Math.max(8, height * 0.18), true)}
    {@render Bar(width * 0.3, 2)}
  </div>
{/snippet}

{#snippet StepperSkeleton()}
  {@const steps = Math.max(3, Math.min(5, Math.floor(width / 100)))}
  {@const dotR = Math.min(12, height * 0.35)}
  <div style="display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 8px;">
    {#each range(steps) as i (i)}
      <div style="display: flex; align-items: center; gap: 0; flex: 1;">
        <div
          style="width: {dotR}px; height: {dotR}px; border-radius: 50%; border: 1.5px solid var(--agd-stroke); background: {i ===
          0
            ? 'var(--agd-bar)'
            : 'transparent'}; flex-shrink: 0;"
        ></div>
        {#if i < steps - 1}
          <div style="flex: 1; height: 1px; background: var(--agd-stroke); margin: 0 4px;"></div>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet TagSkeleton()}
  <div
    style="height: 100%; border-radius: 4px; border: 1px solid var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; justify-content: center; gap: 4px; padding: 0 6px;"
  >
    {@render Bar(Math.max(16, width * 0.5), 2, true)}
    <div
      style="width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--agd-stroke); flex-shrink: 0;"
    ></div>
  </div>
{/snippet}

{#snippet RatingSkeleton()}
  {@const stars = 5}
  {@const sz = Math.min(height * 0.7, width / (stars * 1.5))}
  <div style="display: flex; align-items: center; justify-content: center; height: 100%; gap: {sz * 0.2}px;">
    {#each range(stars) as i (i)}
      <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5l2 4 4.5.7-3.25 3.1.75 4.5L8 11.4l-4 2.4.75-4.5L1.5 6.2 6 5.5z"
          stroke="var(--agd-stroke)"
          stroke-width="0.8"
          fill={i < 3 ? "var(--agd-bar)" : "none"}
        />
      </svg>
    {/each}
  </div>
{/snippet}

{#snippet MapSkeleton()}
  <div
    style="height: 100%; position: relative; border-radius: 4px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); overflow: hidden;"
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 {width} {height}"
      fill="none"
      style="position: absolute; inset: 0;"
    >
      <line x1={0} y1={height * 0.3} x2={width} y2={height * 0.7} stroke="var(--agd-stroke)" stroke-width="0.5" opacity=".2" />
      <line x1={0} y1={height * 0.6} x2={width} y2={height * 0.2} stroke="var(--agd-stroke)" stroke-width="0.5" opacity=".15" />
      <line x1={width * 0.4} y1={0} x2={width * 0.6} y2={height} stroke="var(--agd-stroke)" stroke-width="0.5" opacity=".15" />
    </svg>
    <div style="position: absolute; left: 50%; top: 40%; transform: translate(-50%, -100%);">
      <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
        <path d="M8 0C3.6 0 0 3.6 0 8c0 6 8 14 8 14s8-8 8-14c0-4.4-3.6-8-8-8z" fill="var(--agd-bar)" opacity=".4" />
        <circle cx="8" cy="8" r="3" fill="var(--agd-fill)" />
      </svg>
    </div>
  </div>
{/snippet}

{#snippet TimelineSkeleton()}
  {@const items = Math.max(3, Math.min(5, Math.floor(height / 60)))}
  <div style="display: flex; height: 100%; padding: 8px 0;">
    <div style="width: 16px; display: flex; flex-direction: column; align-items: center;">
      {#each range(items) as i (i)}
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          {@render Circle(8)}
          {#if i < items - 1}
            <div style="flex: 1; width: 1px; background: var(--agd-stroke);"></div>
          {/if}
        </div>
      {/each}
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-around; padding-left: 8px;">
      {#each range(items) as i (i)}
        <div style="display: flex; flex-direction: column; gap: 3px;">
          {@render Bar(`${35 + ((i * 13) % 25)}%`, 3, true)}
          {@render Bar(`${50 + ((i * 17) % 30)}%`, 2)}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet FileUploadSkeleton()}
  <div
    style="height: 100%; border-radius: 8px; border: 2px dashed var(--agd-stroke); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {height *
      0.06}px;"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="var(--agd-stroke)" stroke-width="1.5" />
      <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="var(--agd-stroke)" stroke-width="1.5" />
    </svg>
    {@render Bar(width * 0.4, 2)}
    {@render Bar(width * 0.25, 2)}
  </div>
{/snippet}

{#snippet CodeBlockSkeleton()}
  {@const lines = Math.max(3, Math.min(8, Math.floor(height / 20)))}
  <div
    style="height: 100%; border-radius: 6px; background: var(--agd-fill); border: 1px solid var(--agd-stroke); padding: 8px; display: flex; flex-direction: column; gap: 4px;"
  >
    <div style="display: flex; gap: 3px; margin-bottom: 4px;">
      {@render Circle(6)}
      {@render Circle(6)}
      {@render Circle(6)}
    </div>
    {#each range(lines) as i (i)}
      <div style="display: flex; gap: 6px; padding-left: {i > 0 && i < lines - 1 ? 12 : 0}px;">
        {@render Bar(`${25 + ((i * 23) % 50)}%`, 2, i === 0)}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet CalendarSkeleton()}
  {@const cols = 7}
  {@const rows = 5}
  {@const cellSz = Math.min((width - 16) / cols, (height - 40) / (rows + 1))}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px;">
      <span style="font-size: 8px; color: var(--agd-stroke);">‹</span>
      {@render Bar(width * 0.3, 3, true)}
      <span style="font-size: 8px; color: var(--agd-stroke);">›</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat({cols}, 1fr); gap: 2px; padding: 0 4px; flex: 1;">
      {#each range(cols) as i (`h${i}`)}
        <div style="display: flex; align-items: center; justify-content: center; height: {cellSz * 0.6}px;">
          {@render Bar(cellSz * 0.5, 2)}
        </div>
      {/each}
      {#each range(cols * rows) as i (i)}
        <div style="display: flex; align-items: center; justify-content: center; height: {cellSz}px;">
          <div
            style="width: {cellSz * 0.6}px; height: {cellSz *
              0.6}px; border-radius: 50%; background: {i === 12
              ? 'var(--agd-bar)'
              : 'transparent'}; display: flex; align-items: center; justify-content: center;"
          >
            <div
              style="width: 2px; height: 2px; border-radius: 1px; background: var(--agd-bar-strong); opacity: {i ===
              12
                ? 1
                : 0.3};"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet NotificationSkeleton()}
  <div
    style="height: 100%; border-radius: 8px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 10px; gap: 8px;"
  >
    {@render Circle(Math.min(32, height * 0.55))}
    <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
      {@render Bar("50%", 3, true)}
      {@render Bar("75%", 2)}
    </div>
    {@render Bar(30, 2)}
  </div>
{/snippet}

{#snippet ProductCardSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="height: 50%; background: var(--agd-fill); border-bottom: 1px dashed var(--agd-stroke);"></div>
    <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 5px;">
      {@render Bar("65%", 4, true)}
      {@render Bar("40%", 3)}
      <div style="flex: 1;"></div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        {@render Bar("30%", 5, true)}
        {@render Block(Math.min(70, width * 0.3), 26, 4, " background: var(--agd-bar);")}
      </div>
    </div>
  </div>
{/snippet}

{#snippet ProfileSkeleton()}
  {@const avatarSz = Math.min(48, height * 0.3)}
  <div
    style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {height *
      0.06}px;"
  >
    {@render Circle(avatarSz)}
    {@render Bar(width * 0.45, 4, true)}
    {@render Bar(width * 0.3, 2)}
    <div style="display: flex; gap: {width * 0.08}px; margin-top: {height * 0.04}px;">
      {#each range(3) as i (i)}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          {@render Bar(20, 3, true)}
          {@render Bar(28, 2)}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet DrawerSkeleton()}
  {@const panelW = Math.max(width * 0.6, 80)}
  {@const items = Math.max(3, Math.floor(height / 40))}
  <div style="height: 100%; display: flex;">
    <div style="width: {width - panelW}px; background: var(--agd-fill); opacity: 0.3;"></div>
    <div
      style="flex: 1; border-left: 1px solid var(--agd-stroke); display: flex; flex-direction: column; padding: {width *
        0.04}px;"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: {height * 0.06}px;">
        {@render Bar(panelW * 0.4, 4, true)}
        <div style="width: 12px; height: 12px; border: 1px solid var(--agd-stroke); border-radius: 3px;"></div>
      </div>
      {#each range(items) as i (i)}
        <div style="padding: 6px 0;">
          {@render Bar(`${50 + ((i * 17) % 35)}%`, 2, i === 0)}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet PopoverSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column; align-items: center;">
    <div
      style="flex: 1; width: 100%; border-radius: 8px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); padding: 10px; display: flex; flex-direction: column; gap: 5px;"
    >
      {@render Bar("70%", 3, true)}
      {@render Bar("90%", 2)}
      {@render Bar("60%", 2)}
    </div>
    <div
      style="width: 10px; height: 10px; background: var(--agd-fill); border: 1px dashed var(--agd-stroke); border-top: none; border-left: none; transform: rotate(45deg); margin-top: -6px;"
    ></div>
  </div>
{/snippet}

{#snippet LogoSkeleton()}
  {@const iconSz = Math.min(height * 0.7, width * 0.3)}
  <div style="height: 100%; display: flex; align-items: center; gap: {width * 0.08}px;">
    {@render Block(iconSz, iconSz, iconSz * 0.25)}
    {@render Bar(width * 0.45, Math.max(4, height * 0.2), true)}
  </div>
{/snippet}

{#snippet FaqSkeleton()}
  {@const items = Math.max(2, Math.min(5, Math.floor(height / 56)))}
  <div style="display: flex; flex-direction: column; height: 100%;">
    {#each range(items) as i (i)}
      <div
        style="border-bottom: 1px solid var(--agd-stroke); padding: 8px 6px; display: flex; align-items: center; justify-content: space-between; flex: {i ===
        0
          ? 2
          : 1};"
      >
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 9px; font-weight: 700; color: var(--agd-stroke);">Q</span>
          {@render Bar(width * (0.3 + ((i * 13) % 25) / 100), 3, true)}
        </div>
        <span style="font-size: 8px; color: var(--agd-stroke);">{i === 0 ? "▼" : "▶"}</span>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet GallerySkeleton()}
  {@const cols = Math.max(2, Math.min(4, Math.floor(width / 120)))}
  {@const rows = Math.max(1, Math.min(3, Math.floor(height / 120)))}
  <div
    style="display: grid; grid-template-columns: repeat({cols}, 1fr); grid-template-rows: repeat({rows}, 1fr); gap: 4px; height: 100%;"
  >
    {#each range(cols * rows) as i (i)}
      <div
        style="border-radius: 4px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); position: relative; overflow: hidden;"
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="var(--agd-stroke)" stroke-width="0.5" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="var(--agd-stroke)" stroke-width="0.5" />
        </svg>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet CheckboxSkeleton()}
  {@const sz = Math.min(width, height)}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <rect
      x="1"
      y={(height - sz + 2) / 2}
      width={sz - 2}
      height={sz - 2}
      rx={sz * 0.15}
      stroke="var(--agd-stroke)"
      stroke-width="1.5"
    />
    <path
      d="M{sz * 0.25} {height / 2}l{sz * 0.2} {sz * 0.2} {sz * 0.3}-{sz * 0.35}"
      stroke="var(--agd-bar)"
      stroke-width="1.5"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{/snippet}

{#snippet RadioSkeleton()}
  {@const r = Math.min(width, height) / 2 - 1}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <circle cx={width / 2} cy={height / 2} r={r} stroke="var(--agd-stroke)" stroke-width="1.5" />
    <circle cx={width / 2} cy={height / 2} r={r * 0.45} fill="var(--agd-bar)" />
  </svg>
{/snippet}

{#snippet SliderSkeleton()}
  {@const trackH = Math.max(2, height * 0.12)}
  {@const thumbR = Math.min(height * 0.35, 10)}
  {@const fillW = width * 0.55}
  <div style="height: 100%; display: flex; align-items: center; position: relative;">
    <div
      style="width: 100%; height: {trackH}px; border-radius: {trackH /
        2}px; background: var(--agd-fill); border: 1px solid var(--agd-stroke); position: relative;"
    >
      <div style="width: {fillW}px; height: 100%; border-radius: {trackH / 2}px; background: var(--agd-bar);"></div>
    </div>
    <div
      style="position: absolute; left: {fillW - thumbR}px; width: {thumbR * 2}px; height: {thumbR *
        2}px; border-radius: 50%; border: 1.5px solid var(--agd-stroke); background: var(--agd-fill);"
    ></div>
  </div>
{/snippet}

{#snippet DatePickerSkeleton()}
  {@const inputH = Math.min(36, height * 0.15)}
  {@const cols = 7}
  {@const rows = 4}
  {@const cellSz = Math.min((width - 16) / cols, (height - inputH - 40) / (rows + 1))}
  <div style="height: 100%; display: flex; flex-direction: column; gap: 4px;">
    <div
      style="height: {inputH}px; border-radius: 4px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 8px; justify-content: space-between;"
    >
      {@render Bar("40%", 2)}
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
        ><rect x="2" y="3" width="12" height="11" rx="1" stroke="var(--agd-stroke)" stroke-width="1" /><line
          x1="2"
          y1="6"
          x2="14"
          y2="6"
          stroke="var(--agd-stroke)"
          stroke-width="0.5"
        /></svg
      >
    </div>
    <div
      style="flex: 1; border-radius: 6px; border: 1px dashed var(--agd-stroke); background: var(--agd-fill); display: flex; flex-direction: column;"
    >
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px;">
        <span style="font-size: 7px; color: var(--agd-stroke);">‹</span>
        {@render Bar(width * 0.25, 2, true)}
        <span style="font-size: 7px; color: var(--agd-stroke);">›</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat({cols}, 1fr); gap: 1px; padding: 0 4px; flex: 1;">
        {#each range(cols * rows) as i (i)}
          <div style="display: flex; align-items: center; justify-content: center; height: {cellSz}px;">
            <div
              style="width: {cellSz * 0.5}px; height: {cellSz *
                0.5}px; border-radius: 50%; background: {i === 10 ? 'var(--agd-bar)' : 'transparent'};"
            >
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <div
                  style="width: 1.5px; height: 1.5px; border-radius: 1px; background: var(--agd-bar-strong); opacity: {i ===
                  10
                    ? 1
                    : 0.25};"
                ></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/snippet}

{#snippet SkeletonSkeletonRenderer()}
  <div style="height: 100%; display: flex; flex-direction: column; gap: {height * 0.08}px; padding: 4px;">
    <div style="width: 100%; height: {height * 0.2}px; border-radius: 4px; background: var(--agd-fill);"></div>
    <div style="width: 70%; height: {Math.max(6, height * 0.1)}px; border-radius: 3px; background: var(--agd-fill);"></div>
    <div style="width: 90%; height: {Math.max(4, height * 0.06)}px; border-radius: 3px; background: var(--agd-fill);"></div>
    <div style="width: 50%; height: {Math.max(4, height * 0.06)}px; border-radius: 3px; background: var(--agd-fill);"></div>
  </div>
{/snippet}

{#snippet ChipSkeleton()}
  <div style="height: 100%; display: flex; align-items: center; gap: 6px;">
    <div
      style="height: 100%; flex: 1; border-radius: {height /
        2}px; border: 1px solid var(--agd-stroke); background: var(--agd-fill); display: flex; align-items: center; padding: 0 {height *
        0.3}px; gap: 4px;"
    >
      {@render Bar("60%", 2, true)}
      <div
        style="width: {Math.max(6, height * 0.3)}px; height: {Math.max(
          6,
          height * 0.3,
        )}px; border-radius: 50%; border: 1px solid var(--agd-stroke); flex-shrink: 0; margin-left: auto;"
      ></div>
    </div>
  </div>
{/snippet}

{#snippet IconSkeleton()}
  {@const sz = Math.min(width, height)}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <path
      d="M{width / 2} {(height - sz) / 2 + sz * 0.1}l{sz * 0.12} {sz * 0.25} {sz * 0.28} {sz * 0.04}-{sz *
        0.2} {sz * 0.2} {sz * 0.05} {sz * 0.28}-{sz * 0.25}-{sz * 0.12}-{sz * 0.25} {sz * 0.12} {sz *
        0.05}-{sz * 0.28}-{sz * 0.2}-{sz * 0.2} {sz * 0.28}-{sz * 0.04}z"
      stroke="var(--agd-stroke)"
      stroke-width="1"
      fill="var(--agd-fill)"
    />
  </svg>
{/snippet}

{#snippet SpinnerSkeleton()}
  {@const r = Math.min(width, height) / 2 - 2}
  <svg width="100%" height="100%" viewBox="0 0 {width} {height}" fill="none">
    <circle cx={width / 2} cy={height / 2} r={r} stroke="var(--agd-stroke)" stroke-width="1.5" opacity=".2" />
    <path
      d="M{width / 2} {height / 2 - r}a{r} {r} 0 0 1 {r} {r}"
      stroke="var(--agd-bar-strong)"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{/snippet}

{#snippet FeatureSkeleton()}
  {@const iconSz = Math.min(36, height * 0.25, width * 0.12)}
  {@const items = Math.max(1, Math.min(3, Math.floor(height / 80)))}
  <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-around; padding: 8px;">
    {#each range(items) as i (i)}
      <div style="display: flex; gap: {width * 0.04}px; align-items: flex-start;">
        {@render Block(iconSz, iconSz, iconSz * 0.25)}
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          {@render Bar(`${40 + ((i * 13) % 20)}%`, 3, true)}
          {@render Bar(`${60 + ((i * 17) % 25)}%`, 2)}
        </div>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet TeamSkeleton()}
  {@const cols = Math.max(2, Math.min(4, Math.floor(width / 120)))}
  {@const avatarSz = Math.min(36, height * 0.25)}
  <div
    style="height: 100%; display: flex; flex-direction: column; align-items: center; gap: {height *
      0.06}px; padding: {height * 0.06}px;"
  >
    {@render Bar(width * 0.3, 4, true)}
    <div style="display: flex; gap: {width * 0.06}px; justify-content: center; flex: 1; align-items: center;">
      {#each range(cols) as i (i)}
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          {@render Circle(avatarSz)}
          {@render Bar(width * 0.12, 3, true)}
          {@render Bar(width * 0.08, 2)}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet LoginSkeleton()}
  {@const fields = Math.max(2, Math.min(3, Math.floor(height / 80)))}
  <div
    style="height: 100%; display: flex; flex-direction: column; align-items: center; padding: {width *
      0.06}px; gap: {height * 0.04}px;"
  >
    {@render Bar(width * 0.5, Math.max(5, height * 0.04), true)}
    {@render Bar(width * 0.35, 2)}
    <div style="width: 100%; display: flex; flex-direction: column; gap: {height * 0.03}px; margin-top: {height * 0.04}px;">
      {#each range(fields) as i (i)}
        <div style="display: flex; flex-direction: column; gap: 3px;">
          {@render Bar(Math.min(60, width * 0.2), 2)}
          {@render Block("100%", Math.min(32, height * 0.1), 4)}
        </div>
      {/each}
    </div>
    {@render Block("100%", Math.min(36, height * 0.12), 6, ` margin-top: ${height * 0.03}px; background: var(--agd-bar);`)}
    {@render Bar(width * 0.4, 2)}
  </div>
{/snippet}

{#snippet ContactSkeleton()}
  <div style="height: 100%; display: flex; flex-direction: column; padding: {width * 0.04}px; gap: {height * 0.03}px;">
    {@render Bar(width * 0.4, 4, true)}
    {@render Bar(width * 0.6, 2)}
    <div style="display: flex; gap: 6px; margin-top: {height * 0.03}px;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
        {@render Bar(50, 2)}
        {@render Block("100%", Math.min(28, height * 0.1), 4)}
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
        {@render Bar(40, 2)}
        {@render Block("100%", Math.min(28, height * 0.1), 4)}
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 3px;">
      {@render Bar(50, 2)}
      {@render Block("100%", Math.min(28, height * 0.1), 4)}
    </div>
    <div style="display: flex; flex-direction: column; gap: 3px; flex: 1;">
      {@render Bar(60, 2)}
      {@render Block("100%", "100%", 4)}
    </div>
    {@render Block(
      Math.min(120, width * 0.3),
      Math.min(30, height * 0.1),
      6,
      " align-self: flex-end; background: var(--agd-bar);",
    )}
  </div>
{/snippet}

<!-- ===================== Entry ===================== -->

{#if !known}
  <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
    <span
      style="font-size: 10px; font-weight: 600; color: var(--agd-text-3); text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.5;"
      >{type}</span
    >
  </div>
{:else}
  <div style="width: 100%; height: 100%; padding: 8px; position: relative; pointer-events: none;">
    {#if type === "navigation"}{@render NavigationSkeleton()}
    {:else if type === "hero"}{@render HeroSkeleton()}
    {:else if type === "sidebar"}{@render SidebarSkeleton()}
    {:else if type === "footer"}{@render FooterSkeleton()}
    {:else if type === "modal"}{@render ModalSkeleton()}
    {:else if type === "card"}{@render CardSkeleton()}
    {:else if type === "text"}{@render TextSkeleton()}
    {:else if type === "image"}{@render ImageSkeleton()}
    {:else if type === "table"}{@render TableSkeleton()}
    {:else if type === "list"}{@render ListSkeleton()}
    {:else if type === "button"}{@render ButtonSkeleton()}
    {:else if type === "input"}{@render InputSkeleton()}
    {:else if type === "form"}{@render FormSkeleton()}
    {:else if type === "tabs"}{@render TabsSkeleton()}
    {:else if type === "avatar"}{@render AvatarSkeleton()}
    {:else if type === "badge"}{@render BadgeSkeleton()}
    {:else if type === "header"}{@render HeaderSkeleton()}
    {:else if type === "section"}{@render SectionSkeleton()}
    {:else if type === "grid"}{@render GridSkeleton()}
    {:else if type === "dropdown"}{@render DropdownSkeleton()}
    {:else if type === "toggle"}{@render ToggleSkeleton()}
    {:else if type === "search"}{@render SearchSkeleton()}
    {:else if type === "toast"}{@render ToastSkeleton()}
    {:else if type === "progress"}{@render ProgressSkeleton()}
    {:else if type === "chart"}{@render ChartSkeleton()}
    {:else if type === "video"}{@render VideoSkeleton()}
    {:else if type === "tooltip"}{@render TooltipSkeleton()}
    {:else if type === "breadcrumb"}{@render BreadcrumbSkeleton()}
    {:else if type === "pagination"}{@render PaginationSkeleton()}
    {:else if type === "divider"}{@render DividerSkeleton()}
    {:else if type === "accordion"}{@render AccordionSkeleton()}
    {:else if type === "carousel"}{@render CarouselSkeleton()}
    {:else if type === "pricing"}{@render PricingSkeleton()}
    {:else if type === "testimonial"}{@render TestimonialSkeleton()}
    {:else if type === "cta"}{@render CtaSkeleton()}
    {:else if type === "alert"}{@render AlertSkeleton()}
    {:else if type === "banner"}{@render BannerSkeleton()}
    {:else if type === "stat"}{@render StatSkeleton()}
    {:else if type === "stepper"}{@render StepperSkeleton()}
    {:else if type === "tag"}{@render TagSkeleton()}
    {:else if type === "rating"}{@render RatingSkeleton()}
    {:else if type === "map"}{@render MapSkeleton()}
    {:else if type === "timeline"}{@render TimelineSkeleton()}
    {:else if type === "fileUpload"}{@render FileUploadSkeleton()}
    {:else if type === "codeBlock"}{@render CodeBlockSkeleton()}
    {:else if type === "calendar"}{@render CalendarSkeleton()}
    {:else if type === "notification"}{@render NotificationSkeleton()}
    {:else if type === "productCard"}{@render ProductCardSkeleton()}
    {:else if type === "profile"}{@render ProfileSkeleton()}
    {:else if type === "drawer"}{@render DrawerSkeleton()}
    {:else if type === "popover"}{@render PopoverSkeleton()}
    {:else if type === "logo"}{@render LogoSkeleton()}
    {:else if type === "faq"}{@render FaqSkeleton()}
    {:else if type === "gallery"}{@render GallerySkeleton()}
    {:else if type === "checkbox"}{@render CheckboxSkeleton()}
    {:else if type === "radio"}{@render RadioSkeleton()}
    {:else if type === "slider"}{@render SliderSkeleton()}
    {:else if type === "datePicker"}{@render DatePickerSkeleton()}
    {:else if type === "skeleton"}{@render SkeletonSkeletonRenderer()}
    {:else if type === "chip"}{@render ChipSkeleton()}
    {:else if type === "icon"}{@render IconSkeleton()}
    {:else if type === "spinner"}{@render SpinnerSkeleton()}
    {:else if type === "feature"}{@render FeatureSkeleton()}
    {:else if type === "team"}{@render TeamSkeleton()}
    {:else if type === "login"}{@render LoginSkeleton()}
    {:else if type === "contact"}{@render ContactSkeleton()}
    {/if}
  </div>
{/if}
