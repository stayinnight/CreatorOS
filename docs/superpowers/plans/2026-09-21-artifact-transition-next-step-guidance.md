# Artifact Transition and Next-Step Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished artifact-opening transition, one state-derived next action, actionable Agent guidance, retired timeline actions, and a softer monochrome surface system.

**Architecture:** A pure `getRecommendedNextAction(state)` selector is the single source of truth for both Agent replies and inspector guidance. Campaign-domain transitions continue through the reducer, while a page-level `useArtifactTransition` hook owns the short visual lifecycle so animation state never enters persisted campaign data. Timeline action state is derived from the current recommendation instead of mutating historical messages.

**Tech Stack:** React 19, TypeScript 5.7, CSS, Vitest 2, React DOM test utilities; no new dependencies.

## Global Constraints

- The full opening transition lasts 450–600ms and never simulates network work.
- Under `prefers-reduced-motion`, deliberate delays, transforms, and staggers collapse to effectively zero.
- Card/inspector radius is `12px`, button/input radius is `9px`, and compact label/chip radius is `6px`.
- There is at most one recommended primary action in any seeded workflow state.
- Existing reducer actions remain the only way to mutate campaign-domain state.
- No animation phase may be persisted in `CampaignState`.
- Do not add an animation library or a generic workflow engine.

---

### Task 1: State-derived recommended action

**Files:**
- Create: `src/agent/recommendedAction.ts`
- Create: `src/tests/recommendedAction.test.ts`

**Interfaces:**
- Consumes: `CampaignState`, `evaluateMatrix`, active Matrix scenario, agent steps/artifacts, search packages, and review/gap state.
- Produces: `RecommendedAction`, `RecommendedActionId`, `getRecommendedNextAction(state)`, and `getActionLifecycle(state, actionId)`.

- [ ] **Step 1: Write the failing selector tests**

```ts
import { describe, expect, it } from "vitest";
import { getActionLifecycle, getRecommendedNextAction } from "../agent/recommendedAction";
import { campaignReducer } from "../app/campaignReducer";
import { campaignSeed } from "../data/seed";

function reachMix() {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "LOAD_DEMO_MATERIALS" });
  state = campaignReducer(state, { type: "START_AGENT_RUN" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-launch", value: "8 weeks · Excel" });
  state = campaignReducer(state, { type: "RESOLVE_AGENT_DECISION", decisionId: "decision-sports", value: "Pending; excluded from current plan" });
  return campaignReducer(state, { type: "GENERATE_MIX_OPTIONS" });
}

describe("recommended campaign action", () => {
  it("moves from Matrix lock to packages to calibration", () => {
    let state = reachMix();
    expect(getRecommendedNextAction(state)?.id).toBe("lock-matrix");
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("generate-packages");
    state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("start-calibration");
  });

  it("replaces lock with constraint review when the Matrix fails", () => {
    let state = reachMix();
    state = campaignReducer(state, { type: "SIMULATE_LONG_FORM_GAP", scenarioId: state.activeScenarioId });
    expect(getRecommendedNextAction(state)?.id).toBe("review-matrix");
  });

  it("retires actions after their transition", () => {
    let state = reachMix();
    state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: state.activeScenarioId });
    expect(getActionLifecycle(state, "lock-matrix")).toBe("Completed");
    expect(getActionLifecycle(state, "generate-packages")).toBe("Current");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tests/recommendedAction.test.ts`

Expected: FAIL because `../agent/recommendedAction` does not exist.

- [ ] **Step 3: Implement the pure selector and lifecycle helper**

Create the following focused types and return state-specific descriptors; keep command identifiers UI-neutral:

