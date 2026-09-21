import type { AgentMessage } from "../../agent/model";

export function NextActionCard({ message, onAction }: { message: AgentMessage; onAction?: () => void }) {
  return <article className="agent-card next-action-card"><span>NEXT BEST ACTION</span><strong>{message.text}</strong>{onAction && <button type="button" onClick={onAction}>{message.payloadRef === "generate-mix" ? "Build mix options" : "Open comparison"} <span>→</span></button>}</article>;
}
