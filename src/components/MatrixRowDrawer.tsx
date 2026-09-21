import { useEffect, useState } from "react";
import type { MatrixRow } from "../domain/model";

const numericFields = [
  ["plannedCreators", "Creators"], ["postsPerCreator", "Posts / creator"], ["medianRelevantViews", "Median relevant views"],
  ["creatorFee", "Creator fee"], ["rightsCost", "Rights cost"], ["otherCost", "Other cost"], ["searchMultiplier", "Search multiplier"],
] as const;

export function MatrixRowDrawer({ row, locked, onSave, onClose }: { row: MatrixRow | null; locked: boolean; onSave: (row: MatrixRow) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<MatrixRow | null>(row);
  useEffect(() => setDraft(row), [row]);
  if (!draft) return null;
  return (
    <aside className="drawer" aria-label="Edit Matrix row">
      <div className="drawer-head"><div><span className="micro-label">MATRIX CELL</span><h3>{draft.market} · {draft.ridingScenario}</h3></div><button onClick={onClose} aria-label="Close">×</button></div>
      <p className="drawer-context">{draft.platform} · {draft.creatorTier} · {draft.contentFormat}</p>
      <div className="drawer-form">
        {numericFields.map(([field, label]) => (
          <label key={field}><span>{label}</span><input type="number" min="0" value={draft[field]} disabled={locked} onChange={(event) => setDraft({ ...draft, [field]: Number(event.target.value) })} /></label>
        ))}
      </div>
      <label className="notes-field"><span>Assumption note</span><textarea value={draft.note} disabled={locked} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
      <button className="primary-button" disabled={locked} onClick={() => { onSave(draft); onClose(); }}>{locked ? "Locked snapshot" : "Save cell"}</button>
    </aside>
  );
}
