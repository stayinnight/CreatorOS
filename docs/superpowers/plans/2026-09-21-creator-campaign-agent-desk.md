# Creator Campaign Agent Desk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six-tab feature showcase with a deterministic Campaign Agent Desk where an operator submits source materials, reviews an Agent plan, resolves high-risk decisions, inspects versioned artifacts, calibrates candidates, approves client publication, and recovers feedback gaps without leaving the Campaign workflow.

**Architecture:** Keep the existing pure Brief, Matrix, candidate, review, and gap domain functions. Add a bounded Agent workflow layer that stores Runs, Steps, Messages, Decisions, Artifacts, and current Campaign preferences in `CampaignState`; the existing reducer orchestrates these deterministic transitions. Rebuild the shell around Inbox, Campaign Desk, and Run History, with artifact details shown in a persistent inspector rather than top-level feature routes.

**Tech Stack:** Node 18.18+, React 19.3, TypeScript 5.7, Vite 5.4, React Router 6.30, Zod 4, Vitest 2.1, jsdom 24, and the existing focused global stylesheet. Do not add packages.

## Global Constraints

- The runtime must not call an online model, parse real files, query a real Creator provider, or send Feishu/Gmail messages.
- The Composer supports action chips and a fixed intent parser; unsupported free text must disclose the Demo boundary.
- Low-risk steps may advance automatically; budget, launch timing, scope, Matrix lock, client publish, and relaxation decisions require explicit user action.
- Brief, Mix, SearchPackageSet, CandidateBatch, ReviewRound, and GapAssessment are versioned Artifacts with source Run/Step references.
- Existing Matrix formulas, qualification rules, client projection, 30 + 10 policy, and gap logic remain the source of truth.
- The cycling head-mounted camera remains visible in source analysis, Mix reasoning, evidence qualification, candidate feedback, and recovery.
- Do not build a generic workflow engine, agent builder, backend, auth system, database, concurrency layer, or production connector.
- Preserve the current full test suite and add focused Agent workflow coverage before changing the UI.

---

## File Structure

```text
src/
  agent/
    model.ts                         bounded Run, Step, Message, Decision and Artifact types
    seed.ts                          deterministic Agent workspace fixture
    workflow.ts                      pure transitions and artifact invalidation
    intent.ts                        fixed Composer intent parser
  app/
    App.tsx                          Inbox / Campaign / Runs shell and routes
    CampaignProvider.tsx             persisted campaign state provider
    campaignReducer.ts               domain + Agent workflow orchestration
  components/
    agent/
      CampaignRail.tsx               Inbox groups and campaign selection
      AgentTimeline.tsx              chronological message renderer
      AgentComposer.tsx              attachments, chips and bounded text input
      PlanCard.tsx                   run plan and start action
      RunGroupCard.tsx               collapsible tool-step summary
      DecisionCard.tsx               evidence, recommendation and options
      ArtifactCard.tsx               version/status summary and open action
      ExceptionCard.tsx              retry/revise/human recovery choices
      NextActionCard.tsx             one primary and limited secondary actions
      ContextRail.tsx                artifacts, constraints and decisions
      ArtifactInspector.tsx          Brief/Mix/Batch/Review detail dispatcher
  pages/
    InboxPage.tsx                    task-oriented campaign inbox
    CampaignDeskPage.tsx             three-column Agent Desk
    RunsPage.tsx                     run history and failed-step inspection
    ClientPreviewPage.tsx            safe client projection preview
  tests/
    agentSeed.test.ts
    agentWorkflow.test.ts
    agentShell.test.tsx
    agentIntent.test.ts
    agentMatrixFlow.test.ts
    calibrationFlow.test.ts
    agentReviewFlow.test.ts
    agentDemoFlow.test.ts
```

Existing `BriefPage.tsx`, `MixPlannerPage.tsx`, `SearchCandidatesPage.tsx`, `ClientReviewPage.tsx`, `OverviewPage.tsx`, and `ActivityPage.tsx` remain until the new shell passes the end-to-end test, then are removed in Task 8. Their reusable table, drawer, badge, metric, constraint, and domain code stays.

---

### Task 1: Add the bounded Agent workflow model and deterministic seed

**Files:**
- Create: `src/agent/model.ts`
- Create: `src/agent/seed.ts`
- Modify: `src/domain/model.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/data/seedSchema.ts`
- Test: `src/tests/agentSeed.test.ts`

**Interfaces:**
- Consumes: existing `CampaignState`, `BriefSource`, and deterministic source fixtures.
- Produces: `AgentWorkspaceState`, `AgentRun`, `RunStep`, `AgentMessage`, `DecisionRequest`, `CampaignArtifact`, `createAgentSeed()`, and `CampaignState.agent`.

- [ ] **Step 1: Write the failing Agent seed test**

```ts
import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";

describe("agent workspace seed", () => {
  it("starts at a bounded campaign intake instead of a pre-completed workflow", () => {
    expect(campaignSeed.agent.activeRunId).toBeNull();
    expect(campaignSeed.agent.runs).toEqual([]);
    expect(campaignSeed.agent.artifacts).toEqual([]);
    expect(campaignSeed.agent.messages).toEqual([
      expect.objectContaining({ type: "Text", role: "Agent", text: expect.stringContaining("客户材料") }),
    ]);
    expect(campaignSeed.agent.availableSources).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- src/tests/agentSeed.test.ts`

Expected: FAIL because `CampaignState` has no `agent` field.

- [ ] **Step 3: Define the exact Agent model**

Create `src/agent/model.ts`:

