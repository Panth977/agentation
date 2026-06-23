<script lang="ts">
  let { intent = "primary", size = "md", label = "Button" }:
    { intent?: string; size?: string; label?: string } = $props();
  const pad = $derived(size === "sm" ? "4px 10px" : size === "lg" ? "12px 24px" : "8px 16px");
  const bg = $derived(intent === "primary" ? "#0088ff" : intent === "danger" ? "#ff383c" : "#e5e5e5");
  const fg = $derived(intent === "secondary" ? "#1a1a1a" : "#fff");
</script>
<button data-demo-button style="border:none;border-radius:8px;font-weight:600;cursor:pointer;background:{bg};color:{fg};padding:{pad};">{label}</button>
