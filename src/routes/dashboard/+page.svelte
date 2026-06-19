<script lang="ts">
  const stats = [
    { label: "Annotations", value: "1,284" },
    { label: "Sessions", value: "47" },
    { label: "Resolved", value: "92%" },
  ];
  const rows = [
    { id: "A-101", page: "/checkout", intent: "fix", severity: "blocking", status: "pending" },
    { id: "A-102", page: "/pricing", intent: "change", severity: "important", status: "acknowledged" },
    { id: "A-103", page: "/", intent: "question", severity: "suggestion", status: "resolved" },
    { id: "A-104", page: "/dashboard", intent: "approve", severity: "suggestion", status: "pending" },
  ];
</script>

<section>
  <h1>Dashboard</h1>

  <div class="stats">
    {#each stats as s (s.label)}
      <div class="stat">
        <span class="value">{s.value}</span>
        <span class="label">{s.label}</span>
      </div>
    {/each}
  </div>

  <h2>Recent annotations</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Page</th><th>Intent</th><th>Severity</th><th>Status</th></tr>
    </thead>
    <tbody>
      {#each rows as r (r.id)}
        <tr>
          <td>{r.id}</td>
          <td><code>{r.page}</code></td>
          <td>{r.intent}</td>
          <td>{r.severity}</td>
          <td><span class="badge {r.status}">{r.status}</span></td>
        </tr>
      {/each}
    </tbody>
  </table>

  <h2>Activity</h2>
  <ul class="activity">
    <li>Ada commented on <strong>Hero CTA</strong></li>
    <li>Grace resolved <strong>A-103</strong></li>
    <li>Agent updated <strong>A-102</strong></li>
  </ul>
</section>

<style>
  section {
    max-width: 880px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .stat {
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .stat .value {
    font-size: 1.8rem;
    font-weight: 700;
  }
  .stat .label {
    color: #777;
    font-size: 0.9rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    overflow: hidden;
  }
  th, td {
    text-align: left;
    padding: 0.7rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.92rem;
  }
  th {
    background: #fafafa;
    color: #555;
  }
  .badge {
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    text-transform: capitalize;
  }
  .badge.pending { background: #fff4d6; color: #8a6d00; }
  .badge.acknowledged { background: #dceeff; color: #0a5dab; }
  .badge.resolved { background: #d9f5e1; color: #1a7d3c; }
  .activity {
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    line-height: 2;
  }
</style>
