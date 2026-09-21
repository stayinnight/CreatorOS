import type { Locale } from "./messages";

const english: Record<string, string> = {
  WaitingForApproval: "Waiting for approval", WaitingForDecision: "Waiting for decision", NeedsFollowUp: "Needs follow-up",
};

const chinese: Record<string, string> = {
  Ready: "就绪", Draft: "草稿", Published: "已发布", Locked: "已锁定", Stale: "已过期", Planned: "已规划", Running: "运行中",
  WaitingForDecision: "等待决策", WaitingForApproval: "等待批准", Failed: "失败", Completed: "已完成", Pending: "待处理", Waiting: "等待中",
  Succeeded: "成功", Skipped: "已跳过", Approved: "已批准", Submitted: "已提交", Qualified: "合格", "Needs Review": "需要复核",
  Disqualified: "不合格", Pass: "跳过", Select: "选择", Maybe: "待定", Unreviewed: "未审核", Primary: "主选", Backup: "备选",
  Unassigned: "未分配", Accepted: "接受", Rejected: "拒绝", NeedsFollowUp: "需要跟进", Review: "复核", Fail: "失败", High: "高", Medium: "中", Low: "低",
};

const domainChinese: Record<string, string> = {
  Road: "公路骑行", MTB: "山地骑行", Urban: "城市骑行", Motorcycle: "摩托骑行", Skiing: "滑雪",
  Macro: "头部", Mid: "腰部", Micro: "长尾", "Long Review": "长视频评测", "Short Video": "短视频", Reel: "Reel",
  "Real Cycling": "真实骑行", "First-person POV": "第一视角", Stabilization: "防抖", Daylight: "日间", "Low Light": "弱光",
  "Safety Recording": "安全记录", "Hands-free Mounting": "免手持安装", "Long-form Explanation": "深度讲解",
  "Organic Repost": "自然转载", "Paid Ads": "付费广告", Whitelisting: "白名单投放", Global: "全球",
  Internal: "内部", Public: "公开", Manual: "人工", Brief: "需求简报", Mix: "创作者组合", SearchPackageSet: "搜索任务包",
  CandidateBatch: "候选人批次", ReviewRound: "客户评审轮次", GapAssessment: "缺口评估",
};

export function formatStatus(locale: Locale, value: string) {
  if (locale === "zh-CN") return chinese[value] ?? value;
  return english[value] ?? value;
}

export function formatDomainValue(locale: Locale, value: string) {
  return locale === "zh-CN" ? domainChinese[value] ?? value : value;
}
