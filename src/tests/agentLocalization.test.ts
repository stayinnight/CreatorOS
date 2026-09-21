import { describe, expect, it } from "vitest";
import type { AgentMessage, AgentToolStepRecord } from "../agent/model";
import { localizeAgentMessage, localizeSystemText, localizeToolStep, localizeUnderstanding } from "../i18n/agentCopy";

const base: AgentMessage = { id: "m", runId: "run", role: "Agent", type: "Text", text: "Client slate ready", payloadRef: null, createdAt: "now" };

describe("Agent localization", () => {
  it("localizes semantic system messages but never user-authored text", () => {
    const system = { ...base, messageKey: "agent.slate.ready" as const, messageParams: { primaryCount: 30, backupCount: 10 } };
    expect(localizeAgentMessage("zh-CN", system)).toBe("客户名单已就绪：30 位主选，10 位内部备选");
    expect(localizeAgentMessage("zh-CN", { ...system, role: "User" })).toBe("Client slate ready");
    expect(localizeAgentMessage("zh-CN", base)).toBe("Client slate ready");
  });

  it("localizes tool steps from their stable kind", () => {
    const step: AgentToolStepRecord = { id: "tool", kind: "EvaluateQualification", label: "Evaluate qualification", inputRefs: [], summary: "Evaluated qualification" };
    expect(localizeToolStep("zh-CN", step).label).toBe("评估候选人资格");
  });

  it("recognizes deterministic legacy workflow copy without touching unknown text", () => {
    expect(localizeSystemText("zh-CN", "Brief v1 is ready. Next I can build and compare two creator mix options.")).toContain("Brief v1 已就绪");
    expect(localizeSystemText("zh-CN", "A user sentence")).toBe("A user sentence");
  });

  it("renders canonical Agent planning copy in the selected language", () => {
    expect(localizeUnderstanding("en", "分析客户材料并规划工作")).toBe("Analyze client materials and plan the work");
    expect(localizeSystemText("en", "总预算上限为 $180,000，包含达人费用与版权成本。")).toBe("The total budget cap is $180,000, including creator fees and rights costs.");
  });
});
