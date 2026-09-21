import { useCampaign } from "../../app/CampaignProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue, formatStatus } from "../../i18n/formatters";

export function ContextRail() {
  const { state, dispatch } = useCampaign();
  const { locale } = useLanguage();
  const c = locale === "zh-CN" ? { context: "项目上下文", title: "产物与决策", artifacts: "产物", open: "打开", empty: "暂无产物", emptyHelp: "Agent 工作后，Brief、Mix 和候选人批次会出现在这里。", decisions: "决策", parent: "个父产物" } : { context: "CAMPAIGN CONTEXT", title: "Artifacts & decisions", artifacts: "Artifacts", open: "Open", empty: "No artifacts yet", emptyHelp: "Brief, Mix and candidate batches will appear here as the Agent works.", decisions: "Decisions", parent: "parent" };
  const artifacts = [...state.agent.artifacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const decisions = [...state.agent.decisions].sort((a, b) => a.status.localeCompare(b.status));
  return <aside className="context-rail"><div className="context-title"><span className="micro-label">{c.context}</span><h2>{c.title}</h2></div><section className="context-section"><header><strong>{c.artifacts}</strong><span>{artifacts.length}</span></header>{artifacts.length ? artifacts.map((artifact) => <button className="context-artifact" type="button" key={artifact.id} onClick={() => dispatch({ type: "OPEN_ARTIFACT", artifactId: artifact.id })}><i>{artifact.kind.slice(0, 1)}</i><div><strong>{formatDomainValue(locale, artifact.kind)} v{artifact.version}</strong><small>{formatStatus(locale, artifact.status)} · {artifact.parentArtifactIds.length} {c.parent}{locale === "en" && artifact.parentArtifactIds.length !== 1 ? "s" : ""}</small></div><span>{c.open}</span></button>) : <div className="context-empty"><strong>{c.empty}</strong><p>{c.emptyHelp}</p></div>}</section><section className="context-section"><header><strong>{c.decisions}</strong><span>{decisions.length}</span></header>{decisions.map((decision) => <div className={`context-decision ${decision.status.toLowerCase()}`} key={decision.id}><span>{formatStatus(locale, decision.status)}</span><strong>{decision.question}</strong>{decision.resolution && <small>{decision.resolution}</small>}</div>)}</section></aside>;
}
