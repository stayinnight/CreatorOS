import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("Brief-only Run revision", () => {
  it("changes the real plan and completes without a Mix CTA", () => {
    let state = campaignReducer(structuredClone(campaignSeed), { type: "LOAD_DEMO_MATERIALS" });
    state = campaignReducer(state, { type: "START_AGENT_RUN" });
    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "先只整理 Brief" });
    expect(state.agent.runs[0].scope).toBe("BriefOnly");
    expect(state.agent.steps.find((step) => step.id === "step-mix")?.status).toBe("Skipped");
    expect(state.agent.messages.at(-1)?.type).toBe("Plan");

    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
    expect(state.agent.runs[0].status).toBe("Completed");
    expect(state.agent.messages.some((message) => message.payloadRef === "generate-mix")).toBe(false);

    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "继续完整计划" });
    expect(state.agent.runs).toHaveLength(2);
    expect(state.agent.runs[1]).toEqual(expect.objectContaining({ scope: "FullCampaign", continuationOfRunId: "run-brief-to-shortlist", currentStepId: "step-mix" }));
  });
});
