import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("seeded campaign demo", () => {
  it("runs the brief-to-replenishment loop without external services", () => {
    let state = structuredClone(campaignSeed);
    state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-launch", resolution: "8 weeks" });
    state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-sports", resolution: "Pending; excluded from current plan" });
    state = campaignReducer(state, { type: "PUBLISH_BRIEF" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "LOAD_BATCHES" });
    state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
    const decisions = Object.fromEntries(state.candidates.filter((candidate) => candidate.role === "Primary").map((candidate) => [candidate.id, candidate.market === "UK" && candidate.ridingScenario === "Urban" ? "Pass" : "Select"])) as Record<string, "Select" | "Pass">;
    state = campaignReducer(state, { type: "SUBMIT_DECISIONS", decisions });
    expect(state.gapAssessment?.recommendedAction).toBe("Promote Backup");
    state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
    expect(state.gapAssessment?.recommendedAction).toBe("Replenish");
    state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });
    expect(state.searchPackages.some((searchPackage) => searchPackage.parentPackageId)).toBe(true);
  });
});
