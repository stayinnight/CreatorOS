import type { BriefVersion } from "./model";

export function resolveConflict(brief: BriefVersion, conflictId: string, resolution: string): BriefVersion {
  if (brief.status === "Published") throw new Error("Published Brief versions are immutable");
  return {
    ...brief,
    conflicts: brief.conflicts.map((conflict) => conflict.id === conflictId
      ? { ...conflict, resolution, status: "Resolved" as const }
      : conflict),
  };
}

export function publishBrief(brief: BriefVersion): BriefVersion {
  const unresolved = brief.conflicts.filter((conflict) => conflict.status !== "Resolved");
  if (unresolved.length) throw new Error(`Resolve ${unresolved.length} blocking conflicts`);
  return {
    ...brief,
    version: brief.version || 1,
    status: "Published",
    publishedAt: "2026-09-21T09:00:00+08:00",
  };
}
