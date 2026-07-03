/**
 * SummaryBar
 * Six at-a-glance stats about the comparison that just ran.
 */
function SummaryBar({ summary }) {
  const stats = [
    { label: 'Rows in Source A', value: summary.totalA, tone: 'neutral' },
    { label: 'Rows in Source B', value: summary.totalB, tone: 'neutral' },
    { label: 'Matched rows', value: summary.matched, tone: 'success' },
    { label: 'Mismatched rows', value: summary.mismatched, tone: 'warn' },
    { label: 'Missing rows', value: summary.missing, tone: 'danger' },
  ];

  return (
    <div className="summary-bar">
      {stats.map((s) => (
        <div key={s.label} className={`stat-card stat-card--${s.tone}`}>
          <div className="stat-card__value">{s.value}</div>
          <div className="stat-card__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
