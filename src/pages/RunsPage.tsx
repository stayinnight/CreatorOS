import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";

export function RunsPage() {
  const { state } = useCampaign();
  return <div className="runs-page"><header className="inbox-hero"><div><p className="eyebrow">AGENT OPERATIONS</p><h1>Runs, not<br /><span>chat history.</span></h1></div><p>Every run keeps its goal, current step, generated artifacts, and recoverable failures.</p></header><section className="runs-list">{state.agent.runs.length ? state.agent.runs.map((run) => <Link key={run.id} to={`/campaigns/${run.campaignId}/runs/${run.id}`}><span>{run.status}</span><strong>{run.goal}</strong><small>{run.stepIds.length} steps · {run.outputArtifactIds.length} artifacts</small></Link>) : <div className="runs-empty"><strong>No runs yet.</strong><p>Open the cycling-camera campaign and ask the Agent to analyze the source materials.</p></div>}</section></div>;
}
