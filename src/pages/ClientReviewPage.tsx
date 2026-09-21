import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCampaign } from "../app/CampaignProvider";
import { StatusBadge } from "../components/StatusBadge";
import { candidateScore, qualifyCandidate } from "../domain/candidate";
import { toClientCandidate, validateReviewRound } from "../domain/review";
import type { CandidateDecision, ClientCandidate } from "../domain/model";

export function ClientReviewPage() {
  const { state, dispatch } = useCampaign();
  const [view, setView] = useState<"internal" | "client">("internal");
  const packageByCell = useMemo(() => new Map(state.searchPackages.map((item) => [item.matrixCellId, item])), [state.searchPackages]);
  const qualificationById = Object.fromEntries(state.candidates.map((candidate) => {
    const searchPackage = packageByCell.get(candidate.matrixCellId);
    return [candidate.id, searchPackage ? qualifyCandidate(candidate, searchPackage) : { status: "Needs Review" as const, reasons: ["Search package missing"], risks: [] }];
  }));
  const primaries = state.candidates.filter((candidate) => candidate.role === "Primary").slice(0, 30);
  const backups = state.candidates.filter((candidate) => candidate.role === "Backup");
  const validation = validateReviewRound(primaries, backups, qualificationById);
  const reviewCandidates = state.reviewRound
    ? state.reviewRound.candidateIds.map((id) => state.candidates.find((candidate) => candidate.id === id)).filter(Boolean)
    : [];
  const clientCandidates = reviewCandidates.map((candidate) => toClientCandidate(candidate!));
  const reviewPublished = Boolean(state.reviewRound);

  const seededDecisions = Object.fromEntries(reviewCandidates.map((candidate) => [candidate!.id, candidate!.market === "UK" && candidate!.ridingScenario === "Urban" ? "Pass" : "Select"])) as Record<string, CandidateDecision>;

  return (
    <div className="page-stack review-page">
      <section className="page-intro compact-intro">
        <div><p className="eyebrow">04 · CLIENT DECISION LOOP</p><h2>Share the proof. Keep the strategy private.</h2></div>
        <p>The client projection is an explicit allow-list: evidence, deliverables, quote range and rights—never internal scores, notes or backup strategy.</p>
      </section>

      <div className="review-toolbar">
        <div className="view-switch"><button className={view === "internal" ? "active" : ""} onClick={() => setView("internal")}>Internal</button><button disabled={!reviewPublished} className={view === "client" ? "active" : ""} onClick={() => setView("client")}>Client projection</button></div>
        <div className="review-status"><span>Round 01</span><StatusBadge status={state.reviewRound?.status ?? "Draft"} /></div>
      </div>

      {!state.candidatesLoaded ? (
        <section className="workflow-empty"><span className="stage-index">UPSTREAM GATE</span><h3>Qualify candidate batches first.</h3><p>Client Review opens only after search packages and evidence-backed candidate batches exist.</p><Link to="/search-candidates" className="primary-inline">Open Search & Candidates</Link></section>
      ) : view === "internal" ? (
        <>
          <section className="review-kpis">
            <div><span>CLIENT SLATE</span><strong>{primaries.length} / 30</strong><small>qualified primaries</small></div>
            <div><span>INTERNAL RESERVE</span><strong>{backups.length} / 10</strong><small>hidden backups</small></div>
            <div><span>PROJECTION CHECK</span><strong>{validation.valid ? "PASS" : "BLOCKED"}</strong><small>{validation.errors[0] ?? "sensitive fields excluded"}</small></div>
          </section>
          <section className="review-board panel">
            <div className="panel-head"><div><span className="micro-label">INTERNAL REVIEW BUILDER</span><h3>30 primaries + 10 protected backups</h3></div>{!reviewPublished && <button disabled={!validation.valid} className="primary-inline" onClick={() => { dispatch({ type: "PUBLISH_REVIEW" }); setView("client"); }}>Publish Round 1</button>}</div>
            <div className="review-lanes">
              <ReviewLane title="Client slate" candidates={primaries} />
              <ReviewLane title="Hidden backup pool" candidates={backups} />
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="client-banner"><div><span>CLIENT VIEW · SAFE PROJECTION</span><strong>Cycling Camera Creator Review</strong></div><p>30 creators · evidence and commercial range only</p></section>
          {state.reviewRound?.status !== "Submitted" && <div className="feedback-action"><p><strong>Demo feedback:</strong> client passes on UK Urban creators, creating a traceable coverage gap.</p><button className="primary-inline" onClick={() => dispatch({ type: "SUBMIT_DECISIONS", decisions: seededDecisions })}>Apply & submit seeded feedback</button></div>}
          <section className="client-grid">
            {clientCandidates.map((candidate) => <ClientCard key={candidate.id} candidate={candidate} onDecision={(decision) => dispatch({ type: "SET_CLIENT_DECISION", candidateId: candidate.id, decision })} />)}
          </section>
          {state.gapAssessment && <GapPanel />}
        </>
      )}
    </div>
  );
}

