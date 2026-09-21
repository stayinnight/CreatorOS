import type { CampaignState } from "../domain/model";
export interface AgentActionSuggestion { id: string; label: string; input: string; candidateId?: string }
export function availableActions(state: CampaignState, context: { candidateId?: string }): AgentActionSuggestion[] {
  if (!state.agent.activeRunId) return [{ id: "analyze", label: "分析 3 份材料", input: "分析 3 份材料" }, { id: "brief-only", label: "先只整理 Brief", input: "先只整理 Brief" }];
  const activeRun = state.agent.runs.find((run) => run.id === state.agent.activeRunId);
  if (activeRun?.scope === "BriefOnly" && activeRun.status === "Completed") return [{ id: "open-brief", label: "打开 Brief v1", input: "打开 Brief" }, { id: "continue", label: "继续完整计划", input: "继续完整计划" }];
  const pending = state.agent.decisions.find((item) => item.status === "Pending");
  if (pending) return [{ id: "recommend", label: "采用建议", input: `采用建议：${pending.recommendation}` }, { id: "sources", label: "查看来源", input: "查看当前冲突来源" }, { id: "brief-only", label: "先只整理 Brief", input: "先只整理 Brief" }, { id: "status", label: "当前进度", input: "当前进度" }];
  if (context.candidateId) return [{ id: "explain", label: "为什么推荐他", input: "为什么推荐他", candidateId: context.candidateId }, { id: "similar", label: "找相似但更生活化的人", input: "找相似但更生活化的人", candidateId: context.candidateId }];
  return [{ id: "status", label: "当前进度", input: "当前进度" }, { id: "next", label: "下一步", input: "下一步做什么" }, { id: "budget", label: "查看预算", input: "预算是多少" }];
}
