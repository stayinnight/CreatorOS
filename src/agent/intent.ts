import type { CampaignState } from "../domain/model";

export type AgentIntent =
  | { type: "ScopeRun"; scope: "BriefOnly" }
  | { type: "ExplainCandidate"; candidateId: string }
  | { type: "FindSimilar"; candidateId: string; preference: "Lifestyle" }
  | { type: "CampaignFact"; query: string }
  | { type: "Status" }
  | { type: "Unsupported"; suggestions: string[] };

export function parseAgentIntent(input: string, context?: { candidateId?: string }): AgentIntent {
  const normalized = input.trim().toLowerCase();
  if (normalized.includes("只整理 brief")) return { type: "ScopeRun", scope: "BriefOnly" };
  if (normalized.includes("为什么推荐") && context?.candidateId) return { type: "ExplainCandidate", candidateId: context.candidateId };
  if (normalized.includes("相似") && normalized.includes("生活化") && context?.candidateId) return { type: "FindSimilar", candidateId: context.candidateId, preference: "Lifestyle" };
  return { type: "Unsupported", suggestions: ["先只整理 Brief", "为什么推荐他", "找相似但更生活化的人"] };
}

export function resolveAgentIntent(input: string, context: { state: CampaignState; candidateId?: string }) {
  const parsed = parseAgentIntent(input, context);
  if (parsed.type !== "Unsupported") return { intent: parsed, confidence: "Exact" as const, requiredContext: parsed.type === "ExplainCandidate" || parsed.type === "FindSimilar" ? "Candidate" as const : "None" as const, available: true, suggestions: [] as string[] };
  const normalized = input.trim().toLowerCase();
  if (/预算|市场|目标|播放|证据|proof|budget|market|matrix|方案/.test(normalized)) return { intent: { type: "CampaignFact" as const, query: input }, confidence: "Alias" as const, requiredContext: "None" as const, available: true, suggestions: [] as string[] };
  if (/进度|下一步|status/.test(normalized)) return { intent: { type: "Status" as const }, confidence: "Alias" as const, requiredContext: "None" as const, available: true, suggestions: [] as string[] };
  return { intent: parsed, confidence: "Fallback" as const, requiredContext: "None" as const, available: false, suggestions: context.state.agent.activeRunId ? ["当前进度", "下一步做什么", "查看预算"] : ["分析 3 份材料", "先只整理 Brief"] };
}
