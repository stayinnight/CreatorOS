import type { CampaignCandidate, GapAssessment, MatrixScenario } from "./model";

export function assessGap(matrix: MatrixScenario, reviewedCandidates: CampaignCandidate[], backups: CampaignCandidate[]): GapAssessment {
  const selected = reviewedCandidates.filter((candidate) => candidate.decision === "Select" || candidate.decision === "Maybe");
  const missingCells = matrix.rows.flatMap((row) => {
    const selectedForCell = selected.filter((candidate) => candidate.matrixCellId === row.id);
    const missingCreators = Math.max(0, row.plannedCreators - selectedForCell.length);
    if (!missingCreators) return [];
    return [{
      matrixCellId: row.id,
      market: row.market,
      ridingScenario: row.ridingScenario,
      missingCreators,
      missingViews: Math.max(0, row.medianRelevantViews * missingCreators),
    }];
  });
  const firstGap = missingCells[0];
  const matchingBackup = firstGap ? backups.find((candidate) => candidate.matrixCellId === firstGap.matrixCellId && candidate.role === "Backup") : null;
  const committedCost = selected.reduce((sum, candidate) => sum + candidate.quote.total, 0);
  return {
    id: "gap-round-01",
    missingCells,
    remainingBudget: 180_000 - committedCost,
    recommendedAction: matchingBackup ? "Promote Backup" : "Replenish",
    packageId: firstGap ? `pkg-${firstGap.matrixCellId}` : "",
    backupCandidateId: matchingBackup?.id ?? null,
  };
}

export function recommendGapAction(gap: GapAssessment, backups: CampaignCandidate[]) {
  const firstGap = gap.missingCells[0];
  const backup = firstGap ? backups.find((candidate) => candidate.role === "Backup" && candidate.matrixCellId === firstGap.matrixCellId) : null;
  return backup
    ? { action: "Promote Backup" as const, candidateId: backup.id, packageId: gap.packageId }
    : { action: "Replenish" as const, candidateId: null, packageId: gap.packageId };
}
