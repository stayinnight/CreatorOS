import type { CampaignArtifact } from "../../agent/model";

export function ArtifactCard({ artifact, onOpen }: { artifact: CampaignArtifact; onOpen: () => void }) {
  return <article className="agent-card artifact-card"><div className="artifact-glyph">{artifact.kind.slice(0, 1)}</div><div><span>{artifact.kind.toUpperCase()} · V{artifact.version}</span><strong>{artifact.summary}</strong><small>{artifact.status} · source lineage retained</small></div><button type="button" onClick={onOpen}>Inspect →</button></article>;
}
