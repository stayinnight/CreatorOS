import type { MatrixScenario, SearchPackage } from "./model";

export function generateSearchPackages(matrix: MatrixScenario): SearchPackage[] {
  if (matrix.status !== "Locked") throw new Error("Lock the Matrix before generating search packages");
  return matrix.rows.filter((row) => row.plannedCreators > 0).map((row) => {
    const candidateTargetCount = row.plannedCreators * row.searchMultiplier;
    return {
      id: `pkg-${row.id}`,
      campaignId: "campaign-cycling-camera",
      briefVersionId: matrix.briefVersionId,
      matrixVersionId: matrix.id,
      matrixCellId: row.id,
      market: row.market,
      platform: row.platform,
      ridingScenario: row.ridingScenario,
      creatorTier: row.creatorTier,
      contentFormat: row.contentFormat,
      targetCreatorCount: row.plannedCreators,
      candidateTargetCount,
      backupTargetCount: candidateTargetCount - row.plannedCreators,
      budgetCeilingPerCreator: row.creatorFee + row.rightsCost + row.otherCost,
      expectedViewsFloor: row.medianRelevantViews,
      rightsRequirements: "90-day paid usage · US + UK · included in total budget",
      mustHaveRules: ["Verified real cycling content", `${row.ridingScenario} scenario evidence`, `${row.platform} format fit`],
      exclusionRules: ["Motorcycle-only or skiing-only content", "Unverifiable or copied content", "Blocking brand-safety risk"],
      evidenceRequirements: ["Source URL", "Recent relevant views", "Camera proof-point timestamps"],
      owner: row.market === "US" ? "Maya Chen" : "Oliver Grant",
      dueAt: "2026-09-28",
      status: "Ready",
      parentPackageId: null,
    };
  });
}
