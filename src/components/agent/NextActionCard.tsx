import type { AgentMessage } from "../../agent/model";
import { Link } from "react-router-dom";

export function NextActionCard({ message, onAction, actionLabel, previewHref }: { message: AgentMessage; onAction?: () => void; actionLabel?: string; previewHref?: string }) {
  return <article className="agent-card next-action-card"><span>NEXT BEST ACTION</span><strong>{message.text}</strong><div className="next-action-buttons">{previewHref && <Link to={previewHref}>Client preview</Link>}{onAction && <button type="button" onClick={onAction}>{actionLabel ?? "Continue"} <span>→</span></button>}</div></article>;
}
