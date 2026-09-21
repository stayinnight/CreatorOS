# Agent Interaction and Monochrome Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deterministic Campaign Agent context-aware and stateful, add a visible but honest processing lifecycle, and replace the small colorful interface with a readable monochrome editorial workspace.

**Architecture:** Keep `campaignReducer` as the source of persisted domain truth. Add pure intent/fact/run-revision modules, while a small UI-only turn controller stages user input, working feedback, and the final reducer action. Generate Composer actions from Run/Artifact/Candidate context so every visible shortcut is executable.

**Tech Stack:** React 18, TypeScript, React Router, CSS, Vitest, Testing Library server rendering, Zod persistence.

## Global Constraints

- The Agent remains deterministic and does not call an online model.
- Every answer must either query current `CampaignState`, mutate real workflow state, or explain the current blocking condition.
- A scoped Brief Run completes after Brief publication and never emits a Mix CTA.
- UI-only working/reveal state is transient and must not enter localStorage.
- Use only black, white, and gray for structural UI; do not use blue, green, amber, or red status colors.
- Body/input text is 14–16px, controls are 14px, and auxiliary labels are at least 12px.
- Motion uses transform/opacity, lasts under 800ms per turn, and is disabled by `prefers-reduced-motion`.
- Preserve all existing Matrix, candidate qualification, client projection, gap recovery, and persistence behavior.

---

### Task 1: Context-aware intent resolution and state-derived fact answers

**Files:**
- Modify: `src/agent/intent.ts`
- Create: `src/agent/actions.ts`
- Create: `src/agent/facts.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/components/agent/AgentComposer.tsx`
- Test: `src/tests/agentIntentContext.test.ts`
- Test: `src/tests/agentFacts.test.ts`

**Interfaces:**
- Produces: `resolveAgentIntent(input, context)`, `availableActions(state, context)`, and `answerCampaignFact(state, query)`.
- Consumes: `CampaignState`, active Run/Step, selected Artifact, pending Decision, and optional candidate ID.

- [ ] **Step 1: Write failing context and fact tests**

```ts
it("does not offer candidate commands without candidate context", () => {
  const actions = availableActions(campaignSeed, {});
  expect(actions.map((item) => item.label)).not.toContain("为什么推荐他");
});

it("answers fixed campaign facts from current state", () => {
  expect(answerCampaignFact(campaignSeed, "预算是多少")?.body).toContain("$180,000");
  expect(answerCampaignFact(campaignSeed, "市场有哪些")?.body).toContain("US + UK");
});

it("returns stage-specific fallback suggestions", () => {
  const result = resolveAgentIntent("随便帮我做点什么", { state: campaignSeed });
  expect(result.available).toBe(false);
  expect(result.suggestions).toContain("分析 3 份材料");
});
```

- [ ] **Step 2: Run the new tests and verify failure**

Run: `npm test -- src/tests/agentIntentContext.test.ts src/tests/agentFacts.test.ts`  
Expected: FAIL because the three exported functions do not exist.

- [ ] **Step 3: Implement normalized, context-aware resolution**

Define:

```ts
export interface AgentIntentContext {
  state: CampaignState;
  candidateId?: string;
}

export interface IntentResolution {
  intent: AgentIntent;
  confidence: "Exact" | "Alias" | "Fallback";
  requiredContext: "None" | "Candidate" | "Artifact" | "Decision";
  available: boolean;
  suggestions: string[];
}
```

Normalize whitespace, Chinese punctuation, and lowercase English. Add intents for Campaign facts, status, next action, opening artifacts, adopting the active recommendation, resuming the complete plan, and all existing stage actions. Missing context returns `available: false` with current-stage suggestions.

- [ ] **Step 4: Implement `availableActions` and `answerCampaignFact`**

`availableActions` returns at most four `{ id, label, input, candidateId? }` actions. Candidate actions require `candidateId`; Decision actions require a pending Decision. `answerCampaignFact` reads Brief, Matrix summaries, Search Packages, Review Round, and Gap Assessment from the supplied state and returns `{ title, body, rows? }`.

- [ ] **Step 5: Route Composer chips and fallback responses through the new modules**