```ts
export type AgentRunStatus = "Planned" | "Running" | "WaitingForDecision" | "WaitingForApproval" | "Failed" | "Completed";
export type RunStepStatus = "Pending" | "Running" | "Waiting" | "Succeeded" | "Failed" | "Skipped";
export type AgentMessageType = "Text" | "Plan" | "RunGroup" | "Decision" | "Artifact" | "Exception" | "NextAction";
export type ArtifactKind = "Brief" | "Mix" | "SearchPackageSet" | "CandidateBatch" | "ReviewRound" | "GapAssessment";
export type ArtifactStatus = "Draft" | "Ready" | "Locked" | "Published" | "Stale";

export interface RunStep {
  id: string;
  runId: string;
  kind: "ReadSources" | "NormalizeBrief" | "DetectConflicts" | "BuildMix" | "SourceCandidates" | "Calibrate" | "PublishReview" | "AssessGap" | "RecoverGap";
  label: string;
  status: RunStepStatus;
  inputRefs: string[];
  outputRefs: string[];
  summary: string;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AgentRun {
  id: string;
  campaignId: string;
  goal: string;
  status: AgentRunStatus;
  currentStepId: string | null;
  stepIds: string[];
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface AgentMessage {
  id: string;
  runId: string | null;
  role: "User" | "Agent" | "System";
  type: AgentMessageType;
  text: string;
  payloadRef: string | null;
  createdAt: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  value: string;
  impact: string;
}

export interface DecisionRequest {
  id: string;
  runId: string;
  stepId: string;
  conflictId: string;
  question: string;
  options: DecisionOption[];
  evidenceSourceIds: string[];
  recommendation: string;
  rationale: string;
  status: "Pending" | "Resolved";
  resolution: string | null;
  resolvedAt: string | null;
}

export interface CampaignArtifact {
  id: string;
  campaignId: string;
  kind: ArtifactKind;
  version: number;
  status: ArtifactStatus;
  sourceRunId: string;
  sourceStepId: string;
  parentArtifactIds: string[];
  summary: string;
  domainRef: string;
  createdAt: string;
}

export interface AgentWorkspaceState {
  activeRunId: string | null;
  selectedArtifactId: string | null;
  availableSources: string[];
  runs: AgentRun[];
  steps: RunStep[];
  messages: AgentMessage[];
  decisions: DecisionRequest[];
  artifacts: CampaignArtifact[];
  calibrationCandidateIds: string[];
  calibrationFeedback: Record<string, string>;
  campaignPreferences: string[];
}
```

Import `AgentWorkspaceState` in `src/domain/model.ts` and add `agent: AgentWorkspaceState` to `CampaignState`.

- [ ] **Step 4: Create the initial workspace fixture**

Create `src/agent/seed.ts`:

```ts
import type { AgentWorkspaceState } from "./model";

export function createAgentSeed(): AgentWorkspaceState {
  return {
    activeRunId: null,
    selectedArtifactId: null,
    availableSources: ["source-email", "source-excel", "source-meeting"],
    runs: [],
    steps: [],
    decisions: [],
    artifacts: [],
    calibrationCandidateIds: [],
    calibrationFeedback: {},
    campaignPreferences: [],
    messages: [{
      id: "message-welcome",
      runId: null,
      role: "Agent",
      type: "Text",
      text: "把客户邮件、预算表和会议纪要交给我。我会先分析材料、列出计划，并在高影响冲突处暂停。",
      payloadRef: null,
      createdAt: "2026-09-21T08:30:00+08:00",
    }],
  };
}
```

Add `agent: createAgentSeed()` to `campaignSeed` and extend `seedSchema.ts` with explicit schemas for every Agent field. Do not use `z.unknown()` for Agent data.

- [ ] **Step 5: Run seed and existing tests**

Run: `npm test -- src/tests/agentSeed.test.ts src/tests/seed.test.ts`

Expected: 2 test files pass; the fixture still contains 42 candidates, two Matrix scenarios, and an empty search package list.

- [ ] **Step 6: Commit**

```bash
git add src/agent/model.ts src/agent/seed.ts src/domain/model.ts src/data/seed.ts src/data/seedSchema.ts src/tests/agentSeed.test.ts
git commit -m "feat: model deterministic campaign agent runs"
```

---

### Task 2: Implement intake, planning, execution, and Brief decision transitions

**Files:**
- Create: `src/agent/workflow.ts`
- Modify: `src/app/campaignReducer.ts`
- Test: `src/tests/agentWorkflow.test.ts`

**Interfaces:**
- Consumes: `AgentWorkspaceState`, `BriefVersion`, `resolveConflict()`, and `publishBrief()`.
- Produces: `planMaterialRun()`, `startMaterialRun()`, `resolveWorkflowDecision()`, `registerArtifact()`, `markDependentArtifactsStale()`, `selectArtifact()`, and reducer actions `LOAD_DEMO_MATERIALS`, `START_AGENT_RUN`, `RESOLVE_AGENT_DECISION`, `OPEN_ARTIFACT`, `CLOSE_ARTIFACT`.

- [ ] **Step 1: Write the failing Brief-to-Artifact workflow test**

```ts
import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { markDependentArtifactsStale } from "../agent/workflow";

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
    const artifact = (id: string, parents: string[]) => ({
      id,
      campaignId: "campaign-cycling-camera",
      kind: "Brief" as const,
      version: 1,
      status: "Ready" as const,
      sourceRunId: "run-01",
      sourceStepId: "step-01",
      parentArtifactIds: parents,
      summary: id,
      domainRef: id,
      createdAt: "2026-09-21T09:00:00+08:00",
    });
    const agent = { ...campaignSeed.agent, artifacts: [artifact("brief", []), artifact("mix", ["brief"]), artifact("batch", ["mix"]), artifact("unrelated", [])] };
    const updated = markDependentArtifactsStale(agent, "brief");
    expect(updated.artifacts.find((item) => item.id === "mix")?.status).toBe("Stale");
    expect(updated.artifacts.find((item) => item.id === "batch")?.status).toBe("Stale");
    expect(updated.artifacts.find((item) => item.id === "unrelated")?.status).toBe("Ready");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/tests/agentWorkflow.test.ts`

Expected: FAIL because the new reducer actions do not exist.

- [ ] **Step 3: Implement pure workflow helpers**

Create `src/agent/workflow.ts` with immutable helpers. Use fixed timestamps and IDs so reset and tests are reproducible.

