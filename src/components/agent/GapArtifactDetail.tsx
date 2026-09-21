import { useCampaign } from "../../app/CampaignProvider";

export function GapArtifactDetail() {
  const { state } = useCampaign();
  const gap = state.gapAssessment;
  if (!gap) return <div className="inspector-placeholder">No gap assessment is available.</div>;
  const backup = state.candidates.find((candidate) => candidate.id === gap.backupCandidateId);
  return <div className="inspector-body"><div className="batch-summary"><div><span>AFFECTED CELLS</span><strong>{gap.missingCells.length}</strong></div><div><span>MISSING VIEWS</span><strong>{gap.missingCells.reduce((sum, cell) => sum + cell.missingViews, 0).toLocaleString()}</strong></div><div><span>BUDGET LEFT</span><strong>${Math.round(gap.remainingBudget / 1000)}K</strong></div></div><section className="gap-detail"><span className="micro-label">LOCAL IMPACT ONLY</span>{gap.missingCells.map((cell) => <article key={cell.matrixCellId}><strong>{cell.market} · {cell.ridingScenario}</strong><span>{cell.missingCreators} creator missing</span><small>{cell.matrixCellId}</small></article>)}<div className="cause-tags"><span>Client pass</span><span>Coverage below locked cell</span><span>Upstream artifacts preserved</span></div></section><div className="inspector-approval"><div><strong>{gap.recommendedAction}</strong><p>{backup ? `${backup.creatorName} already qualifies for the affected cell. Use the recommended action above to promote them.` : "Use the recommended action above to refill only the affected search package."}</p></div></div></div>;
}
