import type { RecommendedAction } from "../../agent/recommendedAction";

export function RecommendedNextStep({ action, onExecute, busy = false }: { action: RecommendedAction; onExecute: () => void; busy?: boolean }) {
  return <section className="recommended-next-step" aria-live="polite">
    <div className="recommended-next-copy">
      <span>Recommended next step · {action.stage}</span>
      <h3>{action.title}</h3>
      <p>{action.reason}</p>
      <small>{action.outcome}</small>
    </div>
    <button type="button" onClick={onExecute} disabled={busy} aria-busy={busy}>
      {busy && <i className="working-mark" />}
      {busy ? "Working…" : action.label} {!busy && <span>→</span>}
    </button>
  </section>;
}
