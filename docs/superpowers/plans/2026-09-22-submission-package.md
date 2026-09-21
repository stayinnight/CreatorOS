# CreatorOS Submission Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an evaluator-ready documentation package that proves assignment coverage, explains the complete product design, and records reproducible verification without changing product behavior.

**Architecture:** Keep `README.md` as the short entry point, add one consolidated `DESIGN.md` as the product/system source of truth, retain `decision.md` for AI and engineering decisions, and add `docs/最终验收记录.md` as the requirement-to-evidence and verification record. Derive every implemented claim from current source/tests and label design-only or simulated behavior explicitly.

**Tech Stack:** Markdown, Git, npm, Vitest, TypeScript, Vite

## Global Constraints

- Do not add or change product behavior.
- Do not invent the candidate's personal experience; use candidate-provided wording.
- Keep the head-mounted cycling-camera case, `$180,000` budget, `2.6M` effective views, CPM `≤ $70`, at least three long-form creators, 30 client candidates, and 10 internal backups explicit.
- Distinguish deterministic domain logic from simulated source parsing, live creator search, model analysis, Feishu, Gmail, and external delivery.
- State that Promote Backup and Replenishment are interactive; Replan Matrix and Revise Brief are design-only branches in the current demo.
- Do not claim browser-level visual acceptance from unit/integration tests.

---

### Task 1: Consolidated Product and System Design

**Files:**
- Create: `DESIGN.md`
- Reference: `decision.md`
- Reference: `docs/superpowers/specs/2026-09-21-creator-mix-planner-design.md`
- Reference: `docs/superpowers/specs/2026-09-21-creator-campaign-agent-desk-design.md`

**Interfaces:**
- Consumes: approved product specs, current domain models, reducer actions, and tests.
- Produces: a single evaluator-facing explanation linked from `README.md` and the final acceptance record.

- [ ] **Step 1: Write the consolidated design**

Include problem framing, success criteria, roles, complete loop, Agent approval gates, domain lineage, Brief versions, Matrix formulas/constraints, Search Packages, evidence qualification, calibration, 30+10 slate, client projection, feedback recovery, integration boundaries, architecture, tests, risks, and production follow-ons.

- [ ] **Step 2: Check implementation claims against code**

Run:

```bash
rg -n "PROMOTE_BACKUP|CREATE_REPLENISHMENT|LOCK_MATRIX|GENERATE_PACKAGES|PUBLISH_REVIEW|APPLY_SEEDED_CLIENT_FEEDBACK" src
```

Expected: every interactive action claimed in `DESIGN.md` has a reducer/action/test reference.

- [ ] **Step 3: Check documentation integrity**

Run:

```bash
test -s DESIGN.md
rg -n "TBD|TODO|lorem|待补" DESIGN.md
```

Expected: `test` exits 0; `rg` produces no output.

- [ ] **Step 4: Commit the design**

```bash
git add DESIGN.md
git commit -m "docs: add consolidated product design"
```

### Task 2: Submission Entry Point

**Files:**
- Modify: `README.md`
- Reference: `DESIGN.md`
- Reference: `decision.md`
- Reference: `docs/验收流程-资格校准与Agent交互.md`
- Reference: `docs/验收流程-中英切换.md`

**Interfaces:**
- Consumes: candidate-provided closest-experience sentence and the existing run/test/demo instructions.
- Produces: the first document an evaluator can use without reading internal planning files.

- [ ] **Step 1: Add the pre-work disclosure**

Add three explicit statements near the top: closest relevant experience using the candidate's supplied sentence, work not previously done, and the first minimum loop planned.

- [ ] **Step 2: Add evaluator navigation and scope boundaries**

Link `DESIGN.md`, `decision.md`, and `docs/最终验收记录.md`; add dedicated sections for implemented logic, simulated capabilities, design-only branches, known limitations, and five-to-eight-minute walkthrough.

- [ ] **Step 3: Validate required README content and links**

Run:

```bash
rg -n "本人经验|没有做过|最小闭环|DESIGN.md|decision.md|最终验收记录|未实现|Mock" README.md
test -f DESIGN.md
test -f decision.md
```

Expected: each required topic has at least one match and both linked root documents exist.

- [ ] **Step 4: Commit the README**

```bash
git add README.md
git commit -m "docs: complete submission readme"
```

### Task 3: Requirement Traceability and Acceptance Record

**Files:**
- Create: `docs/最终验收记录.md`
- Reference: `src/tests/agentDemoFlow.test.ts`
- Reference: `src/tests/matrix.test.ts`
- Reference: `src/tests/projection.test.ts`
- Reference: `src/tests/qualification.test.ts`
- Reference: `fixtures/search-package.example.json`

**Interfaces:**
- Consumes: assignment deliverables, repository files, test names, and final command output.
- Produces: a requirement-to-evidence matrix and a Chinese manual click-through checklist.

- [ ] **Step 1: Write the requirement-to-evidence matrix**

Map complete loop design, deep Matrix path, two scenarios, Search Package schema, evidence/qualification, client projection, feedback recovery, AI disclosure, bad case, setup, and tests to concrete files and UI actions. Mark each row `已具备`, `设计覆盖`, or `人工待验`.

- [ ] **Step 2: Add the manual acceptance checklist**

List Reset, material analysis, two conflict decisions, Matrix failure/restore/lock, package generation, calibration, 30+10 expansion, client preview, publication, feedback, backup promotion, replenishment, Runs inspection, and English/Chinese checks. Keep the final visual click-through unchecked until the candidate performs it.

- [ ] **Step 3: Record fresh automated verification**

Run:

```bash
npm test
npm run build
```

Expected: 38 test files and 89 tests pass; TypeScript and Vite production build exit 0. Record the date, commands, counts, and the React Router/Rollup non-blocking warnings accurately.

- [ ] **Step 4: Commit the acceptance record**

```bash
git add docs/最终验收记录.md
git commit -m "docs: add final acceptance record"
```

### Task 4: Submission Audit and Integration

**Files:**
- Modify: `README.md` only if link or wording corrections are found.
- Modify: `DESIGN.md` only if claim mismatches are found.
- Modify: `docs/最终验收记录.md` only if evidence mismatches are found.

**Interfaces:**
- Consumes: all evaluator-facing documents and repository verification output.
- Produces: a clean, internally consistent branch ready to integrate.

- [ ] **Step 1: Audit placeholders, claims, and Markdown whitespace**

Run:

```bash
rg -n "TBD|TODO|lorem|待补|由候选人补充" README.md DESIGN.md docs/最终验收记录.md
git diff master...HEAD --check
```

Expected: placeholder search produces no output and diff check exits 0.

- [ ] **Step 2: Run full verification again**

Run:

```bash
npm test
npm run build
```

Expected: 38 test files and 89 tests pass; production build exits 0.

- [ ] **Step 3: Inspect final history and worktree**

Run:

```bash
git status --short
git log --oneline master..HEAD
```

Expected: no uncommitted changes and documentation commits are present.

- [ ] **Step 4: Integrate only after verification**

Use the project's approved local integration workflow to bring the verified documentation commits onto `master`, then rerun `npm test` and `npm run build` on `master` before reporting completion.

