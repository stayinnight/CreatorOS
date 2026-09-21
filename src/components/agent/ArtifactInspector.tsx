import { useEffect, useRef, useState } from "react";
import type { CampaignArtifact } from "../../agent/model";
import { useCampaign } from "../../app/CampaignProvider";
import { ConstraintPanel } from "../ConstraintPanel";
import { MatrixRowDrawer } from "../MatrixRowDrawer";
import { MatrixTable } from "../MatrixTable";
import { MetricCard } from "../MetricCard";
import { evaluateMatrix, summarizeMatrix } from "../../domain/matrix";
import type { MatrixRow } from "../../domain/model";
import { CandidateBatchDetail } from "./CandidateBatchDetail";
import { ReviewRoundDetail } from "./ReviewRoundDetail";
import { GapArtifactDetail } from "./GapArtifactDetail";
import { useNavigate } from "react-router-dom";
import { getRecommendedNextAction } from "../../agent/recommendedAction";
import { executeRecommendedAction } from "../../agent/executeRecommendedAction";
import { RecommendedNextStep } from "./RecommendedNextStep";
import type { ArtifactTransitionPhase } from "./useArtifactTransition";
import type { CampaignAction } from "../../app/campaignReducer";
import { useLanguage } from "../../i18n/LanguageProvider";
import { formatDomainValue, formatStatus } from "../../i18n/formatters";
import { localizeSystemText } from "../../i18n/agentCopy";

const money = (value: number) => `$${Math.round(value / 1000)}K`;

export function ArtifactInspector({ artifact, phase, revealKey, onClose, onOpenArtifact, onAskAgent, onPerformAction }: { artifact: CampaignArtifact; phase: ArtifactTransitionPhase; revealKey: number; onClose: () => void; onOpenArtifact: (artifactId: string) => void; onAskAgent?: (prompt: string, context?: { candidateId?: string }) => void; onPerformAction?: (action: CampaignAction) => boolean }) {
  const { state, dispatch } = useCampaign();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const inspectorRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const next = getRecommendedNextAction(state);
  const showNext = next?.command.kind !== "open" || next.command.artifactId !== artifact.id;
  useEffect(() => { if (phase === "ready") headingRef.current?.focus({ preventScroll: true }); }, [artifact.id, phase]);
  useEffect(() => {
    if (!revealKey) return;
    const inspector = inspectorRef.current;
    if (!inspector) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    inspector.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
    if (!reduced) inspector.animate?.([
      { boxShadow: "-10px 0 32px rgba(10, 10, 10, .06)" },
      { boxShadow: "-16px 0 44px rgba(10, 10, 10, .20)" },
      { boxShadow: "-10px 0 32px rgba(10, 10, 10, .06)" },
    ], { duration: 420, easing: "ease-out" });
  }, [revealKey]);
  const execute = () => next && executeRecommendedAction(next, { dispatch: onPerformAction ?? dispatch, navigate, openArtifact: onOpenArtifact });
  return <aside ref={inspectorRef} className={`artifact-inspector is-${phase}`} aria-label={`${formatDomainValue(locale, artifact.kind)} ${locale === "zh-CN" ? "检查器" : "inspector"}`}><header className="inspector-head"><div><span>{formatDomainValue(locale, artifact.kind).toUpperCase()} · {locale === "zh-CN" ? "版本" : "VERSION"} {artifact.version}</span><h2 ref={headingRef} tabIndex={-1}>{localizeSystemText(locale, artifact.summary)}</h2></div><button type="button" aria-label={locale === "zh-CN" ? "关闭产物" : "Close artifact"} onClick={onClose}>×</button></header>{next && showNext && <RecommendedNextStep action={next} onExecute={execute} />}<div className="inspector-content" key={artifact.id}>{artifact.kind === "Brief" ? <BriefArtifactDetail /> : artifact.kind === "Mix" ? <MixArtifactDetail scenarioId={artifact.domainRef} /> : artifact.kind === "SearchPackageSet" ? <SearchPackageSetDetail artifact={artifact} /> : artifact.kind === "CandidateBatch" ? <CandidateBatchDetail artifact={artifact} onAskAgent={onAskAgent} onPerformAction={onPerformAction} /> : artifact.kind === "ReviewRound" ? <ReviewRoundDetail /> : artifact.kind === "GapAssessment" ? <GapArtifactDetail /> : <div className="inspector-placeholder"><strong>{formatDomainValue(locale, artifact.kind)} {locale === "zh-CN" ? "详情" : "detail"}</strong></div>}</div></aside>;
}

