import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";
import { lockMatrix } from "../domain/matrix";
import { generateSearchPackages } from "../domain/search";

function publishedBrief() {
  const one = resolveConflict(campaignSeed.brief, "conflict-launch", "8 weeks");
  return publishBrief(resolveConflict(one, "conflict-sports", "Pending; excluded from current plan"));
}

describe("Matrix application flow", () => {
  it("generates a traceable package from every locked Matrix cell", () => {
    const locked = lockMatrix(campaignSeed.matrixScenarios[0], publishedBrief());
    const packages = generateSearchPackages(locked);
    expect(packages).toHaveLength(locked.rows.length);
    expect(packages[0]).toMatchObject({
      id: "pkg-us-road-youtube",
      matrixVersionId: locked.id,
      matrixCellId: locked.rows[0].id,
      candidateTargetCount: locked.rows[0].plannedCreators * locked.rows[0].searchMultiplier,
    });
  });

  it("runs conflict resolution, publication, lock, and generation through one reducer", () => {
    let state = structuredClone(campaignSeed);
    state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-launch", resolution: "8 weeks" });
    state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-sports", resolution: "Pending; excluded from current plan" });
    state = campaignReducer(state, { type: "PUBLISH_BRIEF" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    expect(state.brief.status).toBe("Published");
    expect(state.matrixScenarios[0].status).toBe("Locked");
    expect(state.searchPackages).toHaveLength(6);
    expect(state.activity.at(-1)?.message).toContain("6 search packages");
  });
});
