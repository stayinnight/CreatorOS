import type { CampaignState } from "../domain/model";
import { summarizeMatrix } from "../domain/matrix";
export interface CampaignFact { title: string; body: string }
export function answerCampaignFact(state: CampaignState, query: string): CampaignFact | null {
  const text = query.trim().toLowerCase();
  if (text.includes("预算") || text.includes("budget")) return { title: "Campaign budget", body: `总预算上限为 $${state.brief.budgetCap.toLocaleString()}，包含达人费用与版权成本。` };
  if (text.includes("市场") || text.includes("market")) return { title: "Markets", body: `${state.brief.markets.join(" + ")}，覆盖 ${state.brief.ridingScenarios.join(" / ")} 骑行场景。` };
  if (text.includes("证据") || text.includes("proof")) return { title: "Evidence requirements", body: state.brief.proofPoints.join(" · ") };
  if (text.includes("目标") || text.includes("播放")) return { title: "Performance target", body: `${state.brief.viewsTarget.toLocaleString()} effective views，blended CPM ≤ $${state.brief.cpmTarget}。` };
  if (text.includes("matrix") || text.includes("方案")) { const summary = summarizeMatrix(state.matrixScenarios.find((item) => item.id === state.activeScenarioId)!.rows); return { title: "Active Mix", body: `$${summary.totalCost.toLocaleString()} · ${summary.totalExpectedViews.toLocaleString()} views · ${summary.longFormCreators} long-form creators` }; }
  return null;
}