```ts
import type { AgentWorkspaceState, CampaignArtifact, DecisionRequest } from "./model";

const AT = "2026-09-21T09:00:00+08:00";

export function planMaterialRun(agent: AgentWorkspaceState): AgentWorkspaceState {
  const runId = "run-brief-to-shortlist";
  return {
    ...agent,
    activeRunId: runId,
    runs: [{ id: runId, campaignId: "campaign-cycling-camera", goal: "Turn client materials into a review-ready creator shortlist", status: "Planned", currentStepId: "step-read", stepIds: ["step-read", "step-normalize", "step-conflicts", "step-mix", "step-source", "step-calibrate", "step-publish", "step-gap", "step-recover"], inputArtifactIds: [], outputArtifactIds: [], startedAt: null, completedAt: null }],
    steps: [
      { id: "step-read", runId, kind: "ReadSources", label: "Read 3 client sources", status: "Pending", inputRefs: agent.availableSources, outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-normalize", runId, kind: "NormalizeBrief", label: "Normalize 18 brief fields", status: "Pending", inputRefs: agent.availableSources, outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-conflicts", runId, kind: "DetectConflicts", label: "Resolve high-impact conflicts", status: "Pending", inputRefs: agent.availableSources, outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-mix", runId, kind: "BuildMix", label: "Build and validate creator mix", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-source", runId, kind: "SourceCandidates", label: "Source and qualify candidates", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-calibrate", runId, kind: "Calibrate", label: "Calibrate candidate direction", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-publish", runId, kind: "PublishReview", label: "Prepare and publish client review", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-gap", runId, kind: "AssessGap", label: "Assess client feedback gap", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
      { id: "step-recover", runId, kind: "RecoverGap", label: "Recover affected Matrix cells", status: "Pending", inputRefs: [], outputRefs: [], summary: "", error: null, startedAt: null, completedAt: null },
    ],
    messages: [...agent.messages, { id: "message-plan", runId, role: "Agent", type: "Plan", text: "I will read 3 sources, normalize the Brief, surface high-impact conflicts, and pause before strategy decisions.", payloadRef: runId, createdAt: AT }],
  };
}

export function registerArtifact(agent: AgentWorkspaceState, artifact: CampaignArtifact): AgentWorkspaceState {
  return {
    ...agent,
    artifacts: [...agent.artifacts, artifact],
    messages: [...agent.messages, { id: `message-${artifact.id}`, runId: artifact.sourceRunId, role: "Agent", type: "Artifact", text: artifact.summary, payloadRef: artifact.id, createdAt: artifact.createdAt }],
  };
}

export function selectArtifact(agent: AgentWorkspaceState, artifactId: string | null): AgentWorkspaceState {
  return { ...agent, selectedArtifactId: artifactId };
}

export function markDependentArtifactsStale(agent: AgentWorkspaceState, changedArtifactId: string): AgentWorkspaceState {
  const staleIds = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const artifact of agent.artifacts) {
      if (!staleIds.has(artifact.id) && artifact.parentArtifactIds.some((id) => id === changedArtifactId || staleIds.has(id))) {
        staleIds.add(artifact.id);
        changed = true;
      }
    }
  }
  return { ...agent, artifacts: agent.artifacts.map((artifact) => staleIds.has(artifact.id) ? { ...artifact, status: "Stale" as const } : artifact) };
}
```

Add `startMaterialRun()` and `resolveWorkflowDecision()` in the same file. `startMaterialRun()` marks ReadSources and NormalizeBrief as Succeeded, DetectConflicts as Waiting, creates both DecisionRequests, but only the first unresolved Decision is rendered as active. `resolveWorkflowDecision()` resolves one Decision and keeps the Run waiting while another unresolved Decision exists.

- [ ] **Step 4: Orchestrate Brief publication in the reducer**

Extend `CampaignAction`:

```ts
| { type: "LOAD_DEMO_MATERIALS" }
| { type: "START_AGENT_RUN" }
| { type: "RESOLVE_AGENT_DECISION"; decisionId: string; value: string }
| { type: "OPEN_ARTIFACT"; artifactId: string }
| { type: "CLOSE_ARTIFACT" };
```

In `RESOLVE_AGENT_DECISION`, map `decision.conflictId` to the existing Brief conflict, call `resolveConflict`, and after no pending decisions remain call `publishBrief`. Register this Artifact exactly:

```ts
{
  id: "artifact-brief-v1",
  campaignId: state.id,
  kind: "Brief",
  version: 1,
  status: "Published",
  sourceRunId: "run-brief-to-shortlist",
  sourceStepId: "step-conflicts",
  parentArtifactIds: [],
  summary: "Brief v1 published · 2 conflicts resolved · US / UK cycling camera launch",
  domainRef: "brief-v1",
  createdAt: "2026-09-21T09:12:00+08:00",
}
```

Move the Run to `Running`, set current step to `step-mix`, and append a `NextAction` message whose payload is `generate-mix`.

- [ ] **Step 5: Run workflow and regression tests**

