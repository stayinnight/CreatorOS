# Creator Mix Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a locally runnable campaign workspace that demonstrates the cycling-camera brief-to-Matrix-to-candidate-to-client-feedback loop, with the Matrix implemented as real, tested business logic.

**Architecture:** Build a React/TypeScript/Vite single-page app around pure TypeScript domain functions and one small React state provider persisted to localStorage. Use fixed, validated seed data for the single campaign; keep Feishu and Gmail as explicit simulated activity records. No backend, auth, model, scraper, workflow engine, or generic importer is introduced.

**Implemented Tech Stack:** Node 18.18+, React 19.3, TypeScript 5.7, Vite 5.4, React Router 6.30, Zod 4, Vitest 2.1, jsdom 24, and one focused global stylesheet. These pinned versions preserve Node 18 compatibility in the provided environment.

## Global Constraints

- The twelve-hour window includes implementation, self-verification, user acceptance, and final fixes.
- Engineering implementation stops at hour eight; hour eight to nine is reserved for tests, walkthrough, documentation, and handoff.
- The user receives a complete acceptance build by hour nine, leaving hours nine to eleven for user acceptance and hour eleven to twelve for corrections.
- Implement one fixed campaign: `Cycling Camera Launch · US / UK`.
- The cycling-camera context must appear in the brief, Matrix, evidence, qualification, and feedback.
- The mandatory loop is Brief conflict → two Matrix scenarios → blocking failure and repair → search packages → cycling-evidence candidates → 30-person client review plus backups → feedback → gap → backup promotion or replenishment.
- Matrix formulas, constraints, lock semantics, package generation, candidate qualification, client projection, and gap decisions are real logic.
- Raw source parsing, creator discovery, AI, Feishu, Gmail, WhatsApp, authentication, backend, database, and production concurrency are excluded.
- Optional work does not start before user acceptance; early completion is used for verification and earlier handoff.
- All money is USD; fixed dates and deterministic fixtures keep every run reproducible.
- Prefer explicit functions and plain data over generic engines, command buses, event sourcing, adapters, or plugin systems.

---

## File Structure

```text
creator-mix-planner/
  package.json                         scripts and pinned dependencies
  index.html                           Vite entry document
  vite.config.ts                       React plugin and Vitest config
  tsconfig.json                        strict TypeScript project references
  tsconfig.app.json                    browser compilation
  tsconfig.node.json                   Vite config compilation
  src/
    main.tsx                           browser mount
    styles.css                         tokens and product-wide layout
    app/
      App.tsx                          routes and workspace shell
      CampaignProvider.tsx             small reducer, persistence, reset
      campaignReducer.ts               domain command orchestration
    domain/
      model.ts                         shared domain types
      brief.ts                         conflict resolution and publication
      matrix.ts                        formulas, aggregation, constraints
      search.ts                        Matrix cell to search package
      candidate.ts                     evidence and qualification
      review.ts                        client projection and round validation
      gap.ts                           backup/replenishment decision
    data/
      seed.ts                          fixed cycling-camera fixture
      seedSchema.ts                    Zod boundary validation
      persistence.ts                   localStorage load/save/reset
    integrations/
      simulated.ts                     Feishu/Gmail activity simulation
    pages/
      OverviewPage.tsx                 health and next actions
      BriefPage.tsx                    source conflicts and Brief v1
      MixPlannerPage.tsx               scenario table and inspector
      SearchCandidatesPage.tsx         package/candidate tabs
      ClientReviewPage.tsx             internal and client projections
      ActivityPage.tsx                 chronological activity
    components/
      MetricCard.tsx                   KPI presentation
      StatusBadge.tsx                  accessible status label
      MatrixTable.tsx                  native table and row selection
      MatrixRowDrawer.tsx              focused row editor
      ConstraintPanel.tsx              blocking and soft results
      CandidateDrawer.tsx              evidence, quote, and rights detail
    tests/
      seed.test.ts
      brief.test.ts
      matrix.test.ts
      matrixFlow.test.ts
      candidate.test.ts
      reviewGap.test.ts
      projection.test.ts
      demoFlow.test.ts
  fixtures/
    search-package.example.json        required fixed output example
  docs/
    superpowers/specs/...              approved design
    superpowers/plans/...              this plan
  README.md                             run, test, scope, walkthrough
  decision.md                           AI decisions, rejection, bad case
```

---

### Task 1: Bootstrap the runnable shell and test harness

**Time box:** 0:00–0:35

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/styles.css`
- Test: `src/tests/appShell.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: `App(): JSX.Element`, the route shell, `npm run dev`, `npm test`, and `npm run build`.

- [ ] **Step 1: Create the package and compiler configuration**

