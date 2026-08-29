import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Submission, SubmissionStatus } from '../types/submission';

// Reuses the app's existing status colors (accepted=success) but gives the two failure
// kinds distinct colors here — the submissions table intentionally lumps them under one
// "danger" red for a quick good/bad read, but a chart benefits from telling them apart.
const STATUS_COLORS: Record<SubmissionStatus, string> = {
  ACCEPTED: 'var(--success)',
  WRONG_ANSWER: 'var(--danger)',
  COMPILATION_ERROR: 'var(--warning)',
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  COMPILATION_ERROR: 'Compilation Error',
};

export function SubmissionStatusChart({ submissions }: { submissions: Submission[] }) {
  const counts: Partial<Record<SubmissionStatus, number>> = {};
  for (const submission of submissions) {
    counts[submission.status] = (counts[submission.status] ?? 0) + 1;
  }

  const data = (Object.keys(counts) as SubmissionStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: counts[status] ?? 0,
  }));

  if (data.length === 0) {
    return (
      <p className="empty-state">
        No submissions yet — solve a problem in an active contest to see your breakdown here.
      </p>
    );
  }

  return (
    <div className="submission-chart">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}
            labelStyle={{ color: 'var(--text-h)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="submission-chart__legend">
        {data.map((entry) => (
          <li key={entry.status}>
            <span className="submission-chart__swatch" style={{ background: STATUS_COLORS[entry.status] }} />
            {entry.label}: {entry.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
