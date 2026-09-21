import type { AgentMessage, RunStep } from "../../agent/model";

export function ExceptionCard({ message, step, onRetry }: { message: AgentMessage; step?: RunStep; onRetry: () => void }) {
  return <article className="agent-card exception-card"><span>EXCEPTION · LOCAL FAILURE</span><strong>{step?.label ?? "Agent step failed"}</strong><p>{message.text}</p><button type="button" onClick={onRetry}>Retry this step</button></article>;
}