Remove the fixed `suggestions` constant. Pass the optional candidate ID through `SEND_AGENT_MESSAGE`. Replace the English unsupported response with a Chinese status-aware response and actionable suggestions.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/tests/agentIntent.test.ts src/tests/agentIntentContext.test.ts src/tests/agentFacts.test.ts && npm run build`  
Expected: all selected tests and build pass.

```bash
git add src/agent src/app/campaignReducer.ts src/components/agent/AgentComposer.tsx src/tests
git commit -m "feat: make agent intents context aware"
```

---

### Task 2: Real Run revision and continuation after a Brief-only scope

**Files:**
- Create: `src/agent/runRevision.ts`
- Modify: `src/agent/model.ts`
- Modify: `src/agent/workflow.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/components/agent/PlanCard.tsx`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Test: `src/tests/agentScopeRevision.test.ts`

**Interfaces:**
- Produces: `reviseRunToBriefOnly(agent)`, `completeScopedBriefRun(agent)`, `continueFromBrief(agent, briefArtifactId)`.
- Consumes: active `AgentRun`, its `RunStep[]`, and the published Brief Artifact.

- [ ] **Step 1: Write the screenshot regression test**

```ts
it("revises an active run and stops after publishing Brief", () => {
  let state = reachFirstBriefDecision();
  state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "先只整理 Brief" });
  const run = state.agent.runs[0];
  expect(run.goal).toContain("Brief v1");
  expect(state.agent.steps.find((step) => step.id === "step-mix")?.status).toBe("Skipped");
  expect(state.agent.messages.at(-1)?.type).toBe("Plan");

  state = resolveBothDecisions(state);
  expect(state.agent.runs[0].status).toBe("Completed");
  expect(state.agent.messages.some((message) => message.payloadRef === "generate-mix")).toBe(false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/tests/agentScopeRevision.test.ts`  
Expected: FAIL because the command only appends acknowledgement text.

- [ ] **Step 3: Add explicit Run scope and Plan revision metadata**

Extend `AgentRun` with `scope: "FullCampaign" | "BriefOnly"` and `continuationOfRunId: string | null`. Extend Plan messages with an optional `variant: "Initial" | "Revised"` field in their referenced payload model; do not infer revision from display text.

- [ ] **Step 4: Implement pure revision functions**

`reviseRunToBriefOnly` preserves completed/active Brief steps, marks all later steps `Skipped`, changes the goal, and appends exactly one Revised Plan. A second call returns the same Agent state. `completeScopedBriefRun` marks the Run Completed after Brief publication. `continueFromBrief` creates `run-mix-to-review` with steps from `BuildMix` onward and Brief v1 as input.

- [ ] **Step 5: Integrate reducer and Plan UI**

`SEND_AGENT_MESSAGE` applies the revision when the intent is `ScopeRun`. `RESOLVE_AGENT_DECISION` branches on Run scope. `PlanCard` labels revised plans, visually distinguishes kept/current/skipped steps, and shows no Start button for an already running revision.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/tests/agentScopeRevision.test.ts src/tests/agentWorkflow.test.ts src/tests/agentDemoFlow.test.ts && npm run build`  
Expected: scoped and full Campaign flows both pass.

```bash
git add src/agent src/app/campaignReducer.ts src/components/agent src/tests/agentScopeRevision.test.ts
git commit -m "feat: revise active agent runs by scope"
```

---

### Task 3: Honest working lifecycle and staged message reveal

**Files:**
- Create: `src/components/agent/useAgentTurnController.ts`
- Create: `src/components/agent/AgentWorking.tsx`
- Modify: `src/components/agent/AgentComposer.tsx`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/styles.css`
- Test: `src/tests/agentTurnController.test.tsx`

**Interfaces:**
- Produces: `useAgentTurnController()` returning `{ busy, working, submit, cancel }`.
- Consumes: a `CampaignAction`, its stage labels, and the Campaign dispatcher.

- [ ] **Step 1: Write fake-timer tests**

```tsx
it("reveals user, working stages, then the result and blocks duplicate submit", async () => {
  vi.useFakeTimers();
  render(<AgentComposer />);
  fireEvent.click(screen.getByText("先只整理 Brief"));
  expect(screen.getByText("正在重排当前计划")).toBeVisible();
  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  await vi.advanceTimersByTimeAsync(800);
  expect(screen.queryByText("正在重排当前计划")).toBeNull();
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/tests/agentTurnController.test.tsx`  
Expected: FAIL because submission is currently synchronous and no working component exists.

- [ ] **Step 3: Implement a transient turn controller**

Immediately dispatch a user-message-only action, expose three deterministic working labels, and dispatch the resolved intent action after 500–800ms total. Store timers in refs; `cancel()` and component cleanup clear all timers. Reset calls `cancel()` before resetting persisted state.

- [ ] **Step 4: Render processing and staged results**

`AgentWorking` renders current labels with semantic `aria-live="polite"`. Disable input/chips/Send while busy. Scroll the new result into view using an element ref and `scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })`.

- [ ] **Step 5: Add motion with accessibility fallback**

Add message/revision/step/artifact keyframes using only opacity and transform. Under `@media (prefers-reduced-motion: reduce)`, set animation duration to `0.01ms`, disable smooth scroll, and have the controller commit immediately.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/tests/agentTurnController.test.tsx src/tests/agentShell.test.tsx && npm run build`  
Expected: lifecycle, busy guard, cleanup, and build pass.

```bash
git add src/components/agent src/pages/CampaignDeskPage.tsx src/styles.css src/tests/agentTurnController.test.tsx
git commit -m "feat: stage deterministic agent interactions"
```

---

### Task 4: Monochrome editorial visual system and readable workspace

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/motion.css`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Modify: `src/app/App.tsx`
- Modify: `src/components/agent/CampaignRail.tsx`
- Modify: `src/components/agent/ContextRail.tsx`
- Modify: `src/components/agent/DecisionCard.tsx`
- Modify: `src/components/agent/RunGroupCard.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/pages/InboxPage.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/pages/RunsPage.tsx`
- Modify: `src/pages/ClientPreviewPage.tsx`
- Test: `src/tests/monochromeShell.test.tsx`

**Interfaces:**
- Produces: monochrome CSS tokens, editorial type scale, and responsive three-column workspace.
- Consumes: existing semantic class names and Agent state; no domain interfaces change.

- [ ] **Step 1: Write structural visual tests**

```tsx
it("renders the editorial shell with readable semantic regions", () => {
  const html = renderToString(<MemoryRouter><App /></MemoryRouter>);
  expect(html).toContain("agent-shell monochrome-editorial");
  expect(html).toContain("aria-label=\"Work navigation\"");
});
```

Add a token-source test that reads `tokens.css` and asserts the absence of the previous `#174fe5`, `#d7f760`, `#b56a13`, and `#bd3d35` values and the presence of `--text-body: 15px` and `--text-meta: 12px`.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/tests/monochromeShell.test.tsx`  
Expected: FAIL because the class and token files do not exist.

- [ ] **Step 3: Define the visual system**

Create `tokens.css` with the exact grayscale palette and font sizes from the spec. Use a system serif stack for display headings and a system sans stack for working text. Replace colored status tokens with `--status-solid`, `--status-muted`, `--status-line`, and `--status-pattern`.

- [ ] **Step 4: Recompose the main surfaces**

Set the global rail to 208px black, Campaign rail to 240px white, Agent stream to at least 680px, and Context rail to 340px. Replace rounded colored card piles with editorial sections: thin rules, index numbers, selective black title bands, 2–6px radii, and no ambient shadow. Keep body/input at 15px, controls at 14px, metadata at 12px, cards at 18–22px, and Campaign headings at 32–48px.

- [ ] **Step 5: Preserve the Agent stream while inspecting Artifacts**

Remove the media rule that hides `.agent-stream` when `.has-inspector`. On narrower desktop widths, collapse Campaign rail to a labeled icon strip before turning Inspector into a full-screen sheet. Matrix tables may scroll horizontally inside the Inspector; the conversation must remain present.

- [ ] **Step 6: Apply monochrome state patterns**

Success uses a solid black check, Waiting uses an outlined circle, Failed uses an exclamation plus diagonal background pattern, and selected items use black fill/white text. Do not rely on hue. Ensure focus-visible outlines are 2px black/white contrast pairs.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- src/tests/monochromeShell.test.tsx src/tests/appShell.test.tsx src/tests/agentShell.test.tsx && npm run build`  
Expected: shell tests and build pass; forbidden legacy colors are absent from the new token source.

```bash
git add src/styles src/main.tsx src/styles.css src/app src/components/agent src/pages src/tests/monochromeShell.test.tsx
git commit -m "feat: redesign agent desk in monochrome editorial style"
```

---

### Task 5: Full regression, Chinese walkthrough, and acceptance

**Files:**
- Modify: `src/tests/agentDemoFlow.test.ts`
- Modify: `src/tests/agentShell.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: one deterministic end-to-end demonstration and updated acceptance instructions.

- [ ] **Step 1: Extend the end-to-end test with scope and continuation**

Add one branch that starts a Brief-only Run, completes it, asserts no Mix CTA, continues from Brief, and finishes the existing Mix → Calibration → Review → Gap recovery flow. Assert facts and dynamic actions at each phase.

- [ ] **Step 2: Update the Chinese walkthrough**

Document both paths: “只整理 Brief” and “继续完整计划”. Add expected working transitions, dynamic chips, black-and-white layout, minimum text sizing, candidate-context actions, and reduced-motion behavior.

- [ ] **Step 3: Run fresh verification**

```bash
npm test
npm run build
git diff --check
rg '#174fe5|#d7f760|#b56a13|#bd3d35' src/styles/tokens.css
```

Expected: all tests pass, build succeeds, diff check is clean, and the final `rg` command returns no matches.

- [ ] **Step 4: Manual acceptance**

Run `npm run dev -- --host 127.0.0.1`. Reproduce the supplied screenshot path and verify: dynamic actions are valid, “先只整理 Brief” creates Revised Plan, the response has working transitions, the Brief-only Run completes without Mix CTA, typography is readable, the UI is monochrome, Inspector does not hide the conversation, and Reset cancels any active turn.

- [ ] **Step 5: Commit**

```bash
git add README.md src/tests
git commit -m "test: verify robust monochrome agent workflow"
```
