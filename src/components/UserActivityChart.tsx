import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// Mirrors SubmissionStatusChart's markup/classes exactly (ring + centered total + legend)
// so the two donuts read as the same visual language, just with different data.
const ACTIVITY_COLORS = { active: 'var(--success)', nonActive: 'var(--info)' } as const;

interface UserActivityChartProps {
  activeCount: number;
  nonActiveCount: number;
}

export function UserActivityChart({ activeCount, nonActiveCount }: UserActivityChartProps) {
  const total = activeCount + nonActiveCount;
  const data = [
    { key: 'active' as const, label: 'Active', count: activeCount },
    { key: 'nonActive' as const, label: 'Non-active', count: nonActiveCount },
  ];

  if (total === 0) {
    return <p className="empty-state">No users yet.</p>;
  }

  return (
    <div className="submission-chart">
      <div className="submission-chart__ring">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={ACTIVITY_COLORS[entry.key]} stroke="none" />
              ))}
            </Pie>
            {/* Percentage-based coords keep this centered in the donut's hole regardless of
                how ResponsiveContainer resizes the SVG. */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="submission-chart__center-label">
              {total}
            </text>
            <Tooltip
              contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}
              labelStyle={{ color: 'var(--text-h)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="submission-chart__legend">
        {data.map((entry) => (
          <li key={entry.key}>
            <span className="submission-chart__swatch" style={{ background: ACTIVITY_COLORS[entry.key] }} />
            {entry.label}: {entry.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
