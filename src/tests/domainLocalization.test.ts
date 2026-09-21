import { describe, expect, it } from "vitest";
import { formatDomainValue, formatStatus } from "../i18n/formatters";
import { localizedEntityField } from "../i18n/entityCopy";

describe("domain localization", () => {
  it("formats stable workflow and business values without changing unknown identities", () => {
    expect(formatStatus("zh-CN", "WaitingForApproval")).toBe("等待批准");
    expect(formatStatus("en", "WaitingForApproval")).toBe("Waiting for approval");
    expect(formatDomainValue("zh-CN", "Long Review")).toBe("长视频评测");
    expect(formatDomainValue("zh-CN", "YouTube")).toBe("YouTube");
    expect(formatStatus("zh-CN", "creator-01")).toBe("creator-01");
  });

  it("uses stable entity fields with a canonical fallback", () => {
    expect(localizedEntityField("zh-CN", "candidate", "candidate-riley", "internalNote", "Real road cycling evidence")).toBe("真实公路骑行与稳定的第一视角证据");
    expect(localizedEntityField("en", "candidate", "candidate-riley", "internalNote", "Real road cycling evidence")).toBe("Real road cycling evidence");
    expect(localizedEntityField("zh-CN", "candidate", "unknown", "internalNote", "Fallback")).toBe("Fallback");
  });
});
