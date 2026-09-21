import { describe, expect, it } from "vitest";
import { availableActions } from "../agent/actions";
import { resolveAgentIntent } from "../agent/intent";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("context-aware Agent actions", () => {
  it("keeps evidence, risk and budget questions in candidate context", () => {
    for (const input of ["哪条证据证明适合头戴摄像头？", "他有什么风险？", "他的预算风险？"]) {
      expect(resolveAgentIntent(input, { state: campaignSeed, candidateId: "creator-01" }).intent.type).toBe("ExplainCandidate");
    }
  });

  it("does not offer candidate commands without candidate context", () => {
    const actions = availableActions(campaignSeed, {});
    expect(actions.map((item) => item.label)).not.toContain("为什么推荐他");
  });

  it("offers relevant decisions while the Brief is waiting", () => {
    let state = campaignReducer(structuredClone(campaignSeed), { type: "LOAD_DEMO_MATERIALS" });
    state = campaignReducer(state, { type: "START_AGENT_RUN" });
    expect(availableActions(state, {}).map((item) => item.label)).toEqual(expect.arrayContaining(["采用建议", "查看来源", "先只整理 Brief"]));
  });

  it("returns a Chinese stage-specific fallback", () => {
    const result = resolveAgentIntent("随便帮我做点什么", { state: campaignSeed });
    expect(result.available).toBe(false);
    expect(result.suggestions).toContain("分析 3 份材料");
  });
});
