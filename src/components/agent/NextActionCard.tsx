import type { AgentMessage } from "../../agent/model";
import { Link } from "react-router-dom";

export function NextActionCard({ message, lifecycle, onAction, actionLabel, previewHref, busy = false }: { message: AgentMessage; lifecycle: "Current" | "Completed" | "Superseded"; onAction?: () => void; actionLabel?: string; previewHref?: string; busy?: boolean }) {
  const interactive = lifecycle === "Current";
  return <article className={`agent-card next-action-card ${interactive ? "is-current" : "is-retired"}`}>
    <span>{interactive ? "NEXT BEST ACTION" : lifecycle}</span>
    <strong>{message.text}</strong>
    {interactive && <div className="next-action-buttons">
      {previewHref && <Link to={previewHref}>Client preview</Link>}
      {onAction && <button type="button" onClick={onAction} disabled={busy} aria-busy={busy}>{busy && <i className="working-mark" />} {busy ? "Opening comparison…" : actionLabel ?? "Continue"} {!busy && <span>→</span>}</button>}
    </div>}
  </article>;
}
