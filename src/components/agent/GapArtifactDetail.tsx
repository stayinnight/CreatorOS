import { useCampaign } from "../../app/CampaignProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue } from "../../i18n/formatters";

export function GapArtifactDetail() {
  const { state } = useCampaign();
  const { locale } = useLanguage();
  const gap = state.gapAssessment;
  if (!gap) return <div className="inspector-placeholder">{locale === "zh-CN" ? "暂无缺口评估。" : "No gap assessment is available."}</div>;
  const backup = state.candidates.find((candidate) => candidate.id === gap.backupCandidateId);
  return <div className="inspector-body"><div className="batch-summary"><div><span>{locale === "zh-CN" ? "受影响单元格" : "AFFECTED CELLS"}</span><strong>{gap.missingCells.length}</strong></div><div><span>{locale === "zh-CN" ? "缺少播放" : "MISSING VIEWS"}</span><strong>{gap.missingCells.reduce((sum, cell) => sum + cell.missingViews, 0).toLocaleString(locale)}</strong></div><div><span>{locale === "zh-CN" ? "剩余预算" : "BUDGET LEFT"}</span><strong>${Math.round(gap.remainingBudget / 1000)}K</strong></div></div><section className="gap-detail"><span className="micro-label">{locale === "zh-CN" ? "仅局部影响" : "LOCAL IMPACT ONLY"}</span>{gap.missingCells.map((cell) => <article key={cell.matrixCellId}><strong>{cell.market} · {formatDomainValue(locale, cell.ridingScenario)}</strong><span>{cell.missingCreators} {locale === "zh-CN" ? "位创作者缺失" : "creator missing"}</span><small>{cell.matrixCellId}</small></article>)}<div className="cause-tags"><span>{locale === "zh-CN" ? "客户 Pass" : "Client pass"}</span><span>{locale === "zh-CN" ? "覆盖低于锁定单元格" : "Coverage below locked cell"}</span><span>{locale === "zh-CN" ? "已保留上游产物" : "Upstream artifacts preserved"}</span></div></section><div className="inspector-approval"><div><strong>{locale === "zh-CN" ? "修复局部缺口" : gap.recommendedAction}</strong><p>{backup ? (locale === "zh-CN" ? `${backup.creatorName} 已满足受影响单元格的资格要求。使用上方建议动作补位。` : `${backup.creatorName} already qualifies for the affected cell. Use the recommended action above to promote them.`) : (locale === "zh-CN" ? "使用上方建议动作，仅补充受影响的搜索任务包。" : "Use the recommended action above to refill only the affected search package.")}</p></div></div></div>;
}