function BriefArtifactDetail() {
  const { state } = useCampaign();
  const { locale } = useLanguage();
  return <div className="inspector-body"><div className="inspector-kpis"><MetricCard label={locale === "zh-CN" ? "市场" : "MARKETS"} value="US + UK" target={locale === "zh-CN" ? "固定范围" : "fixed scope"} /><MetricCard label={locale === "zh-CN" ? "预算" : "BUDGET"} value="$180K" target={locale === "zh-CN" ? "包含授权" : "including rights"} /><MetricCard label={locale === "zh-CN" ? "目标" : "TARGET"} value="2.60M" target={locale === "zh-CN" ? "有效播放" : "effective views"} /></div><section className="inspector-section"><span className="micro-label">{locale === "zh-CN" ? "来源链路" : "SOURCE LINEAGE"}</span><h3>{locale === "zh-CN" ? "三份客户输入" : "Three client inputs"}</h3>{state.brief.sources.map((source) => <article className="source-row" key={source.id}><span className="source-icon blue">{source.type.slice(0, 1)}</span><div><strong>{source.title}</strong><p>{source.excerpt}</p></div></article>)}</section><section className="inspector-section"><span className="micro-label">{locale === "zh-CN" ? "已解决的决策" : "RESOLVED DECISIONS"}</span>{state.brief.conflicts.map((conflict) => <div className="resolved-line" key={conflict.id}><strong>{conflict.label}</strong><span>{conflict.resolution}</span></div>)}</section></div>;
}

function MixArtifactDetail({ scenarioId }: { scenarioId: string }) {
  const { state, dispatch } = useCampaign();
  const { locale } = useLanguage();
  const [selectedRow, setSelectedRow] = useState<MatrixRow | null>(null);
  const scenario = state.matrixScenarios.find((item) => item.id === state.activeScenarioId) ?? state.matrixScenarios.find((item) => item.id === scenarioId) ?? state.matrixScenarios[0];
  const summary = summarizeMatrix(scenario.rows);
  const constraints = evaluateMatrix(scenario.rows, state.brief);
  const locked = scenario.status === "Locked";
  return <div className="inspector-body mix-inspector"><div className="scenario-tabs compact-tabs">{state.matrixScenarios.map((item) => <button type="button" key={item.id} className={item.id === scenario.id ? "active" : ""} onClick={() => dispatch({ type: "SELECT_SCENARIO", scenarioId: item.id })}>{item.name}</button>)}</div><div className="inspector-kpis"><MetricCard label={locale === "zh-CN" ? "总成本" : "TOTAL COST"} value={money(summary.totalCost)} target={locale === "zh-CN" ? "上限 · $180K" : "cap · $180K"} tone={summary.totalCost <= state.brief.budgetCap ? "pass" : "fail"} /><MetricCard label={locale === "zh-CN" ? "有效播放" : "EFFECTIVE VIEWS"} value={`${(summary.totalExpectedViews / 1_000_000).toFixed(2)}M`} target={locale === "zh-CN" ? "目标 · 2.60M" : "goal · 2.60M"} tone={summary.totalExpectedViews >= state.brief.viewsTarget ? "pass" : "fail"} /><MetricCard label={locale === "zh-CN" ? "长视频" : "LONG-FORM"} value={`${summary.longFormCreators}`} target={locale === "zh-CN" ? "至少 · 3" : "minimum · 3"} tone={summary.longFormCreators >= 3 ? "pass" : "fail"} /></div><div className="inspector-matrix" id="matrix-review"><div className="panel"><div className="panel-head"><div><span className="micro-label">MIX MATRIX</span><h3>{scenario.name}</h3></div><span>{formatStatus(locale, scenario.status)}</span></div><MatrixTable rows={scenario.rows} selectedId={selectedRow?.id ?? null} onSelect={setSelectedRow} />{!locked && <div className="planner-actions"><button className="ghost-button" type="button" onClick={() => dispatch({ type: "SIMULATE_LONG_FORM_GAP", scenarioId: scenario.id })}>{locale === "zh-CN" ? "测试失败" : "Test failure"}</button><button className="ghost-button" type="button" onClick={() => dispatch({ type: "RESTORE_SCENARIO", scenarioId: scenario.id })}>{locale === "zh-CN" ? "恢复" : "Restore"}</button></div>}</div><ConstraintPanel constraints={constraints} /></div><MatrixRowDrawer row={selectedRow} locked={locked} onClose={() => setSelectedRow(null)} onSave={(row) => dispatch({ type: "UPDATE_MATRIX_ROW", scenarioId: scenario.id, row })} /></div>;
}