```json
{
  "name": "creator-mix-planner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-router-dom": "6.30.1",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "4.3.4",
    "jsdom": "24.1.3",
    "typescript": "5.7.3",
    "vite": "5.4.21",
    "vitest": "2.1.9"
  }
}
```

Use strict TypeScript, `jsx: react-jsx`, DOM libraries, and Vitest with `environment: "jsdom"` and `globals: true` in `vite.config.ts`.

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: exit 0 and a new `package-lock.json`.

- [ ] **Step 3: Write the failing shell test**

```tsx
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App shell", () => {
  it("anchors the fixed cycling-camera campaign", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(html).toContain("Cycling Camera Launch");
    expect(html).toContain("US / UK");
    expect(html).toContain("Mix Planner");
  });
});
```

- [ ] **Step 4: Run the test and observe the expected failure**

Run: `npm test -- src/tests/appShell.test.tsx`

Expected: FAIL because `src/app/App.tsx` does not exist.

- [ ] **Step 5: Implement the minimal routed workspace shell**

```tsx
import { NavLink, Route, Routes } from "react-router-dom";

const pages = ["Overview", "Brief", "Mix Planner", "Search & Candidates", "Client Review", "Activity"];

export function App() {
  return (
    <div className="app-shell">
      <aside>
        <div className="brand">Creator Mix Planner</div>
        <nav>{pages.map((page) => <NavLink key={page} to={`/${page.toLowerCase().replaceAll(" ", "-").replace("-&-", "-")}`}>{page}</NavLink>)}</nav>
      </aside>
      <main>
        <header>
          <p className="eyebrow">CYCLING CAMERA CAMPAIGN</p>
          <h1>Cycling Camera Launch · US / UK</h1>
        </header>
        <Routes>
          <Route path="*" element={<section><h2>Overview</h2><p>Mix Planner workspace</p></section>} />
        </Routes>
      </main>
    </div>
  );
}
```

Add restrained neutral tokens, navy text, cobalt action color, amber warning, red failure, green pass, 14px body text, a fixed 232px sidebar, and a 1440px desktop content width to `src/styles.css`.

- [ ] **Step 6: Verify shell, build, and commit**

Run: `npm test -- src/tests/appShell.test.tsx && npm run build`

Expected: one passing test and a successful Vite production build.

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig*.json src
git commit -m "feat: bootstrap campaign workspace shell"
```

---

### Task 2: Define the typed campaign fixture and validate the seed boundary

**Time box:** 0:35–1:15

**Files:**
- Create: `src/domain/model.ts`
- Create: `src/data/seedSchema.ts`
- Create: `src/data/seed.ts`
- Test: `src/tests/seed.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `CampaignState`, `MatrixRow`, `CampaignCandidate`, `campaignSeed`, and `parseCampaignSeed(input): CampaignState`.

- [ ] **Step 1: Define stable shared types**

```ts
export type Market = "US" | "UK";
export type Platform = "YouTube" | "TikTok" | "Instagram";
export type RidingScenario = "Road" | "MTB" | "Urban";
export type CandidateDecision = "Unreviewed" | "Select" | "Maybe" | "Pass";

export interface MatrixRow {
  id: string;
  market: Market;
  platform: Platform;
  ridingScenario: RidingScenario;
  creatorTier: "Macro" | "Mid" | "Micro";
  contentFormat: "Long Review" | "Short Video" | "Reel";
  plannedCreators: number;
  postsPerCreator: number;
  medianRelevantViews: number;
  creatorFee: number;
  rightsCost: number;
  otherCost: number;
  searchMultiplier: number;
}

export interface CampaignCandidate {
  id: string;
  creatorName: string;
  handle: string;
  market: Market;
  platform: Platform;
  ridingScenario: RidingScenario;
  matrixCellId: string;
  batchId: string;
  evidence: Evidence[];
  quote: Quote;
  role: "Primary" | "Backup" | "Unassigned";
  decision: CandidateDecision;
  internalNote: string;
  historicalPrice: number;
}

export interface CampaignState {
  id: string;
  name: "Cycling Camera Launch · US / UK";
  brief: BriefVersion;
  matrixScenarios: MatrixScenario[];
  activeScenarioId: string;
  searchPackages: SearchPackage[];
  candidates: CampaignCandidate[];
  candidatesLoaded: boolean;
  reviewRound: ReviewRound | null;
  gapAssessment: GapAssessment | null;
  activity: ActivityItem[];
}
```

Define `Evidence`, `Quote`, `BriefConflict`, `BriefVersion`, `MatrixScenario`, `SearchPackage`, `ActivityItem`, and `CampaignState` in the same file using the fields from the design specification.

- [ ] **Step 2: Write failing fixture invariants**

