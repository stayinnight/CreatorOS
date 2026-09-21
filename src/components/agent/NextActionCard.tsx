import type { AgentMessage } from "../../agent/model";

export function NextActionCard({ message }: { message: AgentMessage }) {
  return <article className="agent-card next-action-card"><span>NEXT BEST ACTION</span><strong>{message.text}</strong><button type="button">Build mix options <span>→</span></button></article>;
}
