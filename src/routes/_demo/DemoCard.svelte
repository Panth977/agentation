<script lang="ts">
  let { title = "Card title" }: { title?: string } = $props();
</script>
<div data-demo-card style="width:220px;border:1px solid #e5e5e5;border-radius:12px;padding:16px;background:#fff;">
  <h3 style="margin:0 0 6px;font-size:15px;">{title}</h3>
  <p style="margin:0;color:#666;font-size:13px;">A demo card from the developer's component library.</p>
</div>
