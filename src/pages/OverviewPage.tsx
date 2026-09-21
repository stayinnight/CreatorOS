import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { evaluateMatrix, summarizeMatrix } from "../domain/matrix";

export function OverviewPage() {
  const { state } = useCampaign();
  const matrix = state.matrixScenarios.find((item) => item.id === state.activeScenarioId)!;
  const summary = summarizeMatrix(matrix.rows);
  const constraints = evaluateMatrix(matrix.rows, state.brief);
  const passed = constraints.filter((item) => item.status === "pass").length;
  const selected = state.candidates.filter((item) => item.decision === "Select").length;
  const stages = [state.brief.status === "Published", matrix.status === "Locked", state.searchPackages.length > 0, state.candidatesLoaded, Boolean(state.reviewRound), state.reviewRound?.status === "Submitted"];
  const progress = Math.round(stages.filter(Boolean).length / stages.length * 100);
  const nextActions = getNextActions(state.brief.status, matrix.status, state.searchPackages.length, state.candidatesLoaded, state.reviewRound?.status, Boolean(state.gapAssessment));

  return <div className="page-stack overview-page">
    <section className="overview-hero"><div><p className="eyebrow">CAMPAIGN CONTROL ROOM</p><h2>Head-mounted camera launch,<br /><span>one decision loop.</span></h2><p>From fragmented brief to a client-reviewed cycling creator portfolio—with every assumption traceable.</p></div><div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}%</strong><span>workflow</span></div></div></section>
    <section className="health-grid">
      <div><span>PLAN HEALTH</span><strong>{passed} / {constraints.length}</strong><small>hard constraints passing</small></div>
      <div><span>LOCKED PLAN</span><strong>${Math.round(summary.totalCost / 1000)}K</strong><small>{(summary.totalExpectedViews / 1_000_000).toFixed(2)}M effective views</small></div>
      <div><span>SEARCH PIPELINE</span><strong>{state.candidatesLoaded ? 42 : state.searchPackages.length}</strong><small>{state.candidatesLoaded ? "profiles evaluated" : "search packages ready"}</small></div>
      <div><span>CLIENT SIGNAL</span><strong>{selected || "—"}</strong><small>{state.reviewRound?.status === "Submitted" ? "selected after feedback" : "awaiting decisions"}</small></div>
    </section>
    <section className="overview-grid">
      <div className="overview-panel dark-panel"><span className="micro-label">THE PRODUCT TRUTH</span><h3>Real rides. First-person proof.</h3><p>The plan is designed around a cycling head-mounted camera: Road, MTB and Urban creators must demonstrate stabilization, safety recording and changing light in actual rides.</p><div className="proof-tags"><span>POV</span><span>STABILIZATION</span><span>LOW LIGHT</span><span>SAFETY</span></div></div>
      <div className="overview-panel"><div className="panel-head bare"><div><span className="micro-label">NEXT BEST ACTION</span><h3>Keep the loop moving</h3></div></div><ol className="next-actions">{nextActions.map((item, index) => <li key={item.path}><span>0{index + 1}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><Link to={item.path}>Open →</Link></li>)}</ol></div>
    </section>
    <section className="workflow-strip">{["Brief", "Matrix", "Packages", "Candidates", "Client", "Recovery"].map((label, index) => <div className={stages[index] ? "done" : ""} key={label}><span>{stages[index] ? "✓" : index + 1}</span><strong>{label}</strong></div>)}</section>
  </div>;
}

function getNextActions(brief: string, matrix: string, packageCount: number, loaded: boolean, review: string | undefined, hasGap: boolean) {
  if (brief !== "Published") return [{ label: "Resolve and publish the brief", detail: "Two source conflicts need explicit decisions.", path: "/brief" }];
  if (matrix !== "Locked") return [{ label: "Validate and lock the Matrix", detail: "Repair any hard constraint before sourcing.", path: "/mix-planner" }];
  if (!packageCount) return [{ label: "Generate search packages", detail: "Convert each Matrix cell into a bounded search task.", path: "/mix-planner" }];
  if (!loaded) return [{ label: "Load and qualify candidate batches", detail: "Audit real-cycling evidence and commercial fit.", path: "/search-candidates" }];
  if (!review) return [{ label: "Publish Client Review Round 1", detail: "Release exactly 30 qualified creators.", path: "/client-review" }];
  if (review !== "Submitted") return [{ label: "Capture structured client feedback", detail: "Select, Maybe or Pass with reason codes.", path: "/client-review" }];
  if (hasGap) return [{ label: "Recover the forecast gap", detail: "Promote a backup, then replenish the open cell.", path: "/client-review" }];
  return [{ label: "Review the audit trail", detail: "The seeded decision loop is complete.", path: "/activity" }];
}