```ts
export type RecommendedActionId =
  | "resolve-brief" | "build-mix" | "review-matrix" | "lock-matrix"
  | "generate-packages" | "start-calibration" | "review-calibration"
  | "validate-slate" | "preview-client" | "recover-gap" | "view-result";

export interface RecommendedAction {
  id: RecommendedActionId;
  stage: string;
  title: string;
  reason: string;
  outcome: string;
  label: string;
  command: { kind: "dispatch"; action: CampaignAction }
    | { kind: "open"; artifactId: string }
    | { kind: "navigate"; to: string }
    | { kind: "focus"; targetId: string };
}

export type ActionLifecycle = "Current" | "Completed" | "Superseded";

function action(
  id: RecommendedActionId,
  stage: string,
  title: string,
  reason: string,
  outcome: string,
  label: string,
  command: RecommendedAction["command"],
): RecommendedAction {
  return { id, stage, title, reason, outcome, label, command };
}

export function getRecommendedNextAction(state: CampaignState): RecommendedAction | null {
  if (!state.agent.activeRunId && state.agent.artifacts.length === 0) return null;
  const pendingDecision = state.agent.decisions.find((item) => item.status === "Pending");
  if (pendingDecision) return action("resolve-brief", "Brief decision", "Resolve the open Brief decision", "A high-impact conflict still needs your choice.", "Publishes a source-linked Brief after all decisions are resolved.", "Review decision", { kind: "focus", targetId: `decision-${pendingDecision.id}` });

  const mixArtifact = state.agent.artifacts.find((item) => item.kind === "Mix");
  if (!mixArtifact) return action("build-mix", "Brief ready", "Build two creator mix options", "The Brief is published and ready for planning.", "Creates two constraint-aware Matrix options.", "Build mix options", { kind: "dispatch", action: { type: "GENERATE_MIX_OPTIONS" } });

  const scenario = state.matrixScenarios.find((item) => item.id === state.activeScenarioId)!;
  const failures = evaluateMatrix(scenario.rows, state.brief).filter((item) => item.status === "fail");
  if (scenario.status !== "Locked") return failures.length
    ? action("review-matrix", "Matrix blocked", "Review failing Matrix cells", `${failures.length} constraint checks are failing.`, "Fixes the allocation before it becomes a sourcing contract.", "Review constraints", { kind: "focus", targetId: "matrix-review" })
    : action("lock-matrix", "Mix ready", "Lock the selected Matrix", "All hard constraints are passing.", "Creates Mix v1 and freezes the sourcing allocation.", "Lock Matrix", { kind: "dispatch", action: { type: "LOCK_MATRIX", scenarioId: scenario.id } });

  if (!state.searchPackages.length) return action("generate-packages", "Matrix locked", "Generate bounded search packages", "The approved mix is now the sourcing contract.", "Creates six packages and unlocks calibration.", "Generate search packages", { kind: "dispatch", action: { type: "GENERATE_PACKAGES", scenarioId: scenario.id } });
  const calibration = state.agent.artifacts.find((item) => item.domainRef === "calibration-batch-01");
  if (!calibration) return action("start-calibration", "Packages ready", "Start the 10-person calibration", "The bounded searches are ready for a quality sample.", "Builds eight qualified examples and two visible failure cases.", "Start calibration", { kind: "dispatch", action: { type: "START_SOURCING" } });
  const calibrateStep = state.agent.steps.find((item) => item.kind === "Calibrate");
  if (calibrateStep?.status === "Waiting") return action("review-calibration", "Calibration waiting", "Review the calibration batch", "The Agent needs your quality direction before scaling.", "Applies your feedback before the 30 + 10 slate is prepared.", "Review calibration", { kind: "open", artifactId: calibration.id });
  const publishStep = state.agent.steps.find((item) => item.kind === "PublishReview");
  if (!state.reviewRound && publishStep?.status !== "Waiting") return action("validate-slate", "Direction approved", "Validate the 30 + 10 slate", "Calibration is approved.", "Checks projection safety and protects ten internal backups.", "Validate slate", { kind: "dispatch", action: { type: "PREPARE_REVIEW" } });
  if (!state.reviewRound || state.reviewRound.status === "Draft") return action("preview-client", "Slate ready", "Preview the client view", "The slate is projection-safe.", "Lets you inspect the client-safe view before publication.", "Preview client view", { kind: "navigate", to: `/campaigns/${state.id}/client-preview` });
  const gap = state.agent.artifacts.find((item) => item.kind === "GapAssessment");
  if (gap) return action("recover-gap", "Local gap found", "Recover the affected Matrix cell", "Client feedback created a bounded coverage gap.", "Promotes a backup or replenishes only the affected package.", "Open gap recovery", { kind: "open", artifactId: gap.id });
  const result = [...state.agent.artifacts].reverse().find((item) => item.status !== "Stale");
  return result ? action("view-result", "Run complete", "View the latest result", "The current run has no pending approval.", "Opens the latest retained artifact.", "View result", { kind: "open", artifactId: result.id }) : null;
}

export function getActionLifecycle(state: CampaignState, id: RecommendedActionId): ActionLifecycle {
  const current = getRecommendedNextAction(state);
  if (current?.id === id) return "Current";
  const completed: Partial<Record<RecommendedActionId, boolean>> = {
    "resolve-brief": state.agent.decisions.length > 0 && state.agent.decisions.every((item) => item.status === "Resolved"),
    "build-mix": state.agent.artifacts.some((item) => item.kind === "Mix"),
    "lock-matrix": state.matrixScenarios.some((item) => item.status === "Locked"),
    "generate-packages": state.searchPackages.length > 0,
    "start-calibration": state.agent.artifacts.some((item) => item.domainRef === "calibration-batch-01"),
    "review-calibration": state.agent.steps.some((item) => item.kind === "Calibrate" && item.status === "Succeeded"),
    "validate-slate": state.agent.steps.some((item) => item.kind === "PublishReview" && item.status === "Waiting"),
    "preview-client": Boolean(state.reviewRound),
    "recover-gap": state.agent.steps.some((item) => item.kind === "RecoverGap" && item.status === "Succeeded"),
  };
  return completed[id] ? "Completed" : "Superseded";
}
```

