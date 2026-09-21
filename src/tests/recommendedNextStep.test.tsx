import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecommendedNextStep } from "../components/agent/RecommendedNextStep";

describe("RecommendedNextStep", () => {
  it("renders one explanatory Matrix action", () => {
    const html = renderToString(<RecommendedNextStep action={{
      id: "generate-packages",
      stage: "Matrix locked",
      title: "Generate bounded search packages",
      reason: "The approved mix is now the sourcing contract.",
      outcome: "Creates six packages and unlocks calibration.",
      label: "Generate search packages",
      command: { kind: "dispatch", action: { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" } },
    }} onExecute={() => undefined} />);

    expect(html).toContain("Recommended next step");
    expect(html).toContain("Creates six packages");
    expect(html.match(/<button/g)).toHaveLength(1);
  });
});
