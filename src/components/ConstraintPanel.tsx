import type { ConstraintResult } from "../domain/matrix";
import { useLanguage } from "../i18n/LanguageProvider";

export function ConstraintPanel({ constraints }: { constraints: ConstraintResult[] }) {
  const failures = constraints.filter((item) => item.status === "fail").length;
  const { locale } = useLanguage();
  return (
    <aside className="constraint-panel">
      <div className="constraint-title"><div><span className="micro-label">{locale === "zh-CN" ? "锁定门禁" : "LOCK GATE"}</span><h3>{failures ? (locale === "zh-CN" ? `${failures} 项约束未通过` : `${failures} constraints failing`) : (locale === "zh-CN" ? "可以锁定" : "Ready to lock")}</h3></div><span className={`gate-dot ${failures ? "fail" : "pass"}`} /></div>
      <div className="constraint-list">
        {constraints.map((item) => (
          <div key={item.id} className="constraint-row">
            <span className={`constraint-icon ${item.status}`}>{item.status === "pass" ? "✓" : "!"}</span>
            <div><strong>{item.label}</strong><small>{item.current} · {locale === "zh-CN" ? "目标" : "target"} {item.target}</small></div>
          </div>
        ))}
      </div>
      <div className="assumption-note"><span>{locale === "zh-CN" ? "为什么重要" : "WHY THIS MATTERS"}</span><p>{locale === "zh-CN" ? "硬性约束彼此独立。低 CPM 不能掩盖触达不足或缺少长视频证据。" : "Hard constraints stay independent. A low CPM cannot hide weak reach or missing long-form proof."}</p></div>
    </aside>
  );
}
