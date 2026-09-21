import { useCampaign } from "../../app/CampaignProvider";

export function GapArtifactDetail() {
  const { state, dispatch } = useCampaign();
  const gap = state.gapAssessment;
  if (!gap) return <div className="inspector-placeholder">No gap assessment is available.</div>;
  const backup = state.candidates.find((candidate) => candidate.id === gap.backupCandidateId);
  const replenished = state.searchPackages.some((item) => item.parentPackageId === gap.packageId);
  return <div className="inspector-body"><div className="batch-summary"><div><span>AFFECTED CELLS</span><strong>{gap.missingCells.length}</strong></div><div><span>MISSING VIEWS</span><strong>{gap.missingCells.reduce((sum, cell) => sum + cell.missingViews, 0).toLocaleString()}</strong></div><div><span>BUDGET LEFT</span><strong>${Math.round(gap.remainingBudget / 1000)}K</strong></div></div><section className="gap-detail"><span className="micro-label">LOCAL IMPACT ONLY</span>{gap.missingCells.map((cell) => <article key={cell.matrixCellId}><strong>{cell.market} · {cell.ridingScenario}</strong><span>{cell.missingCreators} creator missing</span><small>{cell.matrixCellId}</small></article>)}<div className="cause-tags"><span>Client pass</span><span>Coverage below locked cell</span><span>Upstream artifacts preserved</span></div></section><div className="inspector-approval"><div><strong>{gap.recommendedAction}</strong><p>{backup ? `${backup.creatorName} already qualifies for the affected cell.` : "Refill only the affected search package."}</p></div>{gap.backupCandidateId ? <button type="button" onClick={() => dispatch({ type: "PROMOTE_BACKUP", candidateId: gap.backupCandidateId! })}>Promote backup →</button> : <button type="button" disabled={replenished} onClick={() => dispatch({ type: "CREATE_REPLENISHMENT", packageId: gap.packageId })}>{replenished ? "Recovery complete" : "Create replenishment →"}</button>}</div></div>;
}