Run: `npm test -- src/tests/agentWorkflow.test.ts src/tests/brief.test.ts src/tests/seed.test.ts`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/agent/workflow.ts src/app/campaignReducer.ts src/tests/agentWorkflow.test.ts
git commit -m "feat: run brief intake through agent decisions"
```

---

### Task 3: Replace the feature-tab shell with Inbox, Campaign Desk, and Runs

**Files:**
- Create: `src/pages/InboxPage.tsx`
- Create: `src/pages/CampaignDeskPage.tsx`
- Create: `src/pages/RunsPage.tsx`
- Create: `src/components/agent/CampaignRail.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`
- Test: `src/tests/agentShell.test.tsx`

**Interfaces:**
- Consumes: `CampaignState.agent`, existing `CampaignProvider`, and router context.
- Produces: routes `/`, `/campaigns/:campaignId`, `/campaigns/:campaignId/runs/:runId`, `/runs`, plus the shared three-column shell.

- [ ] **Step 1: Write the failing shell test**

```tsx
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Agent Desk shell", () => {
  it("uses work-entry navigation instead of feature tabs", () => {
    const html = renderToString(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
    expect(html).toContain("Waiting for you");
    expect(html).toContain("Campaigns");
    expect(html).toContain("Runs");
    expect(html).not.toContain("Mix Planner</a>");
    expect(html).not.toContain("Search &amp; Candidates</a>");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/tests/agentShell.test.tsx`

Expected: FAIL because the old six-item navigation is still rendered.

- [ ] **Step 3: Implement Inbox cards around current work**

Create `InboxPage.tsx` with a single active Campaign card and three compact seeded examples for visual context. Only the cycling-camera card is interactive.

```tsx
export function InboxPage() {
  const { state } = useCampaign();
  const activeRun = state.agent.runs.find((run) => run.id === state.agent.activeRunId);
  const status = activeRun?.status ?? "Ready to start";
  const action = status === "WaitingForDecision" ? "Review decisions" : status === "Planned" ? "Review plan" : "Open campaign";
  return (
    <section className="inbox-page">
      <header className="inbox-hero"><p className="eyebrow">WORK INBOX</p><h1>What needs your judgment today.</h1></header>
      <div className="inbox-groups">
        <CampaignInboxCard title={state.name} status={status} action={action} href={`/campaigns/${state.id}`} />
      </div>
    </section>
  );
}
```

The card must show deadline, current Agent action, owner, risk, and exactly one primary CTA.

- [ ] **Step 4: Build the new App routes and rail**

Change `App.tsx` navigation to:

```ts
const navigation = [
  { label: "Inbox", path: "/" },
  { label: "Campaigns", path: "/campaigns/campaign-cycling-camera" },
  { label: "Runs", path: "/runs" },
];
```

Routes:

```tsx
<Route path="/" element={<InboxPage />} />
<Route path="/campaigns/:campaignId" element={<CampaignDeskPage />} />
<Route path="/campaigns/:campaignId/runs/:runId" element={<CampaignDeskPage />} />
<Route path="/runs" element={<RunsPage />} />
```

`CampaignRail` shows Waiting, Running, At risk groups and the active cycling-camera Campaign. `CampaignDeskPage` initially renders labeled Timeline and Context regions so the shell is testable before their dedicated components exist.

- [ ] **Step 5: Replace shell CSS**

Keep the industrial/editorial visual language but define the new layout tokens and responsive behavior:

```css
.agent-shell { min-height: 100vh; display: grid; grid-template-columns: 220px minmax(0, 1fr); background: var(--canvas); }
.campaign-desk { height: 100vh; display: grid; grid-template-columns: 230px minmax(500px, 1fr) 330px; overflow: hidden; }
.agent-stream { overflow-y: auto; padding: 24px clamp(22px, 4vw, 54px) 120px; }
.context-rail { overflow-y: auto; border-left: 1px solid var(--line); background: #f4f2ec; }
@media (max-width: 1050px) { .campaign-desk { grid-template-columns: 190px minmax(0, 1fr); }.context-rail { display: none; } }
```

Remove old `.empty-stage` and feature-tab navigation styles only after no component references them.

- [ ] **Step 6: Run shell, app, and build checks**

Run: `npm test -- src/tests/agentShell.test.tsx src/tests/appShell.test.tsx && npm run build`

Expected: both shell tests and production build pass. Update `appShell.test.tsx` to assert `Inbox`, `Campaigns`, `Runs`, and the campaign name.

- [ ] **Step 7: Commit**

```bash
git add src/pages/InboxPage.tsx src/pages/CampaignDeskPage.tsx src/pages/RunsPage.tsx src/components/agent/CampaignRail.tsx src/app/App.tsx src/styles.css src/tests/agentShell.test.tsx src/tests/appShell.test.tsx
git commit -m "feat: replace feature tabs with campaign work inbox"
```

---

### Task 4: Render Agent plans, execution, decisions, and bounded Composer intents

**Files:**
- Create: `src/agent/intent.ts`
- Create: `src/components/agent/AgentTimeline.tsx`
- Create: `src/components/agent/AgentComposer.tsx`
- Create: `src/components/agent/PlanCard.tsx`
- Create: `src/components/agent/RunGroupCard.tsx`
- Create: `src/components/agent/DecisionCard.tsx`
- Create: `src/components/agent/ArtifactCard.tsx`
- Create: `src/components/agent/ExceptionCard.tsx`
- Create: `src/components/agent/NextActionCard.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/styles.css`
- Test: `src/tests/agentIntent.test.ts`

**Interfaces:**
- Consumes: Agent messages, decisions, steps, artifacts, and reducer actions from Tasks 1–2.
- Produces: `parseAgentIntent(input)`, six message-card components, and interactive material-load/start/decision flow.

- [ ] **Step 1: Write the failing intent test**

```ts
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
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/tests/agentIntent.test.ts`

Expected: FAIL because `src/agent/intent.ts` does not exist.

- [ ] **Step 3: Implement the fixed parser**

```ts
export type AgentIntent =
  | { type: "ScopeRun"; scope: "BriefOnly" }
  | { type: "ExplainCandidate"; candidateId: string }
  | { type: "FindSimilar"; candidateId: string; preference: "Lifestyle" }
  | { type: "Unsupported"; suggestions: string[] };

export function parseAgentIntent(input: string, context?: { candidateId?: string }): AgentIntent {
  const normalized = input.trim().toLowerCase();
  if (normalized.includes("只整理 brief")) return { type: "ScopeRun", scope: "BriefOnly" };
  if (normalized.includes("为什么推荐") && context?.candidateId) return { type: "ExplainCandidate", candidateId: context.candidateId };
  if (normalized.includes("相似") && normalized.includes("生活化") && context?.candidateId) return { type: "FindSimilar", candidateId: context.candidateId, preference: "Lifestyle" };
  return { type: "Unsupported", suggestions: ["先只整理 Brief", "为什么推荐他", "找相似但更生活化的人"] };
}
```

- [ ] **Step 4: Implement message card dispatch**

`AgentTimeline` switches only on the seven `AgentMessageType` values. Each non-text card receives the referenced domain object rather than parsing message text.

```tsx
export function AgentTimeline() {
  const { state, dispatch } = useCampaign();
  return <div className="agent-timeline">
    {state.agent.messages.map((message) => {
      if (message.type === "Plan") return <PlanCard key={message.id} run={findRun(state, message.payloadRef)} onStart={() => dispatch({ type: "START_AGENT_RUN" })} />;
      if (message.type === "RunGroup") return <RunGroupCard key={message.id} steps={findRunSteps(state, message.payloadRef)} />;
      if (message.type === "Decision") return <DecisionCard key={message.id} decision={findDecision(state, message.payloadRef)} onResolve={(value) => dispatch({ type: "RESOLVE_AGENT_DECISION", decisionId: message.payloadRef!, value })} />;
      if (message.type === "Artifact") return <ArtifactCard key={message.id} artifact={findArtifact(state, message.payloadRef)} onOpen={() => dispatch({ type: "OPEN_ARTIFACT", artifactId: message.payloadRef! })} />;
      if (message.type === "Exception") return <ExceptionCard key={message.id} message={message} />;
      if (message.type === "NextAction") return <NextActionCard key={message.id} message={message} />;
      return <div className={`chat-message ${message.role.toLowerCase()}`} key={message.id}>{message.text}</div>;
    })}
  </div>;
}
```

`DecisionCard` must show evidence sources, recommendation, rationale, impact per option, and resolved state. Do not render only two unexplained buttons.

- [ ] **Step 5: Implement the Composer and material intake**

Before a Run exists, show three fixture attachments and the primary action `Analyze 3 materials`. Dispatch `LOAD_DEMO_MATERIALS`. After a Run exists, render an input and the three supported chips. Unsupported input appends an Agent `Text` message explaining the boundary and suggestions; it must not mutate domain state.

Add one reducer action:

```ts
| { type: "SEND_AGENT_MESSAGE"; text: string; context?: { candidateId?: string } }
| { type: "FAIL_AGENT_STEP"; stepId: string; error: string }
| { type: "RETRY_AGENT_STEP"; stepId: string }
```

The reducer calls `parseAgentIntent`. `ScopeRun` appends an acknowledgement; the candidate intents are wired in Task 6; `Unsupported` appends: `This deterministic demo can handle the suggested campaign actions; it does not call a general-purpose model.`

`FAIL_AGENT_STEP` marks only the selected Step Failed, sets the Run Failed, and appends an Exception message whose `payloadRef` is the Step ID. `ExceptionCard` exposes Retry; `RETRY_AGENT_STEP` changes that Step back to Running, clears its error, and restores the Run to Running without changing completed Steps or Artifacts. Extend `agentWorkflow.test.ts` with:

```ts
it("retries only the failed step", () => {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "FAIL_AGENT_STEP", stepId: "step-source", error: "Simulated provider timeout" });
  expect(state.agent.steps.find((item) => item.id === "step-source")?.status).toBe("Failed");
  state = campaignReducer(state, { type: "RETRY_AGENT_STEP", stepId: "step-source" });
  expect(state.agent.steps.find((item) => item.id === "step-source")?.status).toBe("Running");
  expect(state.agent.steps.find((item) => item.id === "step-read")?.status).toBe("Succeeded");
});
```

- [ ] **Step 6: Integrate the timeline into Campaign Desk**

`CampaignDeskPage` renders the timeline between the Campaign rail and Context region, keeps the Composer fixed to the bottom of the center column, and auto-labels the header from the active Run status.

- [ ] **Step 7: Verify intent, workflow, and production build**

Run: `npm test -- src/tests/agentIntent.test.ts src/tests/agentWorkflow.test.ts src/tests/agentShell.test.tsx && npm run build`

Expected: all selected tests and build pass.

- [ ] **Step 8: Commit**

```bash
git add src/agent/intent.ts src/components/agent src/pages/CampaignDeskPage.tsx src/app/campaignReducer.ts src/styles.css src/tests/agentIntent.test.ts
git commit -m "feat: render bounded agent plans and decisions"
```

---

### Task 5: Add Artifact Context Rail and preserve deep Matrix interaction

**Files:**
- Create: `src/components/agent/ContextRail.tsx`
- Create: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/components/MatrixTable.tsx`
- Modify: `src/components/MatrixRowDrawer.tsx`
- Modify: `src/components/ConstraintPanel.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/styles.css`
- Test: `src/tests/agentMatrixFlow.test.ts`

**Interfaces:**
- Consumes: existing `summarizeMatrix()`, `evaluateMatrix()`, `lockMatrix()`, `generateSearchPackages()`, and Agent Artifact helpers.
- Produces: `GENERATE_MIX_OPTIONS`, Agent-aware `SELECT_SCENARIO`, `UPDATE_MATRIX_ROW`, `RESTORE_SCENARIO`, `LOCK_MATRIX`, `GENERATE_PACKAGES`, and responsive Brief/Mix/SearchPackageSet inspectors.

- [ ] **Step 1: Write the failing Agent Matrix test**

```ts
import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachMix(state = structuredClone(campaignSeed)) {
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  return campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
}

describe("Agent Matrix artifact", () => {
  it("blocks an invalid lock, restores the mix, then records locked downstream artifacts", () => {
    let state = reachMix();
    expect(state.agent.messages.at(-1)?.text).toContain("two creator mix options");

    state = campaignReducer(state, { type: "SIMULATE_LONG_FORM_GAP", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    expect(state.matrixScenarios[0].status).toBe("Draft");
    expect(state.agent.messages.at(-1)?.type).toBe("Exception");

    state = campaignReducer(state, { type: "RESTORE_SCENARIO", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "Mix", status: "Locked" }));

    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "SearchPackageSet", parentArtifactIds: ["artifact-mix-v1"] }));
  });
});
```

- [ ] **Step 2: Run and verify the failure**

Run: `npm test -- src/tests/agentMatrixFlow.test.ts`

Expected: FAIL because Matrix actions do not register Agent messages/artifacts and invalid lock currently throws.

- [ ] **Step 3: Add Agent-aware Matrix orchestration**

Add `GENERATE_MIX_OPTIONS`. It marks `step-mix` Running and appends a `NextAction` message referencing `compare-mix`.

Wrap `LOCK_MATRIX` with `evaluateMatrix()`. If any result is `fail`, do not call `lockMatrix`; append an Exception message with payload `matrix-constraint-failure`. If valid, lock it and register:

```ts
{
  id: "artifact-mix-v1",
  kind: "Mix",
  version: 1,
  status: "Locked",
  sourceRunId: "run-brief-to-shortlist",
  sourceStepId: "step-mix",
  parentArtifactIds: ["artifact-brief-v1"],
  domainRef: "scenario-a",
  summary: "Creator Mix v1 locked · $172K · 2.75M views · 4 long-form creators",
  campaignId: state.id,
  createdAt: "2026-09-21T09:35:00+08:00",
}
```

`GENERATE_PACKAGES` registers `artifact-search-packages-v1` whose parent is `artifact-mix-v1`, marks step-mix Succeeded and step-source Running, and appends a RunGroup message.

- [ ] **Step 4: Implement Context Rail**

`ContextRail` has two fixed sections: Artifacts and Decisions. Artifacts sort by creation time and show kind, version, status, parent count, and Open. Decisions show unresolved first, then resolved compactly. Do not add tabs for old modules.

- [ ] **Step 5: Implement Artifact Inspector dispatcher**

```tsx
export function ArtifactInspector({ artifact }: { artifact: CampaignArtifact }) {
  if (artifact.kind === "Brief") return <BriefArtifactDetail />;
  if (artifact.kind === "Mix") return <MixArtifactDetail scenarioId={artifact.domainRef} />;
  if (artifact.kind === "SearchPackageSet") return <SearchPackageSetDetail />;
  if (artifact.kind === "CandidateBatch") return <CandidateBatchDetail artifact={artifact} />;
  if (artifact.kind === "ReviewRound") return <ReviewRoundDetail />;
  return <GapArtifactDetail />;
}
```

Brief detail reuses existing source/conflict presentation but has no publish action. Mix detail reuses `MetricCard`, `MatrixTable`, `ConstraintPanel`, and `MatrixRowDrawer`. SearchPackageSet shows the six bounded packages.

- [ ] **Step 6: Make Inspector and Agent stream coexist**

When `selectedArtifactId` is set, add `has-inspector` to the desk. Desktop CSS changes center/right proportions rather than navigating:

```css
.campaign-desk.has-inspector { grid-template-columns: 210px minmax(390px, .8fr) minmax(520px, 1.2fr); }
.artifact-inspector { height: 100vh; overflow-y: auto; border-left: 1px solid var(--line); background: var(--paper); }
```

On small screens, Inspector becomes a full-screen sheet with a close button and restores scroll position on close.

- [ ] **Step 7: Run Matrix, workflow, and build verification**

Run: `npm test -- src/tests/agentMatrixFlow.test.ts src/tests/matrix.test.ts src/tests/matrixFlow.test.ts src/tests/agentWorkflow.test.ts && npm run build`

Expected: Agent and legacy Matrix tests pass; production build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/agent/ContextRail.tsx src/components/agent/ArtifactInspector.tsx src/components/MatrixTable.tsx src/components/MatrixRowDrawer.tsx src/components/ConstraintPanel.tsx src/pages/CampaignDeskPage.tsx src/app/campaignReducer.ts src/styles.css src/tests/agentMatrixFlow.test.ts
git commit -m "feat: inspect matrix artifacts beside agent runs"
```

---

### Task 6: Implement calibration batches, reason feedback, and candidate explanations

**Files:**
- Create: `src/agent/calibration.ts`
- Create: `src/components/agent/CandidateBatchDetail.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/components/CandidateDrawer.tsx`
- Modify: `src/agent/intent.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/styles.css`
- Test: `src/tests/calibrationFlow.test.ts`

**Interfaces:**
- Consumes: `qualifyCandidate()`, `candidateScore()`, generated Search Packages, and the 42 seeded candidates.
- Produces: `buildCalibrationBatch()`, `preferenceForReason()`, actions `START_SOURCING`, `REJECT_CALIBRATION_CANDIDATE`, `APPROVE_CALIBRATION`, and deterministic Explain/FindSimilar replies.

- [ ] **Step 1: Write the failing calibration test**

```ts
import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";
import { buildCalibrationBatch } from "../agent/calibration";
import { generateSearchPackages } from "../domain/search";

function reachSourcing() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
  return campaignReducer(state, { type: "START_SOURCING" });
}

describe("candidate calibration", () => {
  it("delivers eight qualified examples plus two explicit failure cases", () => {
    const lockedMatrix = { ...campaignSeed.matrixScenarios[0], status: "Locked" as const, version: 1 };
    const packages = generateSearchPackages(lockedMatrix);
    const packageByCell = new Map(packages.map((item) => [item.matrixCellId, item]));
    const ids = buildCalibrationBatch(campaignSeed.candidates, packageByCell).map((item) => item.id);
    expect(ids).toHaveLength(10);
    expect(ids).toContain("creator-moto-only");
    expect(ids).toContain("creator-missing-evidence");
  });

  it("keeps rejection feedback scoped to the active campaign", () => {
    let state = reachSourcing();
    state = campaignReducer(state, { type: "REJECT_CALIBRATION_CANDIDATE", candidateId: "creator-05", reason: "Too commercial" });
    expect(state.agent.calibrationFeedback["creator-05"]).toBe("Too commercial");
    expect(state.agent.campaignPreferences).toContain("Prefer lifestyle-led cycling proof");
    expect(state.brief.proofPoints).not.toContain("Prefer lifestyle-led cycling proof");
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/tests/calibrationFlow.test.ts`

Expected: FAIL because calibration functions and actions are missing.

- [ ] **Step 3: Implement deterministic batch selection**

```ts
export function buildCalibrationBatch(candidates: CampaignCandidate[], packageByCell: Map<string, SearchPackage>) {
  const qualified = candidates
    .filter((candidate) => candidate.role !== "Unassigned")
    .filter((candidate) => qualifyCandidate(candidate, packageByCell.get(candidate.matrixCellId)!).status === "Qualified")
    .sort((a, b) => candidateScore(b).total - candidateScore(a).total)
    .slice(0, 8);
  const failureCases = ["creator-moto-only", "creator-missing-evidence"].map((id) => candidates.find((candidate) => candidate.id === id)!);
  return [...qualified, ...failureCases];
}

export function preferenceForReason(reason: string) {
  if (reason === "Too commercial") return "Prefer lifestyle-led cycling proof";
  if (reason === "Quote too high") return "Prefer candidates within Matrix cell ceiling";
  if (reason === "Style mismatch") return "Prefer natural first-person riding narratives";
  return "Require verified real-cycling evidence";
}
```

- [ ] **Step 4: Wire sourcing and calibration actions**

`START_SOURCING` executes existing package generation if required, marks `candidatesLoaded`, builds the 10-person calibration set, registers `artifact-calibration-batch-01`, completes step-source, and moves to step-calibrate WaitingForApproval.

`REJECT_CALIBRATION_CANDIDATE` writes the reason, adds a Campaign preference, and appends a Text message that states the changed preference and unchanged hard constraints.

`APPROVE_CALIBRATION` creates `artifact-client-slate-v1` with the existing 30 primaries and 10 backups, marks calibration succeeded, and moves to PublishReview.

- [ ] **Step 5: Implement Candidate Batch Inspector**

Render 10 compact cards, persistent filter counts, and the existing `CandidateDrawer`. For calibration cards add Approve, Reject, and Ask Agent. Reject opens four fixed reasons: `No real cycling`, `Too commercial`, `Quote too high`, `Style mismatch`.

`Ask Agent` supplies the active candidate ID to `SEND_AGENT_MESSAGE`. Explain replies cite evidence, qualification, risk, and Matrix cell. FindSimilar returns two deterministic candidates from the same cell ranked by score, excluding rejected candidates.

- [ ] **Step 6: Verify calibration and candidate regressions**

Run: `npm test -- src/tests/calibrationFlow.test.ts src/tests/candidate.test.ts src/tests/agentIntent.test.ts && npm run build`

Expected: all selected tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add src/agent/calibration.ts src/components/agent/CandidateBatchDetail.tsx src/components/agent/ArtifactInspector.tsx src/components/CandidateDrawer.tsx src/agent/intent.ts src/app/campaignReducer.ts src/styles.css src/tests/calibrationFlow.test.ts
git commit -m "feat: calibrate creator search through agent feedback"
```

---

### Task 7: Move client publication and gap recovery into Agent approvals

**Files:**
- Create: `src/pages/ClientPreviewPage.tsx`
- Create: `src/components/agent/ReviewRoundDetail.tsx`
- Create: `src/components/agent/GapArtifactDetail.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/components/agent/NextActionCard.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/styles.css`
- Test: `src/tests/agentReviewFlow.test.ts`

**Interfaces:**
- Consumes: `validateReviewRound()`, `toClientCandidate()`, `assessGap()`, existing Review actions, and Artifact registration.
- Produces: `PREPARE_REVIEW`, Agent-aware `PUBLISH_REVIEW`, `APPLY_SEEDED_CLIENT_FEEDBACK`, Agent-aware `PROMOTE_BACKUP`, `CREATE_REPLENISHMENT`, route `/campaigns/:campaignId/client-preview`, ReviewRound and Gap artifacts.

- [ ] **Step 1: Write the failing approval-to-recovery test**

```ts
import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachApprovedCalibration() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "START_SOURCING" });
  return campaignReducer(state, { type: "APPROVE_CALIBRATION" });
}

describe("Agent client approval and recovery", () => {
  it("requires publication approval then recovers only affected cells", () => {
    let state = reachApprovedCalibration();
    state = campaignReducer(state, { type: "PREPARE_REVIEW" });
    expect(state.agent.runs[0].status).toBe("WaitingForApproval");
    expect(state.agent.messages.at(-1)?.text).toContain("30 client candidates");

    state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "ReviewRound", status: "Published" }));

    state = campaignReducer(state, { type: "APPLY_SEEDED_CLIENT_FEEDBACK" });
    expect(state.agent.artifacts).toContainEqual(expect.objectContaining({ kind: "GapAssessment" }));
    expect(state.gapAssessment?.recommendedAction).toBe("Promote Backup");

    const unaffected = state.agent.artifacts.filter((item) => item.kind === "Brief" || item.kind === "Mix");
    expect(unaffected.every((item) => item.status !== "Stale")).toBe(true);
    state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
    state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });
    expect(state.searchPackages.find((item) => item.parentPackageId)?.matrixCellId).toContain("uk-urban");
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/tests/agentReviewFlow.test.ts`

Expected: FAIL because prepare/feedback actions and Agent artifacts do not exist.

- [ ] **Step 3: Implement prepare and publish approval**

`PREPARE_REVIEW` runs `validateReviewRound` against 30 primaries, 10 backups, and qualifications. On success it appends a NextAction message with `Preview client view` and `Publish Round 1`, sets step-publish Waiting, and sets Run WaitingForApproval. On failure it appends an Exception with exact validation errors.

`PUBLISH_REVIEW` reuses existing publication logic, registers `artifact-review-round-01` with parent `artifact-client-slate-v1`, marks it Published, and appends the simulated Feishu/Gmail Activity records only after approval.

- [ ] **Step 4: Build the client preview route**

`ClientPreviewPage` maps only `reviewRound.candidateIds` through `toClientCandidate()`. It must never import or render `CampaignCandidate` fields directly. Show a persistent `Client projection` label and a `Back to Agent Desk` link; no publication action exists inside the preview.

- [ ] **Step 5: Implement feedback and recovery artifacts**

`APPLY_SEEDED_CLIENT_FEEDBACK` builds decisions where UK Urban candidates are Pass and others Select, reuses existing gap calculation, registers `artifact-gap-round-01` with parent `artifact-review-round-01`, marks step-gap Succeeded, and adds a NextAction with Promote Backup.

Enhance existing `PROMOTE_BACKUP` and `CREATE_REPLENISHMENT` to append Agent messages, update only the Gap Artifact and affected SearchPackageSet relationship, complete step-recover, and finally set the Run Completed. Brief and Mix artifacts remain Locked/Published, never Stale.

- [ ] **Step 6: Add Review and Gap inspectors**

`ReviewRoundDetail` shows 30 public rows and a separate internal backup count without exposing backup identities in preview mode. `GapArtifactDetail` shows missing cells, forecast view delta, remaining budget, selected cause tags, and one primary recommendation.

- [ ] **Step 7: Verify projection, gap, and build**

Run: `npm test -- src/tests/agentReviewFlow.test.ts src/tests/projection.test.ts src/tests/reviewGap.test.ts && npm run build`

Expected: all tests pass and production build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ClientPreviewPage.tsx src/components/agent/ReviewRoundDetail.tsx src/components/agent/GapArtifactDetail.tsx src/components/agent/ArtifactInspector.tsx src/components/agent/NextActionCard.tsx src/app/App.tsx src/app/campaignReducer.ts src/styles.css src/tests/agentReviewFlow.test.ts
git commit -m "feat: approve client reviews and recover gaps in agent flow"
```

---

### Task 8: Finish Run History, persistence migration, full flow, cleanup, and Chinese walkthrough

**Files:**
- Create: `src/tests/agentDemoFlow.test.ts`
- Modify: `src/pages/RunsPage.tsx`
- Modify: `src/data/persistence.ts`
- Modify: `src/app/CampaignProvider.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`
- Delete: `src/pages/OverviewPage.tsx`
- Delete: `src/pages/BriefPage.tsx`
- Delete: `src/pages/MixPlannerPage.tsx`
- Delete: `src/pages/SearchCandidatesPage.tsx`
- Delete: `src/pages/ClientReviewPage.tsx`
- Delete: `src/pages/ActivityPage.tsx`
- Test: `src/tests/persistence.test.ts`
- Test: `src/tests/appShell.test.tsx`

**Interfaces:**
- Consumes: all Agent workflow and existing domain actions.
- Produces: a one-command deterministic Demo, safe stored-state migration, Run History, updated Chinese acceptance guide, and a feature-tab-free production build.

- [ ] **Step 1: Write the full failing Agent Demo test**

```ts
import { describe, expect, it } from "vitest";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

describe("complete campaign Agent Demo", () => {
  it("runs intake to localized recovery without feature-page navigation", () => {
    let state = structuredClone(campaignSeed);
    state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
    state = campaignReducer(state, { type: "START_AGENT_RUN" });
    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
    state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
    state = campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
    state = campaignReducer(state, { type: "START_SOURCING" });
    state = campaignReducer(state, { type: "REJECT_CALIBRATION_CANDIDATE", candidateId: "creator-05", reason: "Too commercial" });
    state = campaignReducer(state, { type: "APPROVE_CALIBRATION" });
    state = campaignReducer(state, { type: "PREPARE_REVIEW" });
    state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
    state = campaignReducer(state, { type: "APPLY_SEEDED_CLIENT_FEEDBACK" });
    state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
    state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });

    const run = state.agent.runs.find((item) => item.id === state.agent.activeRunId)!;
    expect(run.status).toBe("Completed");
    expect(state.agent.artifacts.map((item) => item.kind)).toEqual(expect.arrayContaining(["Brief", "Mix", "SearchPackageSet", "CandidateBatch", "ReviewRound", "GapAssessment"]));
    expect(state.agent.artifacts.filter((item) => item.kind === "Brief" || item.kind === "Mix").every((item) => item.status !== "Stale")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the full-flow test and fix only workflow blockers**

Run: `npm test -- src/tests/agentDemoFlow.test.ts`

Expected before final fixes: FAIL on any transition not yet setting the next step, Artifact, or final status exactly as specified. Fix those transitions without adding new features.

- [ ] **Step 3: Implement Run History**

`RunsPage` lists goal, status, current/last step, started/completed timestamps, Artifact count, and failures. Clicking a Run navigates to `/campaigns/:campaignId/runs/:runId`. Failed steps show Retry only when `error` is non-null. The default fixture remains successful; Matrix constraint failures are represented as recoverable Exception messages inside the active Run rather than invented external failures.

- [ ] **Step 4: Migrate or discard incompatible local state safely**

Increment storage key to `creator-mix-planner:v2`. Update persistence:

```ts
const STORAGE_KEY = "creator-mix-planner:v2";

export function loadState(): CampaignState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseCampaignSeed(JSON.parse(raw)) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("creator-mix-planner:v1");
}
```

Extend `persistence.test.ts` to assert v1 data does not load into the v2 shape and reset removes both keys.

- [ ] **Step 5: Remove obsolete feature pages and CSS**

Delete the six old Page files after confirming no imports remain with:

```bash
rg "OverviewPage|BriefPage|MixPlannerPage|SearchCandidatesPage|ClientReviewPage|ActivityPage" src
```

Expected before deletion: no active imports. Remove CSS selectors used only by deleted page wrappers, but retain shared Matrix, candidate, badge, metrics, drawer, and table selectors used by Artifact Inspectors.

- [ ] **Step 6: Rewrite the Chinese README walkthrough**

Replace the old six-tab walkthrough with this exact order:

1. Inbox → open `Cycling Camera Launch`.
2. Load 3 demo materials → review Plan → Run.
3. Resolve 8-week and adjacent-sports Decision Cards.
4. Open Brief v1 from Artifact rail.
5. Compare two Mix options → simulate failure → restore → lock.
6. Start sourcing → inspect 10-person Calibration Batch → reject with reason.
7. Approve calibration → preview 30 + 10 → publish Round 1.
8. Apply client feedback → promote Backup → create UK Urban replenishment.
9. Open Runs to show trace and local recovery.

State clearly that the Agent is deterministic, no online model is called, user decisions change real calculations and downstream state, and unsupported free text is intentionally bounded.

- [ ] **Step 7: Run fresh full verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected:

- all legacy domain tests and all new Agent tests pass;
- Vite production build succeeds;
- no whitespace errors;
- `rg 'Mix Planner</a>|Search & Candidates</a>|Overview</a>' src` returns no old feature navigation.

- [ ] **Step 8: Perform manual acceptance**

Run `npm run dev -- --host 127.0.0.1` and execute the nine README steps. Verify at each checkpoint:

- the primary CTA matches the current Run state;
- the Run never advances through a pending high-risk decision;
- Agent stream remains visible while inspecting Brief or Mix;
- invalid Matrix cannot lock;
- candidate explanations cite evidence;
- Client Preview excludes internal fields;
- Gap recovery keeps Brief and Mix valid;
- Reset returns to the initial intake state.

- [ ] **Step 9: Commit**

```bash
git add src README.md
git commit -m "feat: complete campaign agent desk workflow"
```

---

## Final Acceptance Checklist

- [ ] Inbox, Campaigns, and Runs are the only global work entries.
- [ ] The Campaign opens to Agent Run, not a dashboard or feature tab.
- [ ] Material analysis visibly plans before execution.
- [ ] The Agent pauses at both Brief conflicts and all external/high-risk actions.
- [ ] Brief and Mix open beside the Agent stream as Artifacts.
- [ ] Matrix formulas, invalid-state blocking, and Search Package lineage remain real.
- [ ] Calibration contains 8 qualified examples plus the two named failure cases.
- [ ] Rejection reasons update only Campaign preferences and are explained in the stream.
- [ ] Client Round 1 contains exactly 30 public candidates and 10 hidden backups.
- [ ] Client projection tests prove internal fields are absent.
- [ ] UK Urban feedback produces a Gap, promotes a matching Backup, and creates localized replenishment.
- [ ] Brief and locked Mix are not invalidated by candidate feedback.
- [ ] Unsupported Composer input discloses the deterministic Demo boundary.
- [ ] Reset, persistence v2, Run History, full tests, production build, and Chinese walkthrough are complete.