```ts
import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { parseCampaignSeed } from "../data/seedSchema";

describe("campaign seed", () => {
  it("contains the complete deterministic review pool", () => {
    const campaign = parseCampaignSeed(campaignSeed);
    expect(campaign.candidates).toHaveLength(42);
    expect(campaign.candidates.filter((candidate) => candidate.role === "Primary")).toHaveLength(30);
    expect(campaign.candidates.filter((candidate) => candidate.role === "Backup")).toHaveLength(10);
    expect(campaign.brief.conflicts.map((item) => item.field)).toEqual(["launchWindow", "adjacentSports"]);
  });
});
```

- [ ] **Step 3: Run the seed test and observe failure**

Run: `npm test -- src/tests/seed.test.ts`

Expected: FAIL because fixture and parser are missing.

- [ ] **Step 4: Implement one fixed, validated seed**

Create two Matrix scenarios with exact reconciled rows, two source conflicts, two candidate-batch snapshots, 30 primaries, 10 qualified backups, and two unassigned bad cases. Initial `searchPackages` is empty; deterministic package IDs referenced by candidate fixtures match the IDs later produced from Matrix cells. Candidate names and handles are fictional. Each primary has at least one explicit evidence item; motorcycle-only and missing-evidence bad cases remain unassigned.

Use Zod discriminated enums for markets, platforms, riding scenarios, roles, and decisions. Export:

```ts
export function parseCampaignSeed(input: unknown): CampaignState {
  return campaignStateSchema.parse(input) as CampaignState;
}
```

- [ ] **Step 5: Verify fixture, build, and commit**

Run: `npm test -- src/tests/seed.test.ts && npm run build`

Expected: seed test passes and strict TypeScript build succeeds.

```bash
git add src/domain/model.ts src/data src/tests/seed.test.ts
git commit -m "feat: add validated cycling campaign fixture"
```

---

### Task 3: Implement Brief conflict resolution and publication

**Time box:** 1:15–1:55

**Files:**
- Create: `src/domain/brief.ts`
- Create: `src/pages/BriefPage.tsx`
- Test: `src/tests/brief.test.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `BriefVersion`, `BriefConflict`.
- Produces: `resolveConflict(brief, conflictId, resolution)`, `publishBrief(brief)`, and `BriefPage` callbacks.

- [ ] **Step 1: Write failing Brief domain tests**

```ts
import { describe, expect, it } from "vitest";
import { publishBrief, resolveConflict } from "../domain/brief";
import { campaignSeed } from "../data/seed";

