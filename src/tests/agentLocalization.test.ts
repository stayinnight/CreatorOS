import { describe, expect, it } from "vitest";
import type { AgentMessage, AgentToolStepRecord } from "../agent/model";
import { localizeAgentMessage, localizeToolStep } from "../i18n/agentCopy";

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
});
