import { useCampaign } from "../app/CampaignProvider";
import type { BriefConflict, BriefVersion } from "../domain/model";

const sourceTone: Record<string, string> = { Email: "blue", Excel: "green", "Meeting Notes": "amber" };

function ConflictCard({ conflict, brief, onResolve }: { conflict: BriefConflict; brief: BriefVersion; onResolve: (conflictId: string, resolution: string) => void }) {
  return (
    <article className={`conflict-card ${conflict.status === "Resolved" ? "resolved" : ""}`}>
      <div className="conflict-heading">
        <div><span className="micro-label">DECISION REQUIRED</span><h3>{conflict.label}</h3></div>
        <span className={`status-pill ${conflict.status === "Resolved" ? "pass" : "warn"}`}>{conflict.status}</span>
      </div>
      <div className="option-stack">
        {conflict.options.map((option) => (
          <label key={option} className={conflict.resolution === option ? "selected" : ""}>
            <input
              type="radio"
              name={conflict.id}
              value={option}
              checked={conflict.resolution === option}
              disabled={brief.status === "Published"}
              onChange={() => onResolve(conflict.id, option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <p className="source-footnote">Sources: {conflict.sourceIds.join(" · ")}</p>
    </article>
  );
}

export function BriefPage() {
  const { state, dispatch } = useCampaign();
  const brief = state.brief;
  const unresolved = brief.conflicts.filter((item) => item.status === "Unresolved").length;

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div><p className="eyebrow">01 · SOURCE OF TRUTH</p><h2>Resolve ambiguity before spend.</h2></div>
        <p>Three source documents agree on the product outcome, but not the launch window or adjacent-sport scope.</p>
      </section>

      <section className="brief-grid">
        <div className="brief-main">
          <div className="section-heading"><div><span className="micro-label">SOURCE EVIDENCE</span><h3>What the client actually said</h3></div><span>3 artifacts</span></div>
          <div className="source-list">
            {brief.sources.map((source) => (
              <article className="source-row" key={source.id}>
                <span className={`source-icon ${sourceTone[source.type]}`}>{source.type.slice(0, 1)}</span>
                <div><strong>{source.title}</strong><p>{source.excerpt}</p></div>
                <span className="source-type">{source.type}</span>
              </article>
            ))}
          </div>

          <div className="section-heading spacing-top"><div><span className="micro-label">CONFLICT REGISTER</span><h3>Two decisions gate the plan</h3></div><span>{unresolved} open</span></div>
          <div className="conflict-grid">
            {brief.conflicts.map((conflict) => <ConflictCard key={conflict.id} conflict={conflict} brief={brief} onResolve={(conflictId, resolution) => dispatch({ type: "RESOLVE_CONFLICT", conflictId, resolution })} />)}
          </div>
        </div>

        <aside className="brief-rail">
          <span className="micro-label">FIXED CAMPAIGN FRAME</span>
          <h3>Cycling camera launch</h3>
          <dl>
            <div><dt>Markets</dt><dd>US + UK</dd></div>
            <div><dt>Budget cap</dt><dd>$180,000</dd></div>
            <div><dt>Effective views</dt><dd>≥ 2.6M</dd></div>
            <div><dt>Blended CPM</dt><dd>≤ $70</dd></div>
            <div><dt>Mandatory</dt><dd>YouTube</dd></div>
            <div><dt>Long-form</dt><dd>≥ 3 creators</dd></div>
          </dl>
          <div className="proof-block">
            <span>PROOF POINTS</span>
            {brief.proofPoints.map((point) => <p key={point}>↳ {point}</p>)}
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={unresolved > 0 || brief.status === "Published"}
            onClick={() => dispatch({ type: "PUBLISH_BRIEF" })}
          >
            {brief.status === "Published" ? "Brief v1 published" : `Publish Brief v1${unresolved ? ` · ${unresolved} blocked` : ""}`}
          </button>
        </aside>
      </section>
    </div>
  );
}
