export function ProgressCard({ current, completed, total, nextLabel }: { current: string; completed: number; total: number; nextLabel: string | null }) {
  const percentage = total ? Math.round((completed / total) * 100) : 100;
  return <article className="agent-card progress-card">
    <header><span>RUN PROGRESS</span><strong>{current}</strong></header>
    <div className="progress-summary"><strong>{`${completed} / ${total}`}</strong><span>steps complete</span></div>
    <div className="progress-track" aria-label={`${percentage}% complete`}><i style={{ width: `${percentage}%` }} /></div>
    {nextLabel && <p>Next: <strong>{nextLabel}</strong></p>}
  </article>;
}
