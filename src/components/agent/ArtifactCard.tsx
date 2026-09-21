import type { CampaignArtifact } from "../../agent/model";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue, formatStatus } from "../../i18n/formatters";
import { localizeSystemText } from "../../i18n/agentCopy";

export function ArtifactCard({ artifact, onOpen }: { artifact: CampaignArtifact; onOpen: () => void }) {
  const { locale } = useLanguage();
  return <article className="agent-card artifact-card"><div className="artifact-glyph">{artifact.kind.slice(0, 1)}</div><div><span>{formatDomainValue(locale, artifact.kind).toUpperCase()} · V{artifact.version}</span><strong>{localizeSystemText(locale, artifact.summary)}</strong><small>{formatStatus(locale, artifact.status)} · {locale === "zh-CN" ? "已保留来源链路" : "source lineage retained"}</small></div><button type="button" onClick={onOpen}>{locale === "zh-CN" ? "查看" : "Inspect"} →</button></article>;
}