Implement each row from the approved spec. Return `null` only when there is no active run and no meaningful result to open.

- [ ] **Step 4: Run selector tests**

Run: `npm test -- src/tests/recommendedAction.test.ts`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/agent/recommendedAction.ts src/tests/recommendedAction.test.ts
git commit -m "feat: derive the next campaign action"
```

---

### Task 2: Actionable Agent answers and historical action retirement

**Files:**
- Modify: `src/agent/intent.ts`
- Modify: `src/agent/model.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Modify: `src/components/agent/NextActionCard.tsx`
- Create: `src/components/agent/ProgressCard.tsx`
- Create: `src/tests/agentGuidance.test.ts`

**Interfaces:**
- Consumes: `getRecommendedNextAction`, `getActionLifecycle`, existing `CampaignAction` dispatches.
- Produces: separate `NextStep` and `Status` intents, actionable state-derived messages, and lifecycle-aware cards.

- [ ] **Step 1: Write failing reducer tests for next-step and progress answers**

```ts
it("answers next-step questions with the current executable action", () => {
  let state = reachPackages();
  state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步做什么" });
  expect(state.agent.messages.at(-1)).toEqual(expect.objectContaining({
    type: "NextAction",
    payloadRef: "recommended:start-calibration",
  }));
});

it("answers current progress with structured progress", () => {
  let state = reachPackages();
  state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "当前进度" });
  expect(state.agent.messages.at(-1)).toEqual(expect.objectContaining({
    type: "Progress",
    payloadRef: "recommended:start-calibration",
  }));
});

it("does not append duplicate next-action answers", () => {
  let state = reachPackages();
  state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步" });
  state = campaignReducer(state, { type: "SEND_AGENT_MESSAGE", text: "下一步做什么" });
  expect(state.agent.messages.filter((message) => message.payloadRef === "recommended:start-calibration")).toHaveLength(1);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tests/agentGuidance.test.ts`

Expected: FAIL because next-step requests still produce generic `Text` messages and `Progress` is not a message type.

- [ ] **Step 3: Separate next-step intent from status intent**

Extend `AgentIntent` with `{ type: "NextStep" }`. Match `/下一步|next step|what next/` before `/进度|status/`, so the requests cannot collapse into one generic branch.

- [ ] **Step 4: Produce structured messages without duplicates**

Add `"Progress"` to `AgentMessageType`. In `SEND_AGENT_MESSAGE`, resolve the current action once:

```ts
const next = getRecommendedNextAction(state);
const payloadRef = next ? `recommended:${next.id}` : null;

if (intent.type === "NextStep" && next) {
  const alreadyShown = state.agent.messages.some((message) =>
    message.type === "NextAction" && message.payloadRef === payloadRef);
  const messages = [...state.agent.messages, userMessage];
  if (!alreadyShown) messages.push({ ...agentBase, type: "NextAction", text: next.reason, payloadRef });
  return { ...state, agent: { ...state.agent, messages } };
}

if (intent.type === "Status") {
  return { ...state, agent: { ...state.agent, messages: [...state.agent.messages, userMessage, {
    ...agentBase,
    type: "Progress",
    text: next?.stage ?? "Run complete",
    payloadRef,
  }] } };
}
```

