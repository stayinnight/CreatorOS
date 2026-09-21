import { useEffect, useRef, useState } from "react";
import { useCampaign } from "../../app/CampaignProvider";
import { availableActions } from "../../agent/actions";
import { AgentWorking } from "./AgentWorking";

export function AgentComposer() {
  const { state, dispatch } = useCampaign();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const actions = availableActions(state, {});
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const submit = (value = text, candidateId?: string) => {
    if (!value.trim() || pending) return;
    setText(""); setPending(value);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(() => { dispatch({ type: "SEND_AGENT_MESSAGE", text: value, context: candidateId ? { candidateId } : undefined }); setPending(null); }, reduced ? 0 : 650);
  };
  if (!state.agent.activeRunId) return <div className="material-composer"><div className="attachment-row">{state.brief.sources.map((source) => <div key={source.id}><span>{source.type.slice(0, 1)}</span><strong>{source.title}</strong><small>Ready</small></div>)}</div><button type="button" onClick={() => dispatch({ type: "LOAD_DEMO_MATERIALS" })}>Analyze 3 materials <span>→</span></button></div>;
  return <div className="composer-wrap">{pending && <AgentWorking input={pending} />}<div className="intent-chips">{actions.map((action) => <button disabled={Boolean(pending)} type="button" key={action.id} onClick={() => submit(action.input, action.candidateId)}>{action.label}</button>)}</div><div className="agent-composer"><span>＋</span><input disabled={Boolean(pending)} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder={pending ? "Agent is working…" : "Ask the Campaign Agent…"} aria-label="Agent message" /><button disabled={Boolean(pending)} type="button" onClick={() => submit()}>Send</button></div></div>;
}
