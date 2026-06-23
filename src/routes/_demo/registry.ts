import type { AgentationComponents } from "$lib/index.js";
import DemoButton from "./DemoButton.svelte";
import DemoCard from "./DemoCard.svelte";

export const demoRegistry: AgentationComponents = {
  Actions: [
    {
      label: "Button",
      component: DemoButton,
      src: "$lib/ui/DemoButton.svelte",
      description: "Primary call-to-action. One per view.",
      keywords: ["cta", "submit", "action"],
      variants: {
        intent: ["primary", "secondary", "danger"],
        size: ["sm", "md", "lg"],
        label: { type: "text", default: "Button" },
      },
    },
  ],
  Surfaces: [
    {
      label: "Card",
      component: DemoCard,
      src: "$lib/ui/DemoCard.svelte",
      description: "A content surface/container.",
      keywords: ["panel", "box"],
      variants: { title: { type: "text", default: "Card title" } },
    },
  ],
};
