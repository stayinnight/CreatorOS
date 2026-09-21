import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("complete campaign Agent Demo", () => {
  it("runs intake to localized recovery without feature-page navigation", () => {
    let state = structuredClone(campaignSeed);
    state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
    state = campaignReducer(state, { type: "START_AGENT_RUN" });
    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
    state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "START_SOURCING" });
    state = campaignReducer(state, { type: "REVIEW_CALIBRATION_CANDIDATE", candidateId: "creator-01", decision: "Accepted" });
    state = campaignReducer(state, { type: "REVIEW_CALIBRATION_CANDIDATE", candidateId: "creator-02", decision: "Accepted" });
    state = campaignReducer(state, { type: "REVIEW_CALIBRATION_CANDIDATE", candidateId: "creator-moto-only", decision: "Rejected", reason: "No real cycling" });
    state = campaignReducer(state, { type: "REJECT_CALIBRATION_CANDIDATE", candidateId: "creator-05", reason: "Too commercial" });
    state = campaignReducer(state, { type: "APPROVE_CALIBRATION" });
    state = campaignReducer(state, { type: "PREPARE_REVIEW" });
    state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
    state = campaignReducer(state, { type: "APPLY_SEEDED_CLIENT_FEEDBACK" });
    state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
    state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });

    const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId)!;
    expect(run.status).toBe("Completed");
    expect(state.agent.artifacts.map((item) => item.kind)).toEqual(expect.arrayContaining(["Brief", "Mix", "SearchPackageSet", "CandidateBatch", "ReviewRound", "GapAssessment"]));
    expect(state.agent.artifacts.filter((item) => item.kind === "Brief" || item.kind === "Mix").every((item) => item.status !== "Stale")).toBe(true);
  });
});
