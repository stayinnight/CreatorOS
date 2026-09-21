import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachApprovedCalibration() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "START_SOURCING" });
  return campaignReducer(state, { type: "APPROVE_CALIBRATION" });
}

describe("Agent client approval and recovery", () => {
  it("requires publication approval then recovers only affected cells", () => {
    let state = reachApprovedCalibration();
    state = campaignReducer(state, { type: "PREPARE_REVIEW" });
    expect(state.agent.runs[0].status).toBe("WaitingForApproval");
    expect(state.agent.messages.at(-1)?.text).toContain("30 client candidates");

    state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "ReviewRound", status: "Published" }));

    state = campaignReducer(state, { type: "APPLY_SEEDED_CLIENT_FEEDBACK" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "GapAssessment" }));
    expect(state.gapAssessment?.recommendedAction).toBe("Promote Backup");

    const unaffected = state.agent.artifacts.filter((item) => item.kind === "Brief" || item.kind === "Mix");
    expect(unaffected.every((item) => item.status !== "Stale")).toBe(true);
    state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
    state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });
    expect(state.searchPackages.find((item) => item.parentPackageId)?.matrixCellId).toContain("uk-urban");
  });
});
