import type { BriefSource } from "../../domain/model";
import type { DecisionRequest } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatStatus } from "../../i18n/formatters";

const zhDecision: Record<string, { question: string; recommendation: string; rationale: string; options: Record<string, [string, string]> }> = {
  "decision-launch": { question: "本项目应采用哪个上线周期？", recommendation: "采用 8 周", rationale: "预算表是最明确的排期来源，并保留完整的寻源与内容评审窗口。", options: { "launch-8": ["采用 8 周", "保留完整的寻源与内容评审窗口。"], "launch-6": ["采用 6 周", "压缩寻源时间并引入排期风险。"] } },
  "decision-sports": { question: "摩托和滑雪创作者是否进入当前计划？", recommendation: "暂缓并排除", rationale: "本次核心背景是头戴骑行摄像头，真实骑行证据优先。", options: { "sports-exclude": ["暂缓并排除", "保护真实骑行证据要求。"], "sports-include": ["纳入相邻运动", "扩大触达，但会削弱骑行专项证明。"] } },
};

export function DecisionCard({ decision, sources, onResolve }: { decision: DecisionRequest; sources: BriefSource[]; onResolve: (value: string) => void }) {
  const { locale } = useLanguage();
  const copy = locale === "zh-CN" ? zhDecision[decision.id] : undefined;
  return <article className={`agent-card decision-card ${decision.status.toLowerCase()}`}><header><div><span>{locale === "zh-CN" ? "需要决策" : "DECISION REQUIRED"}</span><strong>{copy?.question ?? decision.question}</strong></div><em>{formatStatus(locale, decision.status)}</em></header><div className="decision-evidence"><span>{locale === "zh-CN" ? "证据" : "EVIDENCE"}</span>{sources.map((source) => <div key={source.id}><strong>{source.type} · {source.title}</strong><p>{source.excerpt}</p></div>)}</div><div className="agent-recommendation"><span>{locale === "zh-CN" ? "AGENT 建议" : "AGENT RECOMMENDS"}</span><strong>{copy?.recommendation ?? decision.recommendation}</strong><p>{copy?.rationale ?? decision.rationale}</p></div><div className="decision-options">{decision.options.map((option) => { const localized = copy?.options[option.id]; return <button key={option.id} type="button" disabled={decision.status === "Resolved"} className={decision.resolution === option.value ? "selected" : ""} onClick={() => onResolve(option.value)}><strong>{localized?.[0] ?? option.label}</strong><small>{localized?.[1] ?? option.impact}</small></button>; })}</div></article>;
}
