import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AgentWorking, workingStagesFor } from "../components/agent/AgentWorking";
import { LanguageProvider } from "../i18n/LanguageProvider";

describe("Agent working state", () => {
  it("describes the real deterministic work being staged", () => {
    expect(workingStagesFor("先只整理 Brief")).toEqual(["理解范围变更", "重排当前步骤", "生成 Revised Plan"]);
    const html = renderToString(<LanguageProvider><AgentWorking input="先只整理 Brief" /></LanguageProvider>);
    expect(html).toContain("Agent working");
    expect(html).toContain("Check workflow state");
  });
});