function ReviewLane({ title, candidates }: { title: string; candidates: ReturnType<typeof useCampaign>["state"]["candidates"] }) {
  return <div className="review-lane"><div className="lane-head"><strong>{title}</strong><span>{candidates.length}</span></div>{candidates.map((candidate) => <div className="lane-row" key={candidate.id}><div><strong>{candidate.creatorName}</strong><small>{candidate.market} · {candidate.ridingScenario} · {candidate.platform}</small></div><span>{candidateScore(candidate).total.toFixed(1)}</span></div>)}</div>;
}

function ClientCard({ candidate, onDecision }: { candidate: ClientCandidate; onDecision: (decision: CandidateDecision) => void }) {
  const evidence = candidate.evidence[0];
  return <article className={`client-card ${candidate.decision === "Pass" ? "passed" : ""}`}>
    <div className="client-card-head"><div><span>{candidate.market} · {candidate.ridingScenario}</span><h3>{candidate.creatorName}</h3><small>{candidate.handle} · {candidate.platform}</small></div><StatusBadge status={candidate.decision} /></div>
    <div className="evidence-strip"><span>VERIFIED CYCLING</span><strong>{evidence?.views.toLocaleString() ?? "—"} relevant views</strong><small>{evidence?.proofPoints.slice(0, 3).join(" · ")}</small></div>
    <dl><div><dt>Deliverable</dt><dd>{candidate.deliverables}</dd></div><div><dt>Quote range</dt><dd>{candidate.quoteRange}</dd></div><div><dt>Rights</dt><dd>{candidate.rightsSummary}</dd></div><div><dt>Forecast</dt><dd>{candidate.forecastViews.toLocaleString()} views</dd></div></dl>
    <div className="decision-buttons">{(["Select", "Maybe", "Pass"] as CandidateDecision[]).map((decision) => <button className={candidate.decision === decision ? "active" : ""} key={decision} onClick={() => onDecision(decision)}>{decision}</button>)}</div>
  </article>;
}

function GapPanel() {
  const { state, dispatch } = useCampaign();
  const gap = state.gapAssessment!;
  const backup = state.candidates.find((candidate) => candidate.id === gap.backupCandidateId);
  const replenishmentCreated = state.searchPackages.some((item) => item.parentPackageId === gap.packageId);
  return <section className="gap-panel">
    <div className="gap-title"><div><span>FORECAST VARIANCE</span><h3>{gap.missingCells.length} Matrix cells need recovery</h3></div><StatusBadge status="Gap" /></div>
    <div className="gap-cells">{gap.missingCells.map((cell) => <div key={cell.matrixCellId}><strong>{cell.market} · {cell.ridingScenario}</strong><span>{cell.missingCreators} creator · {cell.missingViews.toLocaleString()} views</span></div>)}</div>
    <div className="recommendation"><div><span>LEAST-DESTRUCTIVE NEXT ACTION</span><strong>{gap.recommendedAction}</strong><small>{backup ? `${backup.creatorName} is qualified for ${backup.matrixCellId}.` : "Keep the locked plan; refill only the missing package."}</small></div>
      {gap.recommendedAction === "Promote Backup" && gap.backupCandidateId ? <button className="primary-inline" onClick={() => dispatch({ type: "PROMOTE_BACKUP", candidateId: gap.backupCandidateId! })}>Promote backup</button>
        : <button disabled={replenishmentCreated} className="primary-inline" onClick={() => dispatch({ type: "CREATE_REPLENISHMENT", packageId: gap.packageId })}>{replenishmentCreated ? "Replenishment created" : "Create replenishment"}</button>}
    </div>
  </section>;
}
