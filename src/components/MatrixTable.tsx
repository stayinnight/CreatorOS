import { calculateRow } from "../domain/matrix";
import type { MatrixRow } from "../domain/model";

const money = (value: number) => `$${Math.round(value / 1000)}K`;
const compact = (value: number) => `${(value / 1_000_000).toFixed(value >= 1_000_000 ? 2 : 3)}M`;

export function MatrixTable({ rows, selectedId, onSelect }: { rows: MatrixRow[]; selectedId: string | null; onSelect: (row: MatrixRow) => void }) {
  return (
    <div className="table-wrap">
      <table className="matrix-table">
        <thead><tr><th>Plan cell</th><th>Format</th><th>Creators</th><th>Fee / rights</th><th>Median views</th><th>Total</th><th>Expected</th><th>CPM</th></tr></thead>
        <tbody>
          {rows.map((row) => {
            const value = calculateRow(row);
            return (
              <tr key={row.id} className={selectedId === row.id ? "selected" : ""} onClick={() => onSelect(row)}>
                <td><strong>{row.market} · {row.ridingScenario}</strong><small>{row.platform} · {row.creatorTier}</small></td>
                <td>{row.contentFormat}</td>
                <td><strong>{row.plannedCreators}</strong><small>× {row.postsPerCreator} post</small></td>
                <td><strong>{money(row.creatorFee)}</strong><small>+ {money(row.rightsCost)} rights</small></td>
                <td>{compact(row.medianRelevantViews)}</td>
                <td>{money(value.cost)}</td>
                <td>{compact(value.expectedViews)}</td>
                <td>{value.cpm === null ? "N/A" : `$${value.cpm.toFixed(0)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
