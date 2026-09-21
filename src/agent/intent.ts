export type AgentIntent =
  | { type: "ScopeRun"; scope: "BriefOnly" }
  | { type: "ExplainCandidate"; candidateId: string }
  | { type: "FindSimilar"; candidateId: string; preference: "Lifestyle" }
  | { type: "Unsupported"; suggestions: string[] };

export function parseAgentIntent(input: string, context?: { candidateId?: string }): AgentIntent {
  const normalized = input.trim().toLowerCase();
  if (normalized.includes("只整理 brief")) return { type: "ScopeRun", scope: "BriefOnly" };
  if (normalized.includes("为什么推荐") && context?.candidateId) return { type: "ExplainCandidate", candidateId: context.candidateId };
  if (normalized.includes("相似") && normalized.includes("生活化") && context?.candidateId) return { type: "FindSimilar", candidateId: context.candidateId, preference: "Lifestyle" };
  return { type: "Unsupported", suggestions: ["先只整理 Brief", "为什么推荐他", "找相似但更生活化的人"] };
}
