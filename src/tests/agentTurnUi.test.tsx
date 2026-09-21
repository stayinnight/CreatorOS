import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AgentTurnTrace } from "../components/agent/AgentTurnTrace";
import { TypewriterAnswer } from "../components/agent/TypewriterAnswer";
import { LanguageProvider } from "../i18n/LanguageProvider";

const steps = [{ id: "tool-1", kind: "ReadWorkflowState" as const, label: "读取当前 Run 与 Artifact 状态", inputRefs: ["run-1"], summary: "已读取当前 Run 与 Artifact 状态" }];

describe("agent turn UI", () => {
  it("shows the current stage and real tool progress", () => {
    const html = renderToString(<LanguageProvider><AgentTurnTrace phase="RunningTools" understanding="Confirm workflow" steps={steps} completedStepCount={0} /></LanguageProvider>);
    expect(html).toContain("Action · Calling tools");
    expect(html).toContain("Confirm workflow");
    expect(html).toContain("Read workflow state");
    expect(html).toContain("Running");
  });

  it("names the thinking and answering stages explicitly", () => {
    expect(renderToString(<LanguageProvider><AgentTurnTrace phase="Understanding" understanding="Understand task" steps={steps} completedStepCount={0} /></LanguageProvider>)).toContain("Thinking · Understanding task");
    expect(renderToString(<LanguageProvider><AgentTurnTrace phase="Composing" understanding="Compose result" steps={steps} completedStepCount={1} /></LanguageProvider>)).toContain("Answer · Organizing result");
  });

  it("renders a completed trace collapsed", () => {
    const html = renderToString(<LanguageProvider><AgentTurnTrace phase="Completed" understanding="Confirm status" steps={steps} completedStepCount={1} /></LanguageProvider>);
    expect(html).toContain("Analysis completed with 1 workspace checks");
    expect(html).toContain("details");
  });

  it("shows the complete answer when animation is inactive", () => {
    expect(renderToString(<TypewriterAnswer text="这是最终回答" active={false} />)).toContain("这是最终回答");
  });
});
