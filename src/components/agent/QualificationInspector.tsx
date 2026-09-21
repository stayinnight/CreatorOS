import type { CampaignCandidate, QualificationResult, SearchPackage } from "../../domain/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue, formatStatus } from "../../i18n/formatters";

const enGateLabels = { market: "Target market", "platform-format": "Platform and format", "real-cycling": "Real bicycle riding", scenario: "Target riding scenario", "head-camera-proof": "Head-mounted camera fit", commercial: "Rights, timing, and budget" } as const;

export function QualificationInspector({ candidate, searchPackage, result, onAsk }: { candidate: CampaignCandidate; searchPackage: SearchPackage; result: QualificationResult; onAsk: (prompt: string, candidateId: string) => void }) {
  const prompts = ["为什么推荐他？", "哪条证据证明适合头戴摄像头？", "他有什么风险？", "找同一 Matrix Cell、但更生活化的候选"];
  const promptLabels = ["Why recommend this creator?", "Which evidence proves head-camera fit?", "What are the risks?", "Find a more lifestyle-led fit in this Matrix cell"];
  const { locale } = useLanguage();
  return <div className="qualification-workspace">
    <div className="qualification-column">
      <section className="qualification-card qualification-verdict" aria-label={locale === "zh-CN" ? "Agent 结论" : "Agent verdict"}>
        <span>{locale === "zh-CN" ? "AGENT 结论" : "AGENT VERDICT"}</span><div className={`qualification-status ${result.status.toLowerCase().replace(" ", "-")}`}>{formatStatus(locale, result.status)}</div>
        <h3>{candidate.creatorName}</h3><p>{formatStatus(locale, result.confidence)} {locale === "zh-CN" ? "置信度" : "confidence"} · {searchPackage.matrixCellId}</p>
        {result.risks.map((risk) => <div className="qualification-risk" key={risk}>! {risk}</div>)}
      </section>
      <section className="qualification-card qualification-gates" aria-label="Qualification gates">
        <header><span>{locale === "zh-CN" ? "硬规则检查" : "HARD-RULE CHECKS"}</span><strong>6 {locale === "zh-CN" ? "项门禁" : "gates"}</strong></header>
        {result.gates.map((gate) => <div className={`qualification-gate is-${gate.status.toLowerCase()}`} key={gate.id}><i>{gate.status === "Pass" ? "✓" : gate.status === "Fail" ? "×" : "!"}</i><div><strong>{locale === "zh-CN" ? gate.label : enGateLabels[gate.id]}</strong><small>{locale === "zh-CN" ? gate.summary : `${formatStatus(locale, gate.status)} · ${gate.evidenceIds.length} evidence record${gate.evidenceIds.length === 1 ? "" : "s"}`}</small></div><em>{formatStatus(locale, gate.status)}</em></div>)}
      </section>
      {result.score && <section className="qualification-card fit-score-card"><header><span>FIT / 100</span><strong>{result.score.total.toFixed(0)}</strong></header><div className="fit-breakdown">{Object.entries(result.score.breakdown).map(([key, value]) => <div key={key}><span>{key}</span><b>{value.toFixed(1)}</b></div>)}</div></section>}
    </div>
    <div className="qualification-column">
      <section className="qualification-card qualification-evidence" aria-label={locale === "zh-CN" ? "证据" : "Evidence"}><header><span>{locale === "zh-CN" ? "证据" : "EVIDENCE"}</span><strong>{candidate.evidence.length} {locale === "zh-CN" ? "条记录" : "records"}</strong></header>{candidate.evidence.length ? candidate.evidence.map((evidence) => <article key={evidence.id}><div><strong>{formatDomainValue(locale, evidence.ridingScenario)} · {formatDomainValue(locale, evidence.contentFormat)}</strong><small>{formatDomainValue(locale, evidence.sourceType)} · {evidence.views.toLocaleString(locale)} {locale === "zh-CN" ? "次播放" : "views"} · {evidence.stale ? (locale === "zh-CN" ? "已过期" : "Stale") : (locale === "zh-CN" ? "当前" : "Current")}</small></div><div className="evidence-proofs">{evidence.proofPoints.map((point) => <span key={point}>{formatDomainValue(locale, point)}</span>)}</div></article>) : <p className="empty-evidence">{locale === "zh-CN" ? "没有可核验内容，因此不能通过资格门禁。" : "No verifiable content is available, so qualification cannot pass."}</p>}</section>
      <section className="qualification-card qualification-agent-prompts" aria-label={locale === "zh-CN" ? "询问 Agent" : "Ask Agent"}><header><span>{locale === "zh-CN" ? "询问 AGENT" : "ASK AGENT"}</span><strong>{locale === "zh-CN" ? "基于当前规则与证据" : "Based on current rules and evidence"}</strong></header>{prompts.map((prompt, index) => <button key={prompt} type="button" onClick={() => onAsk(prompt, candidate.id)}>{locale === "zh-CN" ? prompt : promptLabels[index]}<span>→</span></button>)}</section>
    </div>
  </div>;
}
