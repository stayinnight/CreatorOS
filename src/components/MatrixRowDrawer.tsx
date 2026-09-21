import { useEffect, useState } from "react";
import type { MatrixRow } from "../domain/model";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatDomainValue } from "../i18n/formatters";

const numericFields = [
  ["plannedCreators", "Creators"], ["postsPerCreator", "Posts / creator"], ["medianRelevantViews", "Median relevant views"],
  ["creatorFee", "Creator fee"], ["rightsCost", "Rights cost"], ["otherCost", "Other cost"], ["searchMultiplier", "Search multiplier"],
] as const;

export function MatrixRowDrawer({ row, locked, onSave, onClose }: { row: MatrixRow | null; locked: boolean; onSave: (row: MatrixRow) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<MatrixRow | null>(row);
  const { locale } = useLanguage();
  useEffect(() => setDraft(row), [row]);
  if (!draft) return null;
  return (
    <aside className="drawer" aria-label={locale === "zh-CN" ? "编辑 Matrix 行" : "Edit Matrix row"}>
      <div className="drawer-head"><div><span className="micro-label">MATRIX CELL</span><h3>{draft.market} · {formatDomainValue(locale, draft.ridingScenario)}</h3></div><button onClick={onClose} aria-label={locale === "zh-CN" ? "关闭" : "Close"}>×</button></div>
      <p className="drawer-context">{draft.platform} · {formatDomainValue(locale, draft.creatorTier)} · {formatDomainValue(locale, draft.contentFormat)}</p>
      <div className="drawer-form">
        {numericFields.map(([field, label]) => (
          <label key={field}><span>{locale === "zh-CN" ? ({ plannedCreators: "创作者数量", postsPerCreator: "每位创作者内容数", medianRelevantViews: "相关播放中位数", creatorFee: "创作者费用", rightsCost: "授权费用", otherCost: "其他费用", searchMultiplier: "搜索倍率" } as const)[field] : label}</span><input type="number" min="0" value={draft[field]} disabled={locked} onChange={(event) => setDraft({ ...draft, [field]: Number(event.target.value) })} /></label>
        ))}
      </div>
      <label className="notes-field"><span>{locale === "zh-CN" ? "假设备注" : "Assumption note"}</span><textarea value={draft.note} disabled={locked} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
      <button className="primary-button" disabled={locked} onClick={() => { onSave(draft); onClose(); }}>{locked ? (locale === "zh-CN" ? "已锁定快照" : "Locked snapshot") : (locale === "zh-CN" ? "保存单元格" : "Save cell")}</button>
    </aside>
  );
}
