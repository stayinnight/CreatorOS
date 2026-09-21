import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AgentTurnTrace } from "../components/agent/AgentTurnTrace";
import { TypewriterAnswer } from "../components/agent/TypewriterAnswer";

const steps = [{ id: "tool-1", kind: "ReadWorkflowState" as const, label: "读取当前 Run 与 Artifact 状态", inputRefs: ["run-1"], summary: "已读取当前 Run 与 Artifact 状态" }];

describe("agent turn UI", () => {
  it("shows the current stage and real tool progress", () => {
    const html = renderToString(<AgentTurnTrace phase="RunningTools" understanding="确认当前工作流状态与下一步" steps={steps} completedStepCount={0} />);
    expect(html).toContain("行动 · 正在调用工具");
    expect(html).toContain("确认当前工作流状态与下一步");
    expect(html).toContain("读取当前 Run 与 Artifact 状态");
    expect(html).toContain("Running");
  });

  it("names the thinking and answering stages explicitly", () => {
    expect(renderToString(<AgentTurnTrace phase="Understanding" understanding="理解任务" steps={steps} completedStepCount={0} />)).toContain("思考 · 正在理解任务");
    expect(renderToString(<AgentTurnTrace phase="Composing" understanding="组织结果" steps={steps} completedStepCount={1} />)).toContain("回答 · 正在组织结果");
  });

  it("renders a completed trace collapsed", () => {
    const html = renderToString(<AgentTurnTrace phase="Completed" understanding="确认状态" steps={steps} completedStepCount={1} />);
    expect(html).toContain("使用 1 项工作区检查完成分析");
    expect(html).toContain("details");
  });

  it("shows the complete answer when animation is inactive", () => {
    expect(renderToString(<TypewriterAnswer text="这是最终回答" active={false} />)).toContain("这是最终回答");
  });
});