- [ ] **Step 5: Render progress and retire stale action cards**

`ProgressCard` computes succeeded/total steps for the active run and shows the current stage plus next label. `AgentTimeline` parses `recommended:<id>`, derives lifecycle, and passes it to `NextActionCard`. The card API becomes:

```ts
export function NextActionCard(props: {
  message: AgentMessage;
  lifecycle: "Current" | "Completed" | "Superseded";
  onAction?: () => void;
  actionLabel?: string;
  busy?: boolean;
})
```

Only `Current` renders an enabled primary action. Completed/superseded cards render a small status label and no button.

Normalize existing seeded payloads while rendering: `generate-mix` maps to `build-mix`, `compare-mix` remains an artifact-open affordance while `lock-matrix` or `review-matrix` is current, `prepare-review` maps to `validate-slate`, and `publish-review` maps to `preview-client`. When multiple historical cards map to the same current action, only the last matching message is `Current`; earlier duplicates are `Superseded`.

- [ ] **Step 6: Run guidance tests and existing intent tests**

Run: `npm test -- src/tests/agentGuidance.test.ts src/tests/agentIntent.test.ts src/tests/agentIntentContext.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/agent/intent.ts src/agent/model.ts src/app/campaignReducer.ts src/components/agent/AgentTimeline.tsx src/components/agent/NextActionCard.tsx src/components/agent/ProgressCard.tsx src/tests/agentGuidance.test.ts
git commit -m "feat: make agent guidance actionable"
```

---

### Task 3: Shared execution and inspector next-step panel

**Files:**
- Create: `src/agent/executeRecommendedAction.ts`
- Create: `src/components/agent/RecommendedNextStep.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Create: `src/tests/recommendedNextStep.test.tsx`

**Interfaces:**
- Consumes: `RecommendedAction`, campaign dispatch, artifact-open callback, router navigation.
- Produces: `executeRecommendedAction(action, controls)` and `RecommendedNextStep` shared by Inspector and timeline.

- [ ] **Step 1: Write failing rendering/execution tests**

```tsx
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
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tests/recommendedNextStep.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement one command executor**

```ts
interface ActionControls {
  dispatch: Dispatch<CampaignAction>;
  openArtifact: (artifactId: string) => void;
  navigate: (to: string) => void;
}

export function executeRecommendedAction(action: RecommendedAction, controls: ActionControls) {
  if (action.command.kind === "open") return controls.openArtifact(action.command.artifactId);
  if (action.command.kind === "navigate") return controls.navigate(action.command.to);
  if (action.command.kind === "focus") {
    document.getElementById(action.command.targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  controls.dispatch(action.command.action);
}
```

- [ ] **Step 4: Build the shared recommendation panel**

Render the stage eyebrow, title, reason, outcome, and exactly one primary button. Use `aria-live="polite"` on the changing description and accept `busy` to disable the button.

- [ ] **Step 5: Place the panel below the inspector header**

`ArtifactInspector` calls `getRecommendedNextAction(state)` and renders the panel when the action is relevant to the visible artifact. Remove `Lock Matrix` and `Generate search packages` from `.planner-actions`; leave `Test failure` and `Restore` as utilities. Add `id="matrix-review"` to the Matrix/constraint region for the failure focus command.

- [ ] **Step 6: Route timeline recommendations through the same executor**

Remove the payload-specific nested ternary in `AgentTimeline`. Parse stable `recommended:<id>` references, resolve the current descriptor, and execute it with the same helper used by the inspector.

- [ ] **Step 7: Run component and Matrix flow tests**

Run: `npm test -- src/tests/recommendedNextStep.test.tsx src/tests/agentMatrixFlow.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/agent/executeRecommendedAction.ts src/components/agent/RecommendedNextStep.tsx src/components/agent/ArtifactInspector.tsx src/components/agent/AgentTimeline.tsx src/tests/recommendedNextStep.test.tsx
git commit -m "feat: guide each artifact to one next step"
```

---

