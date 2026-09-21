import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { CandidateDrawer } from "../components/CandidateDrawer";
import { StatusBadge } from "../components/StatusBadge";
import { candidateScore, qualifyCandidate } from "../domain/candidate";
import type { CampaignCandidate } from "../domain/model";

export function SearchCandidatesPage() {
  const { state, dispatch } = useCampaign();
  const [tab, setTab] = useState<"packages" | "candidates">(state.candidatesLoaded ? "candidates" : "packages");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const packagesByCell = useMemo(() => new Map(state.searchPackages.map((item) => [item.matrixCellId, item])), [state.searchPackages]);
  const selected = state.candidates.find((item) => item.id === selectedId) ?? null;
  const selectedPackage = selected ? packagesByCell.get(selected.matrixCellId) ?? null : null;
  const selectedQualification = selected && selectedPackage ? qualifyCandidate(selected, selectedPackage) : null;

  const candidateRows = state.candidates.map((candidate) => {
    const searchPackage = packagesByCell.get(candidate.matrixCellId);
    return { candidate, searchPackage, qualification: searchPackage ? qualifyCandidate(candidate, searchPackage) : null };
  });

  const counts = candidateRows.reduce((result, row) => {
    if (row.qualification) result[row.qualification.status] += 1;
    return result;
  }, { Qualified: 0, "Needs Review": 0, Disqualified: 0 });

  return (
    <div className="page-stack search-page">
      <section className="page-intro compact-intro">
        <div><p className="eyebrow">03 · EVIDENCE PIPELINE</p><h2>Find cyclists, not adjacent reach.</h2></div>
        <p>Packages inherit the locked Matrix. Every result is checked against real cycling footage, scenario proof, quote and rights.</p>
      </section>

      <div className="subtab-bar">
        <div className="scenario-tabs">
          <button className={tab === "packages" ? "active" : ""} onClick={() => setTab("packages")}>Search Packages <span>{state.searchPackages.length}</span></button>
          <button className={tab === "candidates" ? "active" : ""} onClick={() => setTab("candidates")}>Candidate Review <span>{state.candidatesLoaded ? state.candidates.length : 0}</span></button>
        </div>
        {state.candidatesLoaded && <div className="qualification-summary"><span>{counts.Qualified} qualified</span><span>{counts["Needs Review"]} review</span><span>{counts.Disqualified} rejected</span></div>}
      </div>

      {state.searchPackages.length === 0 ? (
        <section className="workflow-empty"><span className="stage-index">UPSTREAM GATE</span><h3>No search packages yet.</h3><p>Publish the Brief, lock a valid Matrix and generate packages first.</p><Link to="/mix-planner" className="primary-inline">Open Mix Planner</Link></section>
      ) : tab === "packages" ? (
        <section className="package-grid">
          {state.searchPackages.map((item, index) => (
            <article className="package-card" key={item.id}>
              <div className="package-card-head"><span>PKG-{String(index + 1).padStart(2, "0")}</span><StatusBadge status={state.candidatesLoaded ? "Enough" : item.status} /></div>
              <h3>{item.market} · {item.ridingScenario}</h3><p>{item.platform} / {item.contentFormat} / {item.creatorTier}</p>
              <dl><div><dt>Need</dt><dd>{item.targetCreatorCount} creators</dd></div><div><dt>Source</dt><dd>{item.candidateTargetCount} candidates</dd></div><div><dt>Ceiling</dt><dd>${item.budgetCeilingPerCreator.toLocaleString()}</dd></div><div><dt>Views floor</dt><dd>{item.expectedViewsFloor.toLocaleString()}</dd></div></dl>
              <small>{item.mustHaveRules.join(" · ")}</small>
            </article>
          ))}
          <div className="package-action-bar"><div><strong>{state.searchPackages.length} deterministic packages</strong><span>Bound to Matrix v1 and Brief v1</span></div><button className="primary-inline" disabled={state.candidatesLoaded} onClick={() => { dispatch({ type: "LOAD_BATCHES" }); setTab("candidates"); }}>{state.candidatesLoaded ? "Batches loaded" : "Load 2 seeded batches"}</button></div>
        </section>
      ) : !state.candidatesLoaded ? (
        <section className="workflow-empty"><h3>Candidate batches are ready to load.</h3><p>The demo uses 42 deterministic profiles: 30 primaries, 10 backups and two explicit failure cases.</p><button className="primary-inline" onClick={() => dispatch({ type: "LOAD_BATCHES" })}>Load batches</button></section>
      ) : (
        <section className="candidate-panel panel">
          <div className="panel-head"><div><span className="micro-label">QUALIFICATION QUEUE</span><h3>42 evidence-backed profiles</h3></div><span>Click a row to audit the decision</span></div>
          <div className="table-wrap"><table className="candidate-table"><thead><tr><th>Creator</th><th>Market / scenario</th><th>Evidence</th><th>Quote</th><th>Fit score</th><th>Role</th><th>Status</th></tr></thead><tbody>
            {candidateRows.map(({ candidate, qualification }) => qualification && <CandidateRow key={candidate.id} candidate={candidate} qualification={qualification} onSelect={() => setSelectedId(candidate.id)} />)}
          </tbody></table></div>
        </section>
      )}
      <CandidateDrawer candidate={selected} qualification={selectedQualification} searchPackage={selectedPackage} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function CandidateRow({ candidate, qualification, onSelect }: { candidate: CampaignCandidate; qualification: ReturnType<typeof qualifyCandidate>; onSelect: () => void }) {
  const score = candidateScore(candidate).total;
  return <tr onClick={onSelect}>
    <td><strong>{candidate.creatorName}</strong><small>{candidate.handle} · {candidate.platform}</small></td>
    <td><strong>{candidate.market} · {candidate.ridingScenario}</strong><small>{candidate.matrixCellId}</small></td>
    <td><strong>{candidate.evidence[0]?.views.toLocaleString() ?? "Missing"}</strong><small>{candidate.evidence[0]?.proofPoints.includes("Real Cycling") ? "Real cycling verified" : "Manual review required"}</small></td>
    <td><strong>${candidate.quote.total.toLocaleString()}</strong><small>{candidate.quote.status} · incl. rights</small></td>
    <td><strong>{score.toFixed(1)}</strong><small>weighted / 100</small></td>
    <td><strong>{candidate.role}</strong><small>{candidate.quote.deliverables}</small></td>
    <td><StatusBadge status={qualification.status} />{qualification.risks[0] && <small className="risk-copy">{qualification.risks[0]}</small>}</td>
  </tr>;
}
