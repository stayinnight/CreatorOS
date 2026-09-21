import { useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";

const suggestions = ["先只整理 Brief", "为什么推荐他", "找相似但更生活化的人"];

export function AgentComposer() {
  const { state, dispatch } = useCampaign();
  const [text, setText] = useState("");
  const submit = (value = text) => { if (!value.trim()) return; dispatch({ type: "SEND_AGENT_MESSAGE", text: value }); setText(""); };
  if (!state.agent.activeRunId) return <div className="material-composer"><div className="attachment-row">{state.brief.sources.map((source) => <div key={source.id}><span>{source.type.slice(0, 1)}</span><strong>{source.title}</strong><small>Ready</small></div>)}</div><button type="button" onClick={() => dispatch({ type: "LOAD_DEMO_MATERIALS" })}>Analyze 3 materials <span>→</span></button></div>;
  return <div className="composer-wrap"><div className="intent-chips">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => submit(suggestion)}>{suggestion}</button>)}</div><div className="agent-composer"><span>＋</span><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="Ask the Campaign Agent…" aria-label="Agent message" /><button type="button" onClick={() => submit()}>Send</button></div></div>;
}
