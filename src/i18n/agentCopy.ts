import type { AgentMessage, AgentToolKind, AgentToolStepRecord } from "../agent/model";
import { translate, type Locale } from "./messages";

const zhToolLabels: Record<AgentToolKind, string> = {
  ReadSources: "读取原始材料", ExtractBrief: "提取需求简报", DetectConflicts: "检测需求冲突", ApplyDecision: "应用人工决策",
  BuildMix: "生成创作者组合", LockMatrix: "锁定 Matrix", GenerateSearchPackages: "生成搜索任务包", EvaluateQualification: "评估候选人资格",
  InspectEvidence: "核验骑行证据", BuildCalibration: "生成校准批次", ValidateSlate: "校验客户名单", PublishReview: "发布客户评审",
  AssessGap: "评估交付缺口", RecoverGap: "修复交付缺口", ReadMatrixCell: "读取 Matrix 单元格", SummarizeFit: "汇总匹配度",
  ReadQuote: "读取报价", CompareBudgetCeiling: "对比预算上限", ApplyCampaignPreferences: "应用项目偏好", ReadWorkflowState: "读取工作流状态",
};

const enToolLabels: Record<AgentToolKind, string> = {
  ReadSources: "Read source materials", ExtractBrief: "Extract campaign brief", DetectConflicts: "Detect requirement conflicts", ApplyDecision: "Apply human decision",
  BuildMix: "Build creator mix", LockMatrix: "Lock Matrix", GenerateSearchPackages: "Generate search packages", EvaluateQualification: "Evaluate candidate qualification",
  InspectEvidence: "Inspect riding evidence", BuildCalibration: "Build calibration batch", ValidateSlate: "Validate client slate", PublishReview: "Publish client review",
  AssessGap: "Assess delivery gap", RecoverGap: "Recover delivery gap", ReadMatrixCell: "Read Matrix cell", SummarizeFit: "Summarize creator fit",
  ReadQuote: "Read quote", CompareBudgetCeiling: "Compare budget ceiling", ApplyCampaignPreferences: "Apply campaign preferences", ReadWorkflowState: "Read workflow state",
};

export function localizeAgentMessage(locale: Locale, message: AgentMessage) {
  if (message.role === "User" || !message.messageKey) return message.text;
  return translate(locale, message.messageKey, message.messageParams);
}

export function localizeToolStep(locale: Locale, step: AgentToolStepRecord): AgentToolStepRecord {
  const label = locale === "zh-CN" ? zhToolLabels[step.kind] : enToolLabels[step.kind];
  return { ...step, label, summary: locale === "zh-CN" ? `已完成：${label}` : `Completed: ${label}` };
}
