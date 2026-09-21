import type { CampaignState } from "../domain/model";
import type { AgentToolKind, AgentToolStepRecord } from "./model";

export interface AgentTurnContext { candidateId?: string }
export interface AgentTurnPlan { understanding: string; steps: AgentToolStepRecord[]; ruleIds: string[]; evidenceIds: string[] }

const labels: Record<AgentToolKind, string> = {
  ReadMatrixCell: "读取 Matrix 单元格",
  EvaluateQualification: "校验 6 项资格门禁",
  InspectEvidence: "检查头戴摄像头证据",
  SummarizeFit: "汇总匹配分与风险",
  ReadQuote: "读取候选报价",
  CompareBudgetCeiling: "对比单元格预算上限",
  ApplyCampaignPreferences: "应用 Campaign 偏好",
  ReadWorkflowState: "读取当前 Run 与 Artifact 状态",
};

function steps(kinds: AgentToolKind[], refs: string[]) {
  return kinds.map((kind, index): AgentToolStepRecord => ({ id: `tool-${index + 1}`, kind, label: labels[kind], inputRefs: refs, summary: labels[kind].replace("读取", "已读取").replace("检查", "已检查").replace("校验", "已校验").replace("汇总", "已汇总").replace("对比", "已对比").replace("应用", "已应用") }));
}

export function buildAgentTurnPlan(state: CampaignState, query: string, context: AgentTurnContext = {}): AgentTurnPlan {
  const candidate = context.candidateId ? state.candidates.find((item) => item.id === context.candidateId) : undefined;
  const refs = candidate ? [candidate.id, candidate.matrixCellId] : [state.agent.activeRunId ?? state.id];
  const evidenceIds = candidate?.evidence.map((item) => item.id) ?? [];
  if (/预算|报价|费用|budget|quote/i.test(query)) return { understanding: "核对候选报价与预算风险", steps: steps(["ReadQuote", "CompareBudgetCeiling"], refs), ruleIds: ["matrix.commercial"], evidenceIds: [] };
  if (/相似|类似|生活化|similar/i.test(query)) return { understanding: "在同一 Matrix Cell 查找更匹配的候选", steps: steps(["ReadMatrixCell", "EvaluateQualification", "ApplyCampaignPreferences", "SummarizeFit"], refs), ruleIds: ["matrix.riding-scenario", "brief.real-cycling"], evidenceIds };
  if (candidate && /推荐|证据|风险|为什么|头戴|pov/i.test(query)) return { understanding: "解释当前候选的推荐依据", steps: steps(["ReadMatrixCell", "EvaluateQualification", "InspectEvidence", "SummarizeFit"], refs), ruleIds: ["brief.real-cycling", "brief.head-camera-proof", "matrix.riding-scenario"], evidenceIds };
  return { understanding: "确认当前工作流状态与下一步", steps: steps(["ReadWorkflowState"], refs), ruleIds: [], evidenceIds: [] };
}