### Task 4: Artifact opening lifecycle and motion-safe transition

**Files:**
- Create: `src/components/agent/useArtifactTransition.ts`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Modify: `src/components/agent/NextActionCard.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Create: `src/tests/artifactTransition.test.tsx`

**Interfaces:**
- Consumes: current selected artifact id and `OPEN_ARTIFACT` / `CLOSE_ARTIFACT` dispatches.
- Produces: `openArtifact`, `closeArtifact`, `openingArtifactId`, `phase`, `visibleArtifactId`, and duplicate-click protection.

- [ ] **Step 1: Write failing fake-timer lifecycle tests**

Use a small harness with `createRoot`, React `act`, and `vi.useFakeTimers()`:

```tsx
it("shows opening immediately and dispatches once after the shell enters", () => {
  const dispatch = vi.fn();
  renderHarness({ dispatch, reducedMotion: false });
  click("Open comparison");
  click("Opening comparison…");
  expect(screenButton().getAttribute("aria-busy")).toBe("true");
  expect(dispatch).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(260));
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({ type: "OPEN_ARTIFACT", artifactId: "artifact-mix-draft" });
});

it("opens immediately when reduced motion is requested", () => {
  const dispatch = vi.fn();
  renderHarness({ dispatch, reducedMotion: true });
  click("Open comparison");
  expect(dispatch).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tests/artifactTransition.test.tsx`

Expected: FAIL because `useArtifactTransition` does not exist.

- [ ] **Step 3: Implement the UI-only transition hook**

```ts
export type ArtifactTransitionPhase = "idle" | "opening" | "ready" | "closing";

export function useArtifactTransition(selectedArtifactId: string | null, dispatch: Dispatch<CampaignAction>) {
  const [openingArtifactId, setOpeningArtifactId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ArtifactTransitionPhase>(selectedArtifactId ? "ready" : "idle");
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);

  const openArtifact = useCallback((artifactId: string) => {
    if (pendingRef.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    pendingRef.current = artifactId;
    setOpeningArtifactId(artifactId);
    setPhase("opening");
    if (reduced) {
      dispatch({ type: "OPEN_ARTIFACT", artifactId });
      pendingRef.current = null;
      setOpeningArtifactId(null);
      setPhase("ready");
      return;
    }
    timerRef.current = window.setTimeout(() => {
      dispatch({ type: "OPEN_ARTIFACT", artifactId });
      pendingRef.current = null;
      setOpeningArtifactId(null);
      setPhase("ready");
    }, 260);
  }, [dispatch]);

  const closeArtifact = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    pendingRef.current = null;
    setOpeningArtifactId(null);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      dispatch({ type: "CLOSE_ARTIFACT" });
      setPhase("idle");
      return;
    }
    setPhase("closing");
    timerRef.current = window.setTimeout(() => {
      dispatch({ type: "CLOSE_ARTIFACT" });
      setPhase("idle");
    }, 180);
  }, [dispatch]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  return { openArtifact, closeArtifact, openingArtifactId, phase };
}
```

- [ ] **Step 4: Keep the shell mounted during opening and closing**

`CampaignDeskPage` treats `phase !== "idle"` as inspector-visible, renders a skeleton when there is an opening id but no selected artifact, and passes `openArtifact` through `AgentTimeline`. `ArtifactInspector` accepts `phase` and `onClose` instead of dispatching close directly. Apply a stable `key` to the content region for crossfades when switching artifacts.

After the opening dispatch, focus the inspector heading through a ref with `tabIndex={-1}`. Do not trap focus. When switching from one selected artifact to another, keep the shell mounted and apply the crossfade only to the keyed content region.

- [ ] **Step 5: Add busy feedback to the clicked timeline action**

When `openingArtifactId` matches the recommendation's target artifact, render `Opening comparison…`, set `aria-busy="true"`, show the existing spinner motif, and disable the button.

- [ ] **Step 6: Run transition and shell tests**

Run: `npm test -- src/tests/artifactTransition.test.tsx src/tests/agentShell.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/agent/useArtifactTransition.ts src/pages/CampaignDeskPage.tsx src/components/agent/AgentTimeline.tsx src/components/agent/NextActionCard.tsx src/components/agent/ArtifactInspector.tsx src/tests/artifactTransition.test.tsx
git commit -m "feat: animate artifact inspector transitions"
```

---

### Task 5: Rounded monochrome visual hierarchy

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/motion.css`
- Modify: `src/styles.css`
- Modify: `src/tests/monochromeShell.test.tsx`

**Interfaces:**
- Consumes: new classes from `RecommendedNextStep`, `ProgressCard`, transition phases, and existing monochrome shell.
- Produces: shared radius/elevation tokens, panel layout, skeletons, enter/exit motion, and hover/press behavior.

- [ ] **Step 1: Extend the shell contract test**

Read the CSS files in the test and assert the approved tokens/classes exist:

```ts
expect(tokens).toContain("--radius-surface: 12px");
expect(tokens).toContain("--radius-control: 9px");
expect(tokens).toContain("--radius-compact: 6px");
expect(styles).toContain(".recommended-next-step");
expect(motion).toContain(".artifact-inspector.is-opening");
expect(motion).toContain("prefers-reduced-motion: reduce");
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tests/monochromeShell.test.tsx`

Expected: FAIL because the new tokens and motion classes are absent.

- [ ] **Step 3: Add the radius and elevation tokens**

```css
:root {
  --radius-surface: 12px;
  --radius-control: 9px;
  --radius-compact: 6px;
  --shadow-rest: 0 8px 24px rgba(10, 10, 10, .06);
  --shadow-hover: 0 12px 30px rgba(10, 10, 10, .1);
  --motion-standard: cubic-bezier(.2, .8, .2, 1);
}
```

Replace the monochrome override's blanket 2px radii with the correct semantic token. Keep run status as a pill.

- [ ] **Step 4: Style recommendation, progress, skeleton, and retired actions**

The recommendation panel is sticky below the inspector header, has clear current/reason/outcome hierarchy, and keeps one high-contrast primary button. Retired cards use neutral gray, an explicit lifecycle label, and no hover lift. Skeleton blocks use a subtle monochrome shimmer.

- [ ] **Step 5: Implement motion classes**

```css
.campaign-desk { transition: grid-template-columns 280ms var(--motion-standard); }
.artifact-inspector.is-opening { animation: inspector-enter 240ms var(--motion-standard) both; }
.inspector-content { animation: inspector-content-enter 180ms ease-out both; }
.interactive-surface { transition: transform 140ms ease, box-shadow 140ms ease; }
.interactive-surface:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
.interactive-surface:active { transform: translateY(0); }
```

Preserve the existing reduced-motion override and ensure it covers transitions and skeleton animation.

- [ ] **Step 6: Run visual contract tests**

Run: `npm test -- src/tests/monochromeShell.test.tsx src/tests/artifactTransition.test.tsx src/tests/recommendedNextStep.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/styles/tokens.css src/styles/motion.css src/styles.css src/tests/monochromeShell.test.tsx
git commit -m "style: soften the monochrome agent workspace"
```

---

### Task 6: Workflow regression and production verification

**Files:**
- Modify only if verification exposes a defect in files already listed above.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a verified end-to-end demo flow with no stale actions or ambiguous next step.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all test files and tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Check patch hygiene**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 4: Manually verify the Chinese demo path**

Run: `npm run dev -- --host 127.0.0.1` and verify:

1. 完成 Brief 冲突处理并生成两个 Mix。
2. 点击 `Open comparison`，按钮立即显示 opening，Inspector 平滑进入且无空白闪烁。
3. 检查约束后锁定 Matrix；顶部推荐动作切换为生成 Search Packages。
4. 生成 packages；推荐动作切换为开始 10 人校准。
5. 回到 Agent 输入 `下一步做什么`；只出现一张可执行卡，点击进入 calibration。
6. 输入 `当前进度`；显示完成数、当前阶段和下一动作，而不是单独的 `Running`。
7. 回看旧动作；全部标为 Completed/Superseded 且无法再次点击。
8. 检查卡片 12px、按钮 9px、标签 6px 的圆角层级以及 hover/press 反馈。

- [ ] **Step 5: Commit any verification-only correction**

If Step 1–4 required a code correction, commit only that focused fix:

```bash
git add src/agent src/app src/components/agent src/pages src/styles.css src/styles src/tests
git commit -m "fix: close guided workflow regression"
```

If no correction was needed, do not create an empty commit.
