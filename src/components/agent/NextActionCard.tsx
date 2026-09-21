import type { AgentMessage } from "../../agent/model";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageProvider";

const zhLabels: Record<string, string> = { "resolve-brief": "查看决策", "build-mix": "生成组合方案", "review-matrix": "检查约束", "lock-matrix": "锁定 Matrix", "generate-packages": "生成搜索任务包", "start-calibration": "开始校准", "review-calibration": "批准并扩展", "validate-slate": "校验名单", "preview-client": "预览客户视图", "recover-gap": "修复缺口", "view-result": "查看结果" };

export function NextActionCard({ message, lifecycle, onAction, actionLabel, previewHref, busy = false }: { message: AgentMessage; lifecycle: "Current" | "Completed" | "Superseded"; onAction?: () => void; actionLabel?: string; previewHref?: string; busy?: boolean }) {
  const interactive = lifecycle === "Current";
  const { locale } = useLanguage();
  const recommendedId = message.payloadRef?.startsWith("recommended:") ? message.payloadRef.slice("recommended:".length) : "";
  const label = locale === "zh-CN" ? zhLabels[recommendedId] ?? actionLabel : actionLabel;
  return <article className={`agent-card next-action-card ${interactive ? "is-current" : "is-retired"}`}>
    <span>{interactive ? (locale === "zh-CN" ? "建议下一步" : "NEXT BEST ACTION") : lifecycle}</span>
    <strong>{message.text}</strong>
    {interactive && <div className="next-action-buttons">
      {previewHref && <Link to={previewHref}>{locale === "zh-CN" ? "客户预览" : "Client preview"}</Link>}
      {onAction && <button type="button" onClick={onAction} disabled={busy} aria-busy={busy}>{busy && <i className="working-mark" />} {busy ? (locale === "zh-CN" ? "正在打开对比…" : "Opening comparison…") : label ?? (locale === "zh-CN" ? "继续" : "Continue")} {!busy && <span>→</span>}</button>}
    </div>}
  </article>;
}
