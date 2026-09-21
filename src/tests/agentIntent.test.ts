import { describe, expect, it } from "vitest";
import { parseAgentIntent } from "../agent/intent";

describe("bounded agent intent parser", () => {
  it("maps supported operator language and discloses unsupported input", () => {
    expect(parseAgentIntent("先只整理 Brief")).toEqual({ type: "ScopeRun", scope: "BriefOnly" });
    expect(parseAgentIntent("为什么推荐他", { candidateId: "creator-01" })).toEqual({ type: "ExplainCandidate", candidateId: "creator-01" });
    expect(parseAgentIntent("找相似但更生活化的人", { candidateId: "creator-01" })).toEqual({ type: "FindSimilar", candidateId: "creator-01", preference: "Lifestyle" });
    expect(parseAgentIntent("帮我预测明年所有市场")).toEqual({ type: "Unsupported", suggestions: expect.any(Array) });
  });
});
