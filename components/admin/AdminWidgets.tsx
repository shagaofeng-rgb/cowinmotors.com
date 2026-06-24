export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

export function BarList({ rows }: { rows: Array<{ label?: string; value?: number; date?: string; pv?: number; uv?: number; inquiries?: number }> }) {
  const normalized = rows.map((row) => ({
    label: row.label || row.date || "-",
    value: Number(row.value ?? row.pv ?? 0),
    uv: row.uv,
    inquiries: row.inquiries,
  }));
  const max = Math.max(1, ...normalized.map((row) => row.value));

  if (!normalized.length) return <div className="admin-empty">暂无数据。</div>;

  return (
    <div className="admin-bar-list">
      {normalized.map((row) => (
        <div className="admin-bar-row" key={row.label}>
          <span>{row.label}</span>
          <div><i style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /></div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ children = "暂无数据。" }: { children?: string }) {
  return <div className="admin-empty">{children}</div>;
}
