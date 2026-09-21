import { useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";
import { availableActions } from "../../agent/actions";

export function AgentComposer() {
  const { state, dispatch } = useCampaign();
  const [text, setText] = useState("");
  const actions = availableActions(state, {});
  const submit = (value = text, candidateId?: string) => { if (!value.trim()) return; dispatch({ type: "SEND_AGENT_MESSAGE", text: value, context: candidateId ? { candidateId } : undefined }); setText(""); };
  if (!state.agent.activeRunId) return <div className="material-composer"><div className="attachment-row">{state.brief.sources.map((source) => <div key={source.id}><span>{source.type.slice(0, 1)}</span><strong>{source.title}</strong><small>Ready</small></div>)}</div><button type="button" onClick={() => dispatch({ type: "LOAD_DEMO_MATERIALS" })}>Analyze 3 materials <span>→</span></button></div>;
  return <div className="composer-wrap"><div className="intent-chips">{actions.map((action) => <button type="button" key={action.id} onClick={() => submit(action.input, action.candidateId)}>{action.label}</button>)}</div><div className="agent-composer"><span>＋</span><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="Ask the Campaign Agent…" aria-label="Agent message" /><button type="button" onClick={() => submit()}>Send</button></div></div>;
}