function SearchPackageSetDetail({ artifact }: { artifact: CampaignArtifact }) {
  const { state } = useCampaign();
  const { locale } = useLanguage();
  const recoveryPackage = state.searchPackages.find((item) => item.id === artifact.domainRef && item.parentPackageId);
  const packages = recoveryPackage ? [recoveryPackage] : state.searchPackages;
  return <div className="inspector-body"><section className="inspector-section"><span className="micro-label">{recoveryPackage ? (locale === "zh-CN" ? "局部恢复结果" : "LOCAL RECOVERY RESULT") : (locale === "zh-CN" ? "有边界的搜索" : "BOUNDED SEARCH")}</span><h3>{recoveryPackage ? (locale === "zh-CN" ? "补量任务包已就绪，上游方案保持不变" : "Replenishment is ready; upstream plans remain unchanged") : (locale === "zh-CN" ? `${packages.length} 个任务包继承 Matrix 约束` : `${packages.length} packages inherit Matrix constraints`)}</h3><div className="compact-package-grid">{packages.map((item) => <article key={item.id}><span>{item.market} · {item.platform}</span><strong>{formatDomainValue(locale, item.ridingScenario)} / {formatDomainValue(locale, item.contentFormat)}</strong><small>{item.candidateTargetCount} {locale === "zh-CN" ? "位候选人 · 上限" : "candidates · ceiling"} ${item.budgetCeilingPerCreator.toLocaleString(locale)}</small></article>)}</div></section><div className="inspector-approval"><div><strong>{recoveryPackage ? (locale === "zh-CN" ? "闭环已完成" : "Workflow complete") : (locale === "zh-CN" ? "扩量前先校准" : "Calibrate before scaling")}</strong><p>{recoveryPackage ? (locale === "zh-CN" ? `只补充了 ${recoveryPackage.market} ${formatDomainValue(locale, recoveryPackage.ridingScenario)} 单元格；Brief、锁定的 Matrix 和其他搜索包均未改动。` : `Only the ${recoveryPackage.market} ${formatDomainValue(locale, recoveryPackage.ridingScenario)} cell was replenished; the Brief, locked Matrix, and other packages were preserved.`) : (locale === "zh-CN" ? "运行 10 个样例：8 个合格方向和 2 个可见失败案例。使用上方建议动作继续。" : "Run a 10-case sample: 8 qualified directions and 2 visible failure cases. Use the recommended action above to continue.")}</p></div></div></div>;
}
