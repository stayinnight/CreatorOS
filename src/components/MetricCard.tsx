export function MetricCard({ label, value, target, tone = "default" }: { label: string; value: string; target: string; tone?: "default" | "pass" | "fail" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{target}</small>
    </article>
  );
}
