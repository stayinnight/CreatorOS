import { useState } from "react";
import { useCampaign } from "../app/CampaignProvider";
import { ConstraintPanel } from "../components/ConstraintPanel";
import { MatrixRowDrawer } from "../components/MatrixRowDrawer";
import { MatrixTable } from "../components/MatrixTable";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { evaluateMatrix, summarizeMatrix } from "../domain/matrix";
import type { MatrixRow } from "../domain/model";

const money = (value: number) => `$${Math.round(value / 1000)}K`;
const views = (value: number) => `${(value / 1_000_000).toFixed(2)}M`;

export function MixPlannerPage() {
  const { state, dispatch } = useCampaign();
  const [selectedRow, setSelectedRow] = useState<MatrixRow | null>(null);
  const scenario = state.matrixScenarios.find((item) => item.id === state.activeScenarioId)!;
  const summary = summarizeMatrix(scenario.rows);
  const constraints = evaluateMatrix(scenario.rows, state.brief);
  const failures = constraints.filter((item) => item.status === "fail");
  const locked = scenario.status === "Locked";

  return (
    <div className="page-stack mix-page">
      <section className="page-intro compact-intro">
        <div><p className="eyebrow">02 · DECISION ENGINE</p><h2>Plan credibility, then buy reach.</h2></div>
        <p>Every row is a searchable creator archetype for the cycling head-camera launch—not a generic media allocation.</p>
      </section>

      <div className="scenario-bar">
        <div className="scenario-tabs">
          {state.matrixScenarios.map((item, index) => <button key={item.id} className={item.id === scenario.id ? "active" : ""} onClick={() => dispatch({ type: "SELECT_SCENARIO", scenarioId: item.id })}><span>0{index + 1}</span>{item.name}</button>)}
        </div>
        <StatusBadge status={scenario.status} />
      </div>
      <p className="scenario-strategy">{scenario.strategy}</p>

      <section className="metric-grid">
        <MetricCard label="TOTAL COST" value={money(summary.totalCost)} target="cap · $180K" tone={summary.totalCost <= state.brief.budgetCap ? "pass" : "fail"} />
        <MetricCard label="EFFECTIVE VIEWS" value={views(summary.totalExpectedViews)} target="goal · 2.60M" tone={summary.totalExpectedViews >= state.brief.viewsTarget ? "pass" : "fail"} />
        <MetricCard label="BLENDED CPM" value={summary.blendedCpm ? `$${summary.blendedCpm.toFixed(2)}` : "N/A"} target="target · ≤ $70" tone={summary.blendedCpm && summary.blendedCpm <= 70 ? "pass" : "fail"} />
        <MetricCard label="LONG-FORM" value={`${summary.longFormCreators} creators`} target="minimum · 3" tone={summary.longFormCreators >= 3 ? "pass" : "fail"} />
        <MetricCard label="BUDGET BUFFER" value={money(state.brief.budgetCap - summary.totalCost)} target="for quote variance" />
      </section>

      <section className="planner-grid">
        <div className="planner-main panel">
          <div className="panel-head"><div><span className="micro-label">MIX MATRIX</span><h3>Market × platform × riding scenario</h3></div><span>{scenario.rows.length} cells</span></div>
          <MatrixTable rows={scenario.rows} selectedId={selectedRow?.id ?? null} onSelect={setSelectedRow} />
          <div className="planner-actions">
            <button className="ghost-button" disabled={locked} onClick={() => dispatch({ type: "SIMULATE_LONG_FORM_GAP", scenarioId: scenario.id })}>Simulate long-form gap</button>
            <button className="ghost-button" disabled={locked} onClick={() => dispatch({ type: "RESTORE_SCENARIO", scenarioId: scenario.id })}>Restore scenario</button>
            {!locked ? <button className="primary-inline" disabled={failures.length > 0} onClick={() => dispatch({ type: "LOCK_MATRIX", scenarioId: scenario.id })}>Lock Matrix v1</button>
              : <button className="primary-inline" disabled={state.searchPackages.length > 0} onClick={() => dispatch({ type: "GENERATE_PACKAGES", scenarioId: scenario.id })}>{state.searchPackages.length ? `${state.searchPackages.length} packages generated` : "Generate search packages"}</button>}
          </div>
        </div>
        <ConstraintPanel constraints={constraints} />
      </section>
      <MatrixRowDrawer row={selectedRow} locked={locked} onClose={() => setSelectedRow(null)} onSave={(row) => dispatch({ type: "UPDATE_MATRIX_ROW", scenarioId: scenario.id, row })} />
    </div>
  );
}
