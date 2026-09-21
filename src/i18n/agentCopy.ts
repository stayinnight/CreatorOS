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

const zhSystemCopy: Record<string, string> = {
  "I will read 3 sources, normalize the Brief, surface high-impact conflicts, and pause before strategy decisions.": "我会读取 3 份材料、整理 Brief、识别高影响冲突，并在策略决策前暂停。",
  "Read 3 sources · extracted 18 fields · found 2 high-impact conflicts": "已读取 3 份材料 · 提取 18 个字段 · 发现 2 个高影响冲突",
  "Brief v1 is ready. Next I can build and compare two creator mix options.": "Brief v1 已就绪。接下来我可以生成并比较两套创作者组合。",
  "I built two creator mix options. Compare the trade-offs, inspect the Matrix, then lock one direction.": "我已生成两套创作者组合。请比较取舍、检查 Matrix，然后锁定一个方向。",
  "Brief-only Run complete. Brief v1 is published; downstream planning was intentionally skipped.": "仅整理 Brief 的 Run 已完成。Brief v1 已发布，下游规划已按要求跳过。",
  "Plan revised: finish Brief v1, then stop. Matrix, sourcing, calibration, review and recovery are skipped in this Run.": "计划已调整：完成 Brief v1 后停止。本次 Run 将跳过 Matrix、寻源、校准、评审和缺口修复。",
  "Continuation plan: build Mix, calibrate candidates, publish client review, and recover local gaps.": "后续计划：生成 Mix、校准候选人、发布客户评审，并修复局部缺口。",
  "Calibration approved. I can validate the 30 + 10 slate and prepare the client review.": "校准已批准。我可以校验 30 位主选和 10 位内部备选，并准备客户评审。",
  "30 client candidates are projection-safe; 10 backups remain internal. Preview the client view, then approve publication.": "30 位客户候选人已通过投影安全校验；10 位备选仍仅供内部使用。请预览客户视图后批准发布。",
  "Client passes created a UK Urban gap. Promote the qualified backup, then replenish only that search package.": "客户的 Pass 造成了 UK Urban 缺口。请先补位合格备选，再仅补充对应搜索任务包。",
  "Two creator mix options ready to compare": "两套创作者组合已可比较",
  "Brief v1 published · 2 conflicts resolved · US / UK cycling camera launch": "Brief v1 已发布 · 2 个冲突已解决 · US / UK 骑行摄像头上市项目",
  "Calibration batch ready · 8 qualified examples + 2 explicit failure cases": "校准批次已就绪 · 8 个合格样例 + 2 个明确失败样例",
  "Client slate ready · 30 primaries + 10 internal backups": "客户名单已就绪 · 30 位主选 + 10 位内部备选",
  "Client Review Round 1 published · 30 projection-safe creators": "客户评审第 1 轮已发布 · 30 位投影安全创作者",
};

const enUnderstanding: Record<string, string> = {
  "核对候选报价与预算风险": "Check the candidate quote and budget risk", "在同一 Matrix Cell 查找更匹配的候选": "Find a stronger fit in the same Matrix cell", "解释当前候选的推荐依据": "Explain the recommendation for this candidate", "确认当前工作流状态与下一步": "Confirm workflow status and the next step",
  "分析客户材料并规划工作": "Analyze client materials and plan the work", "执行已确认的材料分析计划": "Run the confirmed material-analysis plan", "应用决策并检查是否可以继续": "Apply the decision and check whether work can continue", "根据 Brief 计算 Creator Mix": "Build the creator mix from the Brief", "校验约束并锁定 Creator Matrix": "Validate constraints and lock the Creator Matrix", "把 Locked Matrix 转成搜索任务": "Turn the locked Matrix into search tasks", "筛选候选并生成校准样本": "Evaluate candidates and build the calibration sample", "校验校准门槛并扩展完整名单": "Validate calibration gates and expand the full slate", "校验 30 + 10 与客户字段边界": "Validate the 30 + 10 slate and client-safe fields", "发布客户安全投影": "Publish the client-safe projection", "分析客户反馈与 Matrix 缺口": "Analyze client feedback and Matrix gaps", "用合格 Backup 修复受影响单元格": "Use a qualified backup to recover the affected cell", "为缺口单元格创建局部补量": "Create a local replenishment for the gap cell", "重试失败的 Agent 步骤": "Retry the failed Agent step", "执行当前 Campaign 动作": "Execute the current campaign action",
};

export function localizeUnderstanding(locale: Locale, text: string) { return locale === "en" ? enUnderstanding[text] ?? text : text; }

export function localizeSystemText(locale: Locale, text: string) {
  if (locale === "en") {
    if (text === "把客户材料交给我。我会先分析邮件、预算表和会议纪要，再在高影响冲突处暂停。") return "Give me the client materials. I’ll analyze the email, budget sheet, and meeting notes, then pause at high-impact conflicts.";
    const budget = text.match(/^总预算上限为 \$([\d,]+)，包含达人费用与版权成本。$/);
    if (budget) return `The total budget cap is $${budget[1]}, including creator fees and rights costs.`;
    const markets = text.match(/^(.+)，覆盖 (.+) 骑行场景。$/);
    if (markets) return `${markets[1]}, covering ${markets[2]} riding scenarios.`;
    return text;
  }
  if (zhSystemCopy[text]) return zhSystemCopy[text];
  const packages = text.match(/^(\d+) search packages generated from the locked Matrix$/);
  if (packages) return `已根据锁定的 Matrix 生成 ${packages[1]} 个搜索任务包`;
  const progress = text.match(/^(\d+)\/(\d+) steps complete · (.+)$/);
  if (progress) return `已完成 ${progress[1]}/${progress[2]} 个步骤 · ${progress[3]}`;
  return text;
}

export function localizeAgentMessage(locale: Locale, message: AgentMessage) {
  if (message.role === "User") return message.text;
  if (!message.messageKey) return localizeSystemText(locale, message.text);
  return translate(locale, message.messageKey, message.messageParams);
}

export function localizeToolStep(locale: Locale, step: AgentToolStepRecord): AgentToolStepRecord {
  const label = locale === "zh-CN" ? zhToolLabels[step.kind] : enToolLabels[step.kind];
  return { ...step, label, summary: locale === "zh-CN" ? `已完成：${label}` : `Completed: ${label}` };
}
