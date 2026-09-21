import type { RecommendedAction } from "../../agent/recommendedAction";
import { useLanguage } from "../../i18n/LanguageProvider";

const zh: Record<string, [string, string, string, string, string]> = {
  "resolve-brief": ["Brief 决策", "处理待定的 Brief 决策", "仍有一个高影响冲突需要你选择。", "全部决策解决后发布带来源链路的 Brief。", "查看决策"],
  "build-mix": ["Brief 已就绪", "生成两套创作者组合", "Brief 已发布，可以进入规划。", "生成两套满足约束的 Matrix 方案。", "生成组合方案"],
  "review-matrix": ["Matrix 被阻塞", "检查失败的 Matrix 单元格", "有约束检查未通过。", "在分配成为寻源合约前修正它。", "检查约束"],
  "lock-matrix": ["组合已就绪", "锁定所选 Matrix", "所有硬性约束均已通过。", "创建 Mix v1 并冻结寻源分配。", "锁定 Matrix"],
  "generate-packages": ["Matrix 已锁定", "生成有边界的搜索任务包", "批准的组合现在是寻源合约。", "创建六个任务包并解锁校准。", "生成搜索任务包"],
  "start-calibration": ["任务包已就绪", "开始 10 人校准", "有边界的搜索已可进行质量抽样。", "生成八个合格样例和两个明确失败样例。", "开始校准"],
  "review-calibration": ["校准等待中", "批准校准方向", "审核下方十个样例，再批准质量模式。", "在生成 30 + 10 名单前应用你的反馈。", "批准并扩展"],
  "validate-slate": ["方向已批准", "校验 30 + 10 名单", "校准已批准。", "检查投影安全，并保护十位内部备选。", "校验名单"],
  "preview-client": ["名单已就绪", "预览客户视图", "名单已通过投影安全检查。", "发布前检查客户安全视图。", "预览客户视图"],
  "recover-gap": ["发现局部缺口", "修复受影响的 Matrix 单元格", "客户反馈造成了有边界的覆盖缺口。", "补位备选或仅补充受影响的任务包。", "修复缺口"],
  "view-result": ["Run 已完成", "查看最新结果", "项目工作流已完成。", "打开最新保留的产物。", "查看结果"],
};

export function RecommendedNextStep({ action, onExecute, busy = false }: { action: RecommendedAction; onExecute: () => void; busy?: boolean }) {
  const { locale } = useLanguage();
  const localized = locale === "zh-CN" ? zh[action.id] : undefined;
  const [stage, title, reason, outcome, label] = localized ?? [action.stage, action.title, action.reason, action.outcome, action.label];
  return <section className="recommended-next-step" aria-live="polite">
    <div className="recommended-next-copy">
      <span>{locale === "zh-CN" ? "建议下一步" : "Recommended next step"} · {stage}</span>
      <h3>{title}</h3>
      <p>{reason}</p>
      <small>{outcome}</small>
    </div>
    <button type="button" onClick={onExecute} disabled={busy} aria-busy={busy}>
      {busy && <i className="working-mark" />}
      {busy ? (locale === "zh-CN" ? "处理中…" : "Working…") : label} {!busy && <span>→</span>}
    </button>
  </section>;
}
