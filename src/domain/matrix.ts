import type { BriefVersion, MatrixRow, MatrixScenario } from "./model";

export interface RowCalculation {
  cost: number;
  expectedViews: number;
  cpm: number | null;
}

export interface MatrixSummary {
  totalCost: number;
  totalExpectedViews: number;
  blendedCpm: number | null;
  longFormCreators: number;
}

export interface ConstraintResult {
  id: string;
  label: string;
  status: "pass" | "fail";
  current: string;
  target: string;
  affectedRowIds: string[];
}

export function calculateRow(row: MatrixRow): RowCalculation {
  const cost = row.plannedCreators * (row.creatorFee + row.rightsCost + row.otherCost);
  const expectedViews = row.plannedCreators * row.postsPerCreator * row.medianRelevantViews;
  return { cost, expectedViews, cpm: expectedViews > 0 ? cost / expectedViews * 1000 : null };
}

export function summarizeMatrix(rows: MatrixRow[]): MatrixSummary {
  const totals = rows.reduce((acc, row) => {
    const value = calculateRow(row);
    return {
      totalCost: acc.totalCost + value.cost,
      totalExpectedViews: acc.totalExpectedViews + value.expectedViews,
      longFormCreators: acc.longFormCreators + (row.contentFormat === "Long Review" ? row.plannedCreators : 0),
    };
  }, { totalCost: 0, totalExpectedViews: 0, longFormCreators: 0 });
  return {
    ...totals,
    blendedCpm: totals.totalExpectedViews > 0 ? totals.totalCost / totals.totalExpectedViews * 1000 : null,
  };
}

function result(id: string, label: string, pass: boolean, current: string, target: string, affectedRowIds: string[] = []): ConstraintResult {
  return { id, label, status: pass ? "pass" : "fail", current, target, affectedRowIds };
}

export function evaluateMatrix(rows: MatrixRow[], brief: BriefVersion): ConstraintResult[] {
  const summary = summarizeMatrix(rows);
  const activeRows = rows.filter((row) => row.plannedCreators > 0);
  const markets = new Set(activeRows.map((row) => row.market));
  const scenarios = new Set(activeRows.map((row) => row.ridingScenario));
  const invalidRows = rows.filter((row) => !Number.isInteger(row.plannedCreators) || row.plannedCreators < 0 || row.postsPerCreator <= 0 || row.medianRelevantViews <= 0 || row.creatorFee < 0 || row.rightsCost < 0 || row.otherCost < 0);

  return [
    result("budget", "Budget cap", summary.totalCost <= brief.budgetCap, `$${summary.totalCost.toLocaleString()}`, `≤ $${brief.budgetCap.toLocaleString()}`, rows.map((row) => row.id)),
    result("views", "Effective views", summary.totalExpectedViews >= brief.viewsTarget, summary.totalExpectedViews.toLocaleString(), `≥ ${brief.viewsTarget.toLocaleString()}`, rows.map((row) => row.id)),
    result("cpm", "Blended CPM", summary.blendedCpm !== null && summary.blendedCpm <= brief.cpmTarget, summary.blendedCpm === null ? "N/A" : `$${summary.blendedCpm.toFixed(2)}`, `≤ $${brief.cpmTarget}`, rows.map((row) => row.id)),
    result("youtube", "YouTube coverage", activeRows.some((row) => row.platform === "YouTube"), activeRows.some((row) => row.platform === "YouTube") ? "Covered" : "Missing", "Required", rows.filter((row) => row.platform === "YouTube").map((row) => row.id)),
    result("long-form", "Long-form creators", summary.longFormCreators >= brief.minimumLongFormCreators, String(summary.longFormCreators), `≥ ${brief.minimumLongFormCreators}`, rows.filter((row) => row.contentFormat === "Long Review").map((row) => row.id)),
    result("markets", "US + UK coverage", brief.markets.every((market) => markets.has(market)), Array.from(markets).join(" + ") || "None", "US + UK", rows.filter((row) => !markets.has(row.market)).map((row) => row.id)),
    result("scenarios", "Road / MTB / Urban", brief.ridingScenarios.every((scenario) => scenarios.has(scenario)), Array.from(scenarios).join(" / ") || "None", "All 3", rows.filter((row) => !scenarios.has(row.ridingScenario)).map((row) => row.id)),
    result("brief", "Brief conflicts", brief.conflicts.every((conflict) => conflict.status === "Resolved"), `${brief.conflicts.filter((conflict) => conflict.status === "Unresolved").length} open`, "0 open"),
    result("numeric", "Valid row inputs", invalidRows.length === 0, invalidRows.length ? `${invalidRows.length} invalid` : "Valid", "All valid", invalidRows.map((row) => row.id)),
  ];
}

export function lockMatrix(scenario: MatrixScenario, brief: BriefVersion): MatrixScenario {
  if (scenario.status === "Locked") return scenario;
  const failures = evaluateMatrix(scenario.rows, brief).filter((item) => item.status === "fail");
  if (failures.length) throw new Error(`Cannot lock: ${failures.map((item) => item.label).join(", ")}`);
  return { ...scenario, status: "Locked", version: scenario.version + 1, lockedAt: "2026-09-21T10:00:00+08:00" };
}
