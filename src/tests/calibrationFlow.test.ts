import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { buildCalibrationBatch } from "../agent/calibration";
import { generateSearchPackages } from "../domain/search";

function reachSourcing() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
  return campaignReducer(state, { type: "START_SOURCING" });
}

describe("candidate calibration", () => {
  it("delivers eight qualified examples plus two explicit failure cases", () => {
    const lockedMatrix = { ...campaignSeed.matrixScenarios[0], status: "Locked" as const, version: 1 };
    const packages = generateSearchPackages(lockedMatrix);
    const packageByCell = new Map(packages.map((item) => [item.matrixCellId, item]));
    const ids = buildCalibrationBatch(campaignSeed.candidates, packageByCell).map((item) => item.id);
    expect(ids).toHaveLength(10);
    expect(ids).toContain("creator-moto-only");
    expect(ids).toContain("creator-missing-evidence");
  });

  it("keeps rejection feedback scoped to the active campaign", () => {
    let state = reachSourcing();
    state = campaignReducer(state, { type: "REJECT_CALIBRATION_CANDIDATE", candidateId: "creator-05", reason: "Too commercial" });
    expect(state.agent.calibrationFeedback["creator-05"]).toBe("Too commercial");
    expect(state.agent.campaignPreferences).toContain("Prefer lifestyle-led cycling proof");
    expect(state.brief.proofPoints).not.toContain("Prefer lifestyle-led cycling proof");
  });
});
