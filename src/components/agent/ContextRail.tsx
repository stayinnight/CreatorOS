import { useCampaign } from "../../app/CampaignProvider";

export function ContextRail() {
  const { state, dispatch } = useCampaign();
  const artifacts = [...state.agent.artifacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const decisions = [...state.agent.decisions].sort((a, b) => a.status.localeCompare(b.status));
  return <aside className="context-rail"><div className="context-title"><span className="micro-label">CAMPAIGN CONTEXT</span><h2>Artifacts & decisions</h2></div><section className="context-section"><header><strong>Artifacts</strong><span>{artifacts.length}</span></header>{artifacts.length ? artifacts.map((artifact) => <button className="context-artifact" type="button" key={artifact.id} onClick={() => dispatch({ type: "OPEN_ARTIFACT", artifactId: artifact.id })}><i>{artifact.kind.slice(0, 1)}</i><div><strong>{artifact.kind} v{artifact.version}</strong><small>{artifact.status} · {artifact.parentArtifactIds.length} parent{artifact.parentArtifactIds.length === 1 ? "" : "s"}</small></div><span>Open</span></button>) : <div className="context-empty"><strong>No artifacts yet</strong><p>Brief, Mix and candidate batches will appear here as the Agent works.</p></div>}</section><section className="context-section"><header><strong>Decisions</strong><span>{decisions.length}</span></header>{decisions.map((decision) => <div className={`context-decision ${decision.status.toLowerCase()}`} key={decision.id}><span>{decision.status}</span><strong>{decision.question}</strong>{decision.resolution && <small>{decision.resolution}</small>}</div>)}</section></aside>;
}
