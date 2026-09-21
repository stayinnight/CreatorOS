import { calculateRow } from "../domain/matrix";
import type { MatrixRow } from "../domain/model";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatDomainValue } from "../i18n/formatters";

const money = (value: number) => `$${Math.round(value / 1000)}K`;
const compact = (value: number) => `${(value / 1_000_000).toFixed(value >= 1_000_000 ? 2 : 3)}M`;

export function MatrixTable({ rows, selectedId, onSelect }: { rows: MatrixRow[]; selectedId: string | null; onSelect: (row: MatrixRow) => void }) {
  const { locale } = useLanguage();
  const h = locale === "zh-CN" ? ["规划单元格", "内容形式", "创作者", "费用 / 授权", "播放中位数", "总成本", "预计播放", "CPM"] : ["Plan cell", "Format", "Creators", "Fee / rights", "Median views", "Total", "Expected", "CPM"];
  return (
    <div className="table-wrap">
      <table className="matrix-table">
        <thead><tr>{h.map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => {
            const value = calculateRow(row);
            return (
              <tr key={row.id} className={selectedId === row.id ? "selected" : ""} onClick={() => onSelect(row)}>
                <td><strong>{row.market} · {formatDomainValue(locale, row.ridingScenario)}</strong><small>{row.platform} · {formatDomainValue(locale, row.creatorTier)}</small></td>
                <td>{formatDomainValue(locale, row.contentFormat)}</td>
                <td><strong>{row.plannedCreators}</strong><small>× {row.postsPerCreator} {locale === "zh-CN" ? "条内容" : "post"}</small></td>
                <td><strong>{money(row.creatorFee)}</strong><small>+ {money(row.rightsCost)} {locale === "zh-CN" ? "授权" : "rights"}</small></td>
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