describe("Brief publication", () => {
  it("blocks unresolved conflicts and publishes an immutable version after resolution", () => {
    expect(() => publishBrief(campaignSeed.brief)).toThrow("Resolve 2 blocking conflicts");
    const withWindow = resolveConflict(campaignSeed.brief, "conflict-launch", "8 weeks");
    const resolved = resolveConflict(withWindow, "conflict-sports", "Pending; excluded from current plan");
    const published = publishBrief(resolved);
    expect(published.version).toBe(1);
    expect(published.status).toBe("Published");
    expect(published.publishedAt).toBe("2026-09-21T09:00:00+08:00");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/tests/brief.test.ts`

Expected: FAIL because Brief functions are missing.

- [ ] **Step 3: Implement immutable Brief functions**

```ts
export function resolveConflict(brief: BriefVersion, conflictId: string, resolution: string): BriefVersion {
  return {
    ...brief,
    conflicts: brief.conflicts.map((conflict) => conflict.id === conflictId
      ? { ...conflict, resolution, status: "Resolved" as const }
      : conflict),
  };
}

export function publishBrief(brief: BriefVersion): BriefVersion {
  const unresolved = brief.conflicts.filter((conflict) => conflict.status !== "Resolved");
  if (unresolved.length) throw new Error(`Resolve ${unresolved.length} blocking conflicts`);
  return { ...brief, version: brief.version || 1, status: "Published", publishedAt: "2026-09-21T09:00:00+08:00" };
}
```

- [ ] **Step 4: Build the Brief page**

Render source cards for Email, Excel, and Meeting Notes; conflict cards for launch window and adjacent sports; fixed campaign constraints; and a Publish Brief v1 action. Show source, evidence text, decision, and status without implementing file parsing.

- [ ] **Step 5: Route, verify, and commit**

Run: `npm test -- src/tests/brief.test.ts && npm run build`

Expected: Brief test passes, `/brief` builds, and unresolved conflicts visibly block publication.

```bash
git add src/domain/brief.ts src/pages/BriefPage.tsx src/app/App.tsx src/tests/brief.test.ts
git commit -m "feat: resolve and publish campaign brief"
```

---

### Task 4: Implement Matrix formulas and blocking constraints

**Time box:** 1:55–3:10

**Files:**
- Create: `src/domain/matrix.ts`
- Test: `src/tests/matrix.test.ts`

**Interfaces:**
- Consumes: `MatrixRow[]`, published `BriefVersion`.
- Produces: `calculateRow(row)`, `summarizeMatrix(rows)`, `evaluateMatrix(rows, brief)`, and `lockMatrix(scenario, brief)`.

- [ ] **Step 1: Write failing formula tests**

```ts
import { describe, expect, it } from "vitest";
import { calculateRow, summarizeMatrix } from "../domain/matrix";

const row = {
  id: "us-road-yt",
  market: "US",
  platform: "YouTube",
  ridingScenario: "Road",
  creatorTier: "Mid",
  contentFormat: "Long Review",
  plannedCreators: 2,
  postsPerCreator: 1,
  medianRelevantViews: 500_000,
  creatorFee: 28_000,
  rightsCost: 4_000,
  otherCost: 0,
  searchMultiplier: 3,
} as const;

it("calculates row and blended values without averaging CPM", () => {
  expect(calculateRow(row)).toMatchObject({ cost: 64_000, expectedViews: 1_000_000, cpm: 64 });
  expect(summarizeMatrix([row])).toMatchObject({ totalCost: 64_000, totalExpectedViews: 1_000_000, blendedCpm: 64 });
});
```

- [ ] **Step 2: Write failing constraint tests**

```ts
it("keeps independent campaign constraints", () => {
  expect(180_000 / 2_600_000 * 1000).toBeCloseTo(69.23, 2);
  expect(180_000 / 2_500_000 * 1000).toBe(72);

  const publishedBrief = {
    ...campaignSeed.brief,
    status: "Published" as const,
    conflicts: campaignSeed.brief.conflicts.map((conflict) => ({ ...conflict, status: "Resolved" as const })),
  };
  let remainingLongForm = 2;
  const twoLongFormRows = campaignSeed.matrixScenarios[0].rows.map((row) => {
    if (row.contentFormat !== "Long Review") return row;
    const plannedCreators = Math.min(row.plannedCreators, remainingLongForm);
    remainingLongForm -= plannedCreators;
    return { ...row, plannedCreators };
  });
  const results = evaluateMatrix(twoLongFormRows, publishedBrief);
  expect(results.find((item) => item.id === "long-form")?.status).toBe("fail");

  const first = campaignSeed.matrixScenarios[0].rows[0];
  expect(calculateRow({ ...first, rightsCost: first.rightsCost + 1_000 }).cost - calculateRow(first).cost)
    .toBe(first.plannedCreators * 1_000);
});
```

Add one additional assertion that removing the only row for a seeded riding scenario fails that scenario's coverage result.

- [ ] **Step 3: Run the Matrix tests and verify failure**

Run: `npm test -- src/tests/matrix.test.ts`

Expected: FAIL because Matrix functions are missing.

- [ ] **Step 4: Implement minimal pure calculations**

```ts
export function calculateRow(row: MatrixRow) {
  const cost = row.plannedCreators * (row.creatorFee + row.rightsCost + row.otherCost);
  const expectedViews = row.plannedCreators * row.postsPerCreator * row.medianRelevantViews;
  return { cost, expectedViews, cpm: expectedViews > 0 ? cost / expectedViews * 1000 : null };
}

export function summarizeMatrix(rows: MatrixRow[]) {
  const totals = rows.reduce((acc, row) => {
    const value = calculateRow(row);
    return { totalCost: acc.totalCost + value.cost, totalExpectedViews: acc.totalExpectedViews + value.expectedViews };
  }, { totalCost: 0, totalExpectedViews: 0 });
  return { ...totals, blendedCpm: totals.totalExpectedViews > 0 ? totals.totalCost / totals.totalExpectedViews * 1000 : null };
}
```

Implement `evaluateMatrix` with named results for budget, views, CPM, YouTube, long-form count, markets, scenarios, brief conflicts, and numeric validity. Each result returns `id`, `label`, `status`, `current`, `target`, and `affectedRowIds`.

- [ ] **Step 5: Implement lock semantics**

```ts
export function lockMatrix(scenario: MatrixScenario, brief: BriefVersion): MatrixScenario {
  const failures = evaluateMatrix(scenario.rows, brief).filter((item) => item.status === "fail");
  if (failures.length) throw new Error(`Cannot lock: ${failures.map((item) => item.label).join(", ")}`);
  return { ...scenario, status: "Locked", version: 1, lockedAt: "2026-09-21T10:00:00+08:00" };
}
```

- [ ] **Step 6: Verify Matrix engine and commit**

Run: `npm test -- src/tests/matrix.test.ts`

Expected: all formula, constraint, and lock tests pass.

```bash
git add src/domain/matrix.ts src/tests/matrix.test.ts
git commit -m "feat: calculate and validate creator mix"
```

---

### Task 5: Build the interactive Mix Planner and package generation

**Time box:** 3:10–4:35

**Files:**
- Create: `src/domain/search.ts`
- Create: `src/app/campaignReducer.ts`
- Create: `src/app/CampaignProvider.tsx`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/MatrixTable.tsx`
- Create: `src/components/MatrixRowDrawer.tsx`
- Create: `src/components/ConstraintPanel.tsx`
- Create: `src/pages/MixPlannerPage.tsx`
- Test: `src/tests/matrixFlow.test.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: Matrix functions and validated seed.
- Produces: `generateSearchPackages(matrix)`, `campaignReducer(state, action)`, and working scenario edit/lock/package UI.

- [ ] **Step 1: Write the failing package-generation test**

```ts
it("generates traceable packages from every locked Matrix cell", () => {
  const publishedBrief = {
    ...campaignSeed.brief,
    status: "Published" as const,
    conflicts: campaignSeed.brief.conflicts.map((conflict) => ({ ...conflict, status: "Resolved" as const })),
  };
  const locked = lockMatrix(campaignSeed.matrixScenarios[0], publishedBrief);
  const packages = generateSearchPackages(locked);
  expect(packages).toHaveLength(locked.rows.length);
  expect(packages[0]).toMatchObject({
    matrixVersionId: locked.id,
    matrixCellId: locked.rows[0].id,
    candidateTargetCount: locked.rows[0].plannedCreators * locked.rows[0].searchMultiplier,
  });
});
```

- [ ] **Step 2: Run the flow test and verify failure**

Run: `npm test -- src/tests/matrixFlow.test.ts`

Expected: FAIL because package generation and reducer are missing.

- [ ] **Step 3: Implement package generation and reducer actions**

Implement only these actions:

```ts
type CampaignAction =
  | { type: "RESET" }
  | { type: "RESOLVE_CONFLICT"; conflictId: string; resolution: string }
  | { type: "PUBLISH_BRIEF" }
  | { type: "SELECT_SCENARIO"; scenarioId: string }
  | { type: "UPDATE_MATRIX_ROW"; scenarioId: string; row: MatrixRow }
  | { type: "LOCK_MATRIX"; scenarioId: string }
  | { type: "GENERATE_PACKAGES"; scenarioId: string }
  | { type: "LOAD_BATCHES" }
  | { type: "PUBLISH_REVIEW" }
  | { type: "SUBMIT_DECISIONS"; decisions: Record<string, CandidateDecision> }
  | { type: "PROMOTE_BACKUP"; candidateId: string }
  | { type: "CREATE_REPLENISHMENT"; packageId: string };
```

No generic command registry is added.

- [ ] **Step 4: Build the Matrix UI**

Render scenario tabs, five KPI cards, the native table, selected-row drawer, and constraint inspector. Update one full row through the drawer. Disable Lock when any blocking constraint fails. Show `Plan` values only in this task; Forecast/Variance labels remain hidden until candidate data is loaded.

- [ ] **Step 5: Add the scripted failure interaction**

Provide a small demo action labeled `Simulate long-form gap` that changes the two seeded long-form rows necessary to bring the scenario total from four creators to two, including removal of the only UK Urban long-form row. The constraint panel must show `Long-form creators: 2 / 3` and the resulting UK/Urban gap. `Restore scenario` resets only the active scenario from the fixture.

- [ ] **Step 6: Verify interaction logic and commit**

Run: `npm test -- src/tests/matrixFlow.test.ts && npm run build`

Expected: package-generation test passes and the Mix Planner route builds.

```bash
git add src/domain/search.ts src/app src/components src/pages/MixPlannerPage.tsx src/tests/matrixFlow.test.ts
git commit -m "feat: deliver interactive mix planner"
```

---

### Task 6: Implement candidate qualification and the Search & Candidates workspace

**Time box:** 4:35–5:35

**Files:**
- Create: `src/domain/candidate.ts`
- Create: `src/components/CandidateDrawer.tsx`
- Create: `src/pages/SearchCandidatesPage.tsx`
- Test: `src/tests/candidate.test.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: generated `SearchPackage[]`, seeded `CampaignCandidate[]`.
- Produces: `qualifyCandidate(candidate, package)`, `candidateScore(candidate)`, and package/candidate tabs.

- [ ] **Step 1: Write failing qualification tests**

```ts
it("rejects high-reach creators without real cycling evidence", () => {
  const motorcycleOnlyCandidate = campaignSeed.candidates.find((candidate) => candidate.id === "creator-moto-only")!;
  const generatedPackages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });
  const roadYoutubePackage = generatedPackages.find((pkg) => pkg.id === "pkg-us-road-youtube")!;
  const result = qualifyCandidate(motorcycleOnlyCandidate, roadYoutubePackage);
  expect(result.status).toBe("Disqualified");
  expect(result.reasons).toContain("No verified real-cycling evidence");
});

it("keeps an over-budget but relevant creator visible as commercial risk", () => {
  const overBudgetCyclist = campaignSeed.candidates.find((candidate) => candidate.id === "creator-over-budget")!;
  const generatedPackages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });
  const roadYoutubePackage = generatedPackages.find((pkg) => pkg.id === "pkg-us-road-youtube")!;
  const result = qualifyCandidate(overBudgetCyclist, roadYoutubePackage);
  expect(result.status).toBe("Qualified");
  expect(result.risks).toContain("Quote exceeds Matrix cell ceiling");
});
```

- [ ] **Step 2: Run qualification tests and verify failure**

Run: `npm test -- src/tests/candidate.test.ts`

Expected: FAIL because qualification functions are missing.

- [ ] **Step 3: Implement explicit qualification and ranking**

```ts
export function qualifyCandidate(candidate: CampaignCandidate, pkg: SearchPackage): Qualification {
  const hasCycling = candidate.evidence.some((item) => item.proofPoints.includes("Real Cycling"));
  if (!hasCycling) return { status: "Disqualified", reasons: ["No verified real-cycling evidence"], risks: [] };
  const scenarioMatch = candidate.evidence.some((item) => item.ridingScenario === pkg.ridingScenario);
  if (!scenarioMatch) return { status: "Needs Review", reasons: ["No evidence for target riding scenario"], risks: [] };
  const risks = candidate.quote.total > pkg.budgetCeilingPerCreator ? ["Quote exceeds Matrix cell ceiling"] : [];
  return { status: "Qualified", reasons: [], risks };
}
```

Implement the fixed weighted score from the specification as a transparent breakdown. Hard qualification runs before ranking.

- [ ] **Step 4: Build the two-tab workspace**

Search Packages shows source Matrix cell, target, found, qualified, gap, owner, and status. Candidates shows compact rows with platform, market, scenario, qualification, role, quote, forecast views, and client state. Clicking a row opens evidence, rights, quote, risk, and internal note.

The `Load seeded batches` button dispatches `LOAD_BATCHES`; it is not a file uploader.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/tests/candidate.test.ts && npm run build`

Expected: qualification tests pass and both tabs build.

```bash
git add src/domain/candidate.ts src/components/CandidateDrawer.tsx src/pages/SearchCandidatesPage.tsx src/tests/candidate.test.ts src/app/App.tsx
git commit -m "feat: qualify cycling creators from seeded batches"
```

---

### Task 7: Implement client projection, review validation, gap, and replenishment

**Time box:** 5:35–6:45

**Files:**
- Create: `src/domain/review.ts`
- Create: `src/domain/gap.ts`
- Create: `src/pages/ClientReviewPage.tsx`
- Test: `src/tests/projection.test.ts`
- Test: `src/tests/reviewGap.test.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: qualified candidates, locked Matrix, review decisions.
- Produces: `toClientCandidate(candidate)`, `validateReviewRound(candidates)`, `assessGap(state)`, and `recommendGapAction(gap)`.

- [ ] **Step 1: Write the sensitive-field projection test**

```ts
it("never projects internal commercial fields to the client", () => {
  const internalCandidate = campaignSeed.candidates[0];
  const projected = toClientCandidate(internalCandidate);
  expect(projected).not.toHaveProperty("historicalPrice");
  expect(projected).not.toHaveProperty("internalNote");
  expect(projected).not.toHaveProperty("role");
  expect(projected).toMatchObject({ creatorName: internalCandidate.creatorName, decision: "Unreviewed" });
});
```

- [ ] **Step 2: Write review and gap tests**

```ts
it("requires a complete first review and chooses the least destructive next action", () => {
  const primaries = qualifiedCandidates.filter((candidate) => candidate.role === "Primary");
  const backups = qualifiedCandidates.filter((candidate) => candidate.role === "Backup");
  expect(validateReviewRound(primaries.slice(0, 29), backups, qualifications).valid).toBe(false);
  expect(validateReviewRound(primaries, backups, qualifications).valid).toBe(true);

  const withClientPasses = primaries.map((candidate) => candidate.market === "UK" && candidate.ridingScenario === "Urban"
    ? { ...candidate, decision: "Pass" as const }
    : { ...candidate, decision: "Select" as const });
  const gap = assessGap(lockedMatrix, withClientPasses, backups);
  expect(gap.missingCells).toContainEqual(expect.objectContaining({ market: "UK", ridingScenario: "Urban" }));
  expect(recommendGapAction(gap, backups).action).toBe("Promote Backup");
  expect(recommendGapAction(gap, []).action).toBe("Replenish");
});
```

Build `qualifiedCandidates`, `qualifications`, and `lockedMatrix` from `campaignSeed` and the domain functions at the top of the test file.

- [ ] **Step 3: Run review tests and verify failure**

Run: `npm test -- src/tests/projection.test.ts src/tests/reviewGap.test.ts`

Expected: FAIL because review and gap functions are missing.

- [ ] **Step 4: Implement projection and review validation**

Return a new object that explicitly selects client-visible fields; never clone and delete fields.

```ts
export function validateReviewRound(
  primaries: CampaignCandidate[],
  backups: CampaignCandidate[],
  qualificationByCandidateId: Record<string, Qualification>,
) {
  const errors: string[] = [];
  if (primaries.length !== 30) errors.push(`Client round requires 30 candidates; found ${primaries.length}`);
  if (backups.length < 10) errors.push(`Internal pool requires 10 backups; found ${backups.length}`);
  if (primaries.some((candidate) => qualificationByCandidateId[candidate.id]?.status !== "Qualified")) errors.push("All client candidates must be qualified");
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 5: Implement gap decision and client UI**

The page has an Internal / Client switch. Client rows show evidence summary, deliverables, quote range, rights summary, decision buttons, reason code, and comment. On submission, show budget/views/CPM/long-form gaps and exactly one recommended action: Promote Backup or Create Replenishment.

`Replan Matrix` and `Revise Brief` appear only as non-interactive recommendation labels when feedback changes assumptions outside the seeded path.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/tests/projection.test.ts src/tests/reviewGap.test.ts && npm run build`

Expected: projection, 30/10 validation, gap, backup, and replenishment tests pass.

```bash
git add src/domain/review.ts src/domain/gap.ts src/pages/ClientReviewPage.tsx src/tests/projection.test.ts src/tests/reviewGap.test.ts src/app/App.tsx
git commit -m "feat: close client review and replenishment loop"
```

---

### Task 8: Add overview, activity, persistence, reset, and simulated integrations

**Time box:** 6:45–7:30

**Files:**
- Create: `src/data/persistence.ts`
- Create: `src/integrations/simulated.ts`
- Create: `src/pages/OverviewPage.tsx`
- Create: `src/pages/ActivityPage.tsx`
- Test: `src/tests/persistence.test.ts`
- Modify: `src/app/CampaignProvider.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: current `CampaignState`.
- Produces: `loadState()`, `saveState(state)`, `resetState()`, `simulateFeishuNotification()`, `simulateGmailReference()`, health summary, next actions, and activity list.

- [ ] **Step 1: Write the persistence/reset test**

```ts
it("restores the deterministic campaign seed", () => {
  saveState({ ...campaignSeed, activeScenarioId: "scenario-b" });
  expect(loadState()?.activeScenarioId).toBe("scenario-b");
  resetState();
  expect(loadState()).toBeNull();
});
```

- [ ] **Step 2: Run the persistence test and verify failure**

Run: `npm test -- src/tests/persistence.test.ts`

Expected: FAIL because persistence functions are missing.

- [ ] **Step 3: Implement bounded local persistence**

```ts
const STORAGE_KEY = "creator-mix-planner:v1";

export function loadState(): CampaignState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parseCampaignSeed(JSON.parse(raw)) : null;
}
export function saveState(state: CampaignState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function resetState() { localStorage.removeItem(STORAGE_KEY); }
```

Save after reducer changes. Reset clears storage and reloads the validated fixture.

- [ ] **Step 4: Implement tiny simulated integrations**

```ts
export function simulateFeishuNotification(
  kind: string,
  succeed = true,
  at = "2026-09-21T12:00:00+08:00",
): ActivityItem {
  return { id: crypto.randomUUID(), at, kind: "Feishu (Simulated)", message: kind, status: succeed ? "Success" : "Failed" };
}
```

Add an equivalent Gmail thread reference. Do not add retry infrastructure.

- [ ] **Step 5: Build Overview and Activity**

Overview derives current health from the Matrix and review state and lists no more than five next actions. Activity renders the chronological audit. Add `Reset Demo` to the campaign header with a confirmation dialog.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/tests/persistence.test.ts && npm run build`

Expected: persistence test and production build pass.

```bash
git add src/data/persistence.ts src/integrations src/pages/OverviewPage.tsx src/pages/ActivityPage.tsx src/app
git commit -m "feat: add campaign health and deterministic reset"
```

---

### Task 9: Complete the seeded flow, submission artifacts, and handoff verification

**Time box:** 7:30–9:00

**Files:**
- Create: `src/tests/demoFlow.test.ts`
- Create: `fixtures/search-package.example.json`
- Create: `README.md`
- Create: `decision.md`
- Modify: `src/styles.css`
- Modify: any file required to fix failures found by the full suite

**Interfaces:**
- Consumes: all earlier domain and application functions.
- Produces: one-command tests, one-command run instructions, five-to-eight-minute walkthrough, assignment disclosure, mock boundary, bad case, and acceptance build.

- [ ] **Step 1: Write the full seeded flow test**

```ts
it("runs the brief-to-replenishment loop without external services", () => {
  let state = structuredClone(campaignSeed);
  state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-launch", resolution: "8 weeks" });
  state = campaignReducer(state, { type: "RESOLVE_CONFLICT", conflictId: "conflict-sports", resolution: "Pending; excluded from current plan" });
  state = campaignReducer(state, { type: "PUBLISH_BRIEF" });
  state = campaignReducer(state, { type: "LOCK_MATRIX", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "GENERATE_PACKAGES", scenarioId: "scenario-a" });
  state = campaignReducer(state, { type: "LOAD_BATCHES" });
  state = campaignReducer(state, { type: "PUBLISH_REVIEW" });
  const decisions = Object.fromEntries(
    state.candidates
      .filter((candidate) => candidate.role === "Primary")
      .map((candidate) => [candidate.id, candidate.market === "UK" && candidate.ridingScenario === "Urban" ? "Pass" : "Select"]),
  );
  state = campaignReducer(state, { type: "SUBMIT_DECISIONS", decisions });
  expect(state.gapAssessment?.recommendedAction).toBe("Promote Backup");
  state = campaignReducer(state, { type: "PROMOTE_BACKUP", candidateId: state.gapAssessment!.backupCandidateId! });
  expect(state.gapAssessment?.recommendedAction).toBe("Replenish");
  state = campaignReducer(state, { type: "CREATE_REPLENISHMENT", packageId: state.gapAssessment!.packageId });
  expect(state.searchPackages.some((pkg) => pkg.parentPackageId)).toBe(true);
});
```

- [ ] **Step 2: Run the full suite and fix only blocking failures**

Run: `npm test`

Expected: all tests pass. Do not add optional features while correcting failures.

- [ ] **Step 3: Create the fixed Search Package example**

Export one real generated package to `fixtures/search-package.example.json`; it must include Brief, Matrix, and Matrix-cell IDs, US Road YouTube long-form criteria, rights requirements, evidence requirements, candidate target, backup target, owner, due date, and status.

- [ ] **Step 4: Write README.md**

Include:

```markdown
# Creator Mix Planner

## Candidate disclosure
- Closest experience: complex business-workflow decomposition and engineering delivery. The candidate will verify this wording against their actual experience before submission.
- Not previously done: front-line execution of a complete creator-marketing campaign. The candidate will verify this wording against their actual experience before submission.
- Minimum loop first: Brief conflict → Matrix → Search Package → Review → Replenishment

## Run
npm install
npm run dev

## Test
npm test

## Five-to-eight-minute walkthrough
1. Resolve the two Brief conflicts and publish v1.
2. Compare the two scenarios.
3. Simulate the long-form gap and observe Lock blocked.
4. Restore, lock, and generate packages.
5. Load seeded candidate batches.
6. Publish the 30-person client round.
7. Submit client decisions and create replenishment.
```

Also document completed scope, assumptions, real logic, simulated integrations, exclusions, and next priority. Mark the two disclosure statements as candidate-verified submission text rather than product behavior.

- [ ] **Step 5: Write decision.md**

Document that AI assisted requirement decomposition, formula/test drafting, and UI planning; retain deterministic calculations, source traceability, and explicit client projection; reject runtime AI extraction, AI final selection, over-generalized workflow infrastructure, and hidden composite scoring. Use the motorcycle-only high-reach creator as the bad case and list the exact test that validates rejection.

- [ ] **Step 6: Run the manual acceptance walkthrough**

Run: `npm run dev -- --host 127.0.0.1`

Verify each of the seven README walkthrough steps, client/internal field separation, Reset Demo, and no browser-console errors. Record any defect as a short checklist and fix only defects that block the documented walkthrough or assignment coverage.

- [ ] **Step 7: Run final verification**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: all tests pass, production build succeeds, no whitespace errors, and only intended files are changed.

- [ ] **Step 8: Commit the acceptance build**

```bash
git add README.md decision.md fixtures src package.json package-lock.json vite.config.ts tsconfig*.json index.html
git commit -m "feat: complete creator mix planner demo"
```

- [ ] **Step 9: Hand off by hour nine**

Provide the commit ID, exact run/test commands, the completed versus simulated scope, the walkthrough, and the explicit start of the user-acceptance window. Stop optional engineering work and wait for acceptance feedback.
