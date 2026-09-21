import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { markDependentArtifactsStale } from "../agent/workflow";
import type { CampaignArtifact } from "../agent/model";

describe("campaign agent workflow", () => {
  it("plans work, pauses for two decisions, and produces Brief v1", () => {
    let state = structuredClone(campaignSeed);
    state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
    expect(state.agent.runs[0].status).toBe("Planned");
    expect(state.agent.messages.at(-1)?.type).toBe("Plan");

    state = campaignReducer(state, { type: "START_AGENT_RUN" });
    expect(state.agent.runs[0].status).toBe("WaitingForDecision");
    expect(state.agent.decisions.find((item) => item.status === "Pending")?.conflictId).toBe("conflict-launch");

    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
    expect(state.agent.decisions.find((item) => item.status === "Pending")?.conflictId).toBe("conflict-sports");

    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
    expect(state.brief.status).toBe("Published");
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "Brief", version: 1, status: "Published" }));
    expect(state.agent.runs[0].status).toBe("Running");
  });

  it("marks only downstream artifacts stale when an upstream artifact changes", () => {
    const artifact = (id: string, parents: string[]): CampaignArtifact => ({ id, campaignId: campaignSeed.id, kind: "Brief", version: 1, status: "Ready", sourceRunId: "run-01", sourceStepId: "step-01", parentArtifactIds: parents, summary: id, domainRef: id, createdAt: "2026-09-21T09:00:00+08:00" });
    const agent = { ...campaignSeed.agent, artifacts: [artifact("brief", []), artifact("mix", ["brief"]), artifact("batch", ["mix"]), artifact("unrelated", [])] };
    const updated = markDependentArtifactsStale(agent, "brief");
    expect(updated.artifacts.find((item) => item.id === "mix")?.status).toBe("Stale");
    expect(updated.artifacts.find((item) => item.id === "batch")?.status).toBe("Stale");
    expect(updated.artifacts.find((item) => item.id === "unrelated")?.status).toBe("Ready");
  });
});
