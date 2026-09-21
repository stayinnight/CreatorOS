import type { CampaignState } from "../domain/model";
import type { AgentToolKind, AgentToolStepRecord } from "./model";

export interface AgentTurnContext { candidateId?: string }
export interface AgentTurnPlan { understanding: string; steps: AgentToolStepRecord[]; ruleIds: string[]; evidenceIds: string[] }

const labels: Record<AgentToolKind, string> = {
  ReadSources: "读取 3 份客户材料",
  ExtractBrief: "提取 Brief 字段与来源",
  DetectConflicts: "检查高影响冲突",
  ApplyDecision: "应用人工决策",
  BuildMix: "计算 Creator Mix 方案",
  LockMatrix: "校验并锁定 Matrix",
  GenerateSearchPackages: "生成 6 个搜索任务包",
  ReadMatrixCell: "读取 Matrix 单元格",
  EvaluateQualification: "校验 6 项资格门禁",
  InspectEvidence: "检查头戴摄像头证据",
  SummarizeFit: "汇总匹配分与风险",
  ReadQuote: "读取候选报价",
  CompareBudgetCeiling: "对比单元格预算上限",
  ApplyCampaignPreferences: "应用 Campaign 偏好",
  ReadWorkflowState: "读取当前 Run 与 Artifact 状态",
  BuildCalibration: "生成 10 人校准样本",
  ValidateSlate: "校验 30 + 10 名单",
  PublishReview: "生成客户安全投影",
  AssessGap: "映射客户反馈与覆盖缺口",
  RecoverGap: "执行局部补量",
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

export function buildCampaignActionTurnPlan(actionType: string): AgentTurnPlan {
  const mapping: Record<string, { understanding: string; kinds: AgentToolKind[] }> = {
    LOAD_DEMO_MATERIALS: { understanding: "分析客户材料并规划工作", kinds: ["ReadSources", "ExtractBrief", "DetectConflicts"] },
    START_AGENT_RUN: { understanding: "执行已确认的材料分析计划", kinds: ["ReadSources", "ExtractBrief", "DetectConflicts"] },
    RESOLVE_AGENT_DECISION: { understanding: "应用决策并检查是否可以继续", kinds: ["ApplyDecision", "ReadWorkflowState"] },
    GENERATE_MIX_OPTIONS: { understanding: "根据 Brief 计算 Creator Mix", kinds: ["ReadWorkflowState", "BuildMix"] },
    LOCK_MATRIX: { understanding: "校验约束并锁定 Creator Matrix", kinds: ["ReadMatrixCell", "LockMatrix"] },
    GENERATE_PACKAGES: { understanding: "把 Locked Matrix 转成搜索任务", kinds: ["ReadMatrixCell", "GenerateSearchPackages"] },
    START_SOURCING: { understanding: "筛选候选并生成校准样本", kinds: ["EvaluateQualification", "InspectEvidence", "BuildCalibration"] },
    APPROVE_CALIBRATION: { understanding: "校验校准门槛并扩展完整名单", kinds: ["EvaluateQualification", "ApplyCampaignPreferences", "ValidateSlate"] },
    PREPARE_REVIEW: { understanding: "校验 30 + 10 与客户字段边界", kinds: ["ValidateSlate", "PublishReview"] },
    PUBLISH_REVIEW: { understanding: "发布客户安全投影", kinds: ["ValidateSlate", "PublishReview"] },
    APPLY_SEEDED_CLIENT_FEEDBACK: { understanding: "分析客户反馈与 Matrix 缺口", kinds: ["ReadWorkflowState", "AssessGap"] },
    PROMOTE_BACKUP: { understanding: "用合格 Backup 修复受影响单元格", kinds: ["EvaluateQualification", "RecoverGap"] },
    CREATE_REPLENISHMENT: { understanding: "为缺口单元格创建局部补量", kinds: ["ReadMatrixCell", "RecoverGap"] },
    RETRY_AGENT_STEP: { understanding: "重试失败的 Agent 步骤", kinds: ["ReadWorkflowState"] },
  };
  const selected = mapping[actionType] ?? { understanding: "执行当前 Campaign 动作", kinds: ["ReadWorkflowState"] };
  return { understanding: selected.understanding, steps: steps(selected.kinds, [actionType]), ruleIds: [], evidenceIds: [] };
}
