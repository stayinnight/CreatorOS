import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { NextActionCard } from "../components/agent/NextActionCard";
import { ProgressCard } from "../components/agent/ProgressCard";

function reachPackages() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
  return campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: state.activeScenarioId });
}

describe("Agent workflow guidance", () => {
  it("answers next-step questions with the current executable action", () => {
    let state = reachPackages();
    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步做什么" });
    expect(state.agent.messages.at(-1)).toEqual(expect.objectContaining({
      type: "NextAction",
      payloadRef: "recommended:start-calibration",
    }));
  });

  it("answers current progress with structured progress", () => {
    let state = reachPackages();
    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "当前进度" });
    expect(state.agent.messages.at(-1)).toEqual(expect.objectContaining({
      type: "Progress",
      payloadRef: "recommended:start-calibration",
    }));
  });

  it("appends the current next action again so the user never has to scroll up", () => {
    let state = reachPackages();
    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步" });
    state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步做什么" });
    expect(state.agent.messages.filter((message) => message.payloadRef === "recommended:start-calibration")).toHaveLength(2);
  });

  it("renders progress with the next executable action", () => {
    const html = renderToString(createElement(ProgressCard, { current: "Packages ready", completed: 4, total: 9, nextLabel: "Start calibration" }));
    expect(html).toContain("4 / 9");
    expect(html).toContain("Start calibration");
  });

  it("removes controls from retired next actions", () => {
    const message = reachPackages().agent.messages.find((item) => item.type === "NextAction")!;
    const html = renderToString(createElement(NextActionCard, { message, lifecycle: "Superseded", actionLabel: "Continue", onAction: () => undefined }));
    expect(html).toContain("Superseded");
    expect(html).not.toContain("<button");
  });
});
