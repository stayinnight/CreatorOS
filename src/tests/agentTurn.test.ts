import { describe, expect, it } from "vitest";
import { buildAgentTurnPlan } from "../agent/agentTurn";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("agent turn lifecycle", () => {
  it("plans real candidate checks for a recommendation explanation", () => {
    const plan = buildAgentTurnPlan(campaignSeed, "为什么推荐他", { candidateId: "creator-01" });
    expect(plan.understanding).toBe("解释当前候选的推荐依据");
    expect(plan.steps.map((step) => step.kind)).toEqual(["ReadMatrixCell", "EvaluateQualification", "InspectEvidence", "SummarizeFit"]);
    expect(plan.evidenceIds.length).toBeGreaterThan(0);
  });

  it("uses only quote and ceiling checks for a budget question", () => {
    const plan = buildAgentTurnPlan(campaignSeed, "他的预算风险？", { candidateId: "creator-01" });
    expect(plan.steps.map((step) => step.kind)).toEqual(["ReadQuote", "CompareBudgetCeiling"]);
  });

  it("appends the user first and one answer plus trace at completion", () => {
    const begun = campaignReducer(campaignSeed, { type: "BEGIN_AGENT_TURN", turnId: "turn-1", text: "下一步做什么" });
    expect(begun.agent.messages.at(-1)?.role).toBe("User");
    const completed = campaignReducer(begun, { type: "COMPLETE_AGENT_TURN", turnId: "turn-1", text: "下一步做什么" });
    expect(completed.agent.turns.at(-1)?.status).toBe("Completed");
    expect(completed.agent.messages.filter((message) => message.text === "下一步做什么")).toHaveLength(1);
  });
});
