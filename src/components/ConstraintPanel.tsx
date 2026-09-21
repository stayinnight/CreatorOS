import type { ConstraintResult } from "../domain/matrix";

export function ConstraintPanel({ constraints }: { constraints: ConstraintResult[] }) {
  const failures = constraints.filter((item) => item.status === "fail").length;
  return (
    <aside className="constraint-panel">
      <div className="constraint-title"><div><span className="micro-label">LOCK GATE</span><h3>{failures ? `${failures} constraints failing` : "Ready to lock"}</h3></div><span className={`gate-dot ${failures ? "fail" : "pass"}`} /></div>
      <div className="constraint-list">
        {constraints.map((item) => (
          <div key={item.id} className="constraint-row">
            <span className={`constraint-icon ${item.status}`}>{item.status === "pass" ? "✓" : "!"}</span>
            <div><strong>{item.label}</strong><small>{item.current} · target {item.target}</small></div>
          </div>
        ))}
      </div>
      <div className="assumption-note"><span>WHY THIS MATTERS</span><p>Hard constraints stay independent. A low CPM cannot hide weak reach or missing long-form proof.</p></div>
    </aside>
  );
}
