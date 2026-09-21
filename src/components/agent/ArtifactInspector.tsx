import { useState } from "react";
import type { CampaignArtifact } from "../../agent/model";
import { useCampaign } from "../../app/CampaignProvider";
import { ConstraintPanel } from "../ConstraintPanel";
import { MatrixRowDrawer } from "../MatrixRowDrawer";
import { MatrixTable } from "../MatrixTable";
import { MetricCard } from "../MetricCard";
import { evaluateMatrix, summarizeMatrix } from "../../domain/matrix";
import type { MatrixRow } from "../../domain/model";
import { CandidateBatchDetail } from "./CandidateBatchDetail";
import { ReviewRoundDetail } from "./ReviewRoundDetail";
import { GapArtifactDetail } from "./GapArtifactDetail";

const money = (value: number) => `$${Math.round(value / 1000)}K`;

export function ArtifactInspector({ artifact }: { artifact: CampaignArtifact }) {
  const { dispatch } = useCampaign();
  return <aside className="artifact-inspector"><header className="inspector-head"><div><span>{artifact.kind.toUpperCase()} · VERSION {artifact.version}</span><h2>{artifact.summary}</h2></div><button type="button" aria-label="Close artifact" onClick={() => dispatch({ type: "CLOSE_ARTIFACT" })}>×</button></header>{artifact.kind === "Brief" ? <BriefArtifactDetail /> : artifact.kind === "Mix" ? <MixArtifactDetail scenarioId={artifact.domainRef} /> : artifact.kind === "SearchPackageSet" ? <SearchPackageSetDetail /> : artifact.kind === "CandidateBatch" ? <CandidateBatchDetail artifact={artifact} /> : artifact.kind === "ReviewRound" ? <ReviewRoundDetail /> : artifact.kind === "GapAssessment" ? <GapArtifactDetail /> : <div className="inspector-placeholder"><strong>{artifact.kind} detail</strong></div>}</aside>;
}

function BriefArtifactDetail() {
  const { state } = useCampaign();
  return <div className="inspector-body"><div className="inspector-kpis"><MetricCard label="MARKETS" value="US + UK" target="fixed scope" /><MetricCard label="BUDGET" value="$180K" target="including rights" /><MetricCard label="TARGET" value="2.60M" target="effective views" /></div><section className="inspector-section"><span className="micro-label">SOURCE LINEAGE</span><h3>Three client inputs</h3>{state.brief.sources.map((source) => <article className="source-row" key={source.id}><span className="source-icon blue">{source.type.slice(0, 1)}</span><div><strong>{source.title}</strong><p>{source.excerpt}</p></div></article>)}</section><section className="inspector-section"><span className="micro-label">RESOLVED DECISIONS</span>{state.brief.conflicts.map((conflict) => <div className="resolved-line" key={conflict.id}><strong>{conflict.label}</strong><span>{conflict.resolution}</span></div>)}</section></div>;
}

function MixArtifactDetail({ scenarioId }: { scenarioId: string }) {
  const { state, dispatch } = useCampaign();
  const [selectedRow, setSelectedRow] = useState<MatrixRow | null>(null);
  const scenario = state.matrixScenarios.find((item) => item.id === state.activeScenarioId) ?? state.matrixScenarios.find((item) => item.id === scenarioId) ?? state.matrixScenarios[0];
  const summary = summarizeMatrix(scenario.rows);
  const constraints = evaluateMatrix(scenario.rows, state.brief);
  const locked = scenario.status === "Locked";
  return <div className="inspector-body mix-inspector"><div className="scenario-tabs compact-tabs">{state.matrixScenarios.map((item) => <button type="button" key={item.id} className={item.id === scenario.id ? "active" : ""} onClick={() => dispatch({ type: "SELECT_SCENARIO", scenarioId: item.id })}>{item.name}</button>)}</div><div className="inspector-kpis"><MetricCard label="TOTAL COST" value={money(summary.totalCost)} target="cap · $180K" tone={summary.totalCost <= state.brief.budgetCap ? "pass" : "fail"} /><MetricCard label="EFFECTIVE VIEWS" value={`${(summary.totalExpectedViews / 1_000_000).toFixed(2)}M`} target="goal · 2.60M" tone={summary.totalExpectedViews >= state.brief.viewsTarget ? "pass" : "fail"} /><MetricCard label="LONG-FORM" value={`${summary.longFormCreators}`} target="minimum · 3" tone={summary.longFormCreators >= 3 ? "pass" : "fail"} /></div><div className="inspector-matrix"><div className="panel"><div className="panel-head"><div><span className="micro-label">MIX MATRIX</span><h3>{scenario.name}</h3></div><span>{scenario.status}</span></div><MatrixTable rows={scenario.rows} selectedId={selectedRow?.id ?? null} onSelect={setSelectedRow} /><div className="planner-actions">{!locked ? <><button className="ghost-button" type="button" onClick={() => dispatch({ type: "SIMULATE_LONG_FORM_GAP", scenarioId: scenario.id })}>Test failure</button><button className="ghost-button" type="button" onClick={() => dispatch({ type: "RESTORE_SCENARIO", scenarioId: scenario.id })}>Restore</button><button className="primary-inline" type="button" onClick={() => dispatch({ type: "LOCK_MATRIX", scenarioId: scenario.id })}>Lock Matrix</button></> : <button className="primary-inline" type="button" disabled={state.searchPackages.length > 0} onClick={() => dispatch({ type: "GENERATE_PACKAGES", scenarioId: scenario.id })}>{state.searchPackages.length ? "Packages ready" : "Generate search packages"}</button>}</div></div><ConstraintPanel constraints={constraints} /></div><MatrixRowDrawer row={selectedRow} locked={locked} onClose={() => setSelectedRow(null)} onSave={(row) => dispatch({ type: "UPDATE_MATRIX_ROW", scenarioId: scenario.id, row })} /></div>;
}

function SearchPackageSetDetail() {
  const { state, dispatch } = useCampaign();
  return <div className="inspector-body"><section className="inspector-section"><span className="micro-label">BOUNDED SEARCH</span><h3>{state.searchPackages.length} packages inherit Matrix constraints</h3><div className="compact-package-grid">{state.searchPackages.map((item) => <article key={item.id}><span>{item.market} · {item.platform}</span><strong>{item.ridingScenario} / {item.contentFormat}</strong><small>{item.candidateTargetCount} candidates · ceiling ${item.budgetCeilingPerCreator.toLocaleString()}</small></article>)}</div></section><div className="inspector-approval"><div><strong>Calibrate before scaling</strong><p>Run a 10-case sample: 8 qualified directions and 2 visible failure cases.</p></div><button type="button" onClick={() => dispatch({ type: "START_SOURCING" })}>Build calibration batch →</button></div></div>;
}
