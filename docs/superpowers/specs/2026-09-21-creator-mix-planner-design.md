# Creator Mix Planner — Design Specification

Date: 2026-09-21  
Status: Approved design, pending user review of written specification  
Time budget: 12-hour end-to-end submission window, including user acceptance and final fixes

## 1. Objective

Build a local-first B2B campaign planning demo for a smart-hardware brand launching a cycling head-mounted camera in the US and UK.

The demo must show a coherent loop from structured brief to creator mix, search tasks, candidate batches, client review, and replenishment. The Matrix is the one deeply implemented path: its calculations, constraints, versioning, downstream task generation, forecast variance, and gap handling must be real and testable.

The product is not a generic creator CRM, a scraping tool, or a slide deck. It is a campaign decision workspace whose recommendations remain traceable to the cycling-camera brief.

## 2. Candidate disclosure required by the assignment

The final README must begin with three concise statements supplied by the candidate:

1. Which prior experience is closest to this task.
2. Which parts the candidate has not done before.
3. Which minimum closed loop the candidate chose to complete first.

## 3. Business context and fixed requirements

### 3.1 Product and markets

- Product: cycling head-mounted camera.
- Markets: United States and United Kingdom.
- Required riding scenarios: road cycling, mountain biking, and urban commuting.
- Product proof points: first-person footage, safety recording, stabilization, and performance under different lighting conditions.

### 3.2 Commercial and performance constraints

- Total campaign budget: no more than USD 180,000.
- Content usage-rights costs are included in the same budget.
- YouTube coverage is mandatory; TikTok and Instagram are supplementary.
- Expected effective views: at least 2,600,000.
- Blended CPM: no more than USD 70.
- At least three creators must be capable of high-quality long-form video.
- The first client review round must contain exactly 30 candidates.
- The internal team must hold a reasonable backup pool.

### 3.3 Brief conflicts and uncertainties

- Email states that creators must have real cycling content.
- Meeting notes suggest motorcycle and skiing creators, but the client has not confirmed this expansion.
- Excel states launch in eight weeks; meeting notes state six weeks.

The seeded demo resolves the schedule to eight weeks and keeps motorcycle and skiing as pending, excluded from the current plan. These are explicit demo decisions, not invented client facts.

### 3.4 Available data

- Internal creator records.
- Internal video records.
- Historical inquiry data.
- Compliant public creator and video data.

Every evidence item records source type, source reference, collection time, verification time, confidence, and stale status. Historical inquiry data is a planning reference, never a current quote.

### 3.5 Working environment

- The internal system is the source of truth.
- Feishu is represented as internal notification and deep-link events.
- Gmail is represented as the formal external communication and quote-thread reference.
- WhatsApp is limited to a manually recorded communication summary.
- Real integrations are mocked and visibly labeled as simulated.

## 4. Product shape

Use a single Campaign Workspace rather than a tool gallery or a long wizard.

The fixed demo campaign is `Cycling Camera Launch · US / UK`. The workspace contains:

1. Overview
2. Brief
3. Mix Planner
4. Search & Candidates
5. Client Review
6. Activity

The global campaign list and campaign creation flow are excluded from the time-boxed MVP. A campaign header remains visible and shows brief version, matrix version, stage, budget, expected views, blended CPM, and unresolved items.

## 5. Primary users

- Campaign Strategist: confirms requirements and owns the creator mix.
- Creator Researcher: works from search packages and submits candidate batches.
- Account Manager: publishes client-review rounds and records formal feedback.
- Client: sees a projected shortlist and submits Select, Maybe, or Pass.

The MVP has no authentication or permission service. An Internal / Client view switch demonstrates projection boundaries.

## 6. End-to-end demo flow

1. Open the fixed campaign.
2. Review the email, spreadsheet, and meeting-note evidence.
3. Resolve the six/eight-week conflict and publish Brief v1.
4. Compare two seeded Matrix scenarios.
5. Introduce a long-form coverage failure and observe the blocking constraint.
6. Repair and lock Matrix v1.
7. Generate search packages from Matrix cells.
8. Load two seeded candidate batches and run deterministic qualification.
9. Prepare 30 client-visible candidates and at least 10 internal backups.
10. Publish Review Round 1 and switch to the client projection.
11. Submit Select, Maybe, and Pass feedback.
12. Recompute the selected portfolio and show the resulting gap.
13. Promote a qualified backup or generate a replenishment package without resetting prior work.

## 7. Information architecture and page requirements

### 7.1 Overview

Show only decision-relevant status:

- Planned and forecast budget.
- Planned and forecast effective views.
- Blended CPM.
- YouTube and long-form coverage.
- US/UK and riding-scenario coverage.
- First-round and backup counts.
- Unresolved conflicts.
- Recent client feedback.
- Three to five next actions.

The Overview is an action surface, not a chart gallery.

### 7.2 Brief

Store structured fields with `value`, `source`, `evidence`, `status`, and confirmation metadata.

The MVP needs only the seeded conflicting fields and the fixed campaign constraints. It does not implement generic email, Excel, or meeting-note parsing.

Publishing creates an immutable Brief snapshot. Subsequent changes fork a new version. A blocking conflict prevents Matrix locking.

### 7.3 Mix Planner

This is the primary implementation surface.

Layout:

- Scenario tabs.
- KPI strip.
- Editable Matrix table.
- Constraint inspector.
- Row-edit drawer.
- Sticky total row.
- Actions: Save Draft, Compare, Lock Version, Generate Search Packages.

Each row represents:

`Market × Platform × Riding Scenario × Creator Tier × Content Format`

Required fields:

- Market.
- Platform.
- Riding scenario.
- Creator tier.
- Content format.
- Planned creators.
- Posts per creator.
- Median relevant views.
- Creator fee.
- Rights cost.
- Other included cost.
- Search multiplier.
- Notes and assumptions.

Calculated fields:

```text
Row Cost = Planned Creators × (Creator Fee + Rights Cost + Other Cost)
Expected Views = Planned Creators × Posts per Creator × Median Relevant Views
Row CPM = Row Cost ÷ Expected Views × 1000
Total Cost = sum(Row Cost)
Total Expected Views = sum(Expected Views)
Blended CPM = Total Cost ÷ Total Expected Views × 1000
```

Blended CPM is never the arithmetic mean of row CPM values.

### 7.4 Search & Candidates

Use one page with two tabs to reduce implementation scope.

Search Packages tab:

- Shows packages generated from locked Matrix cells.
- Displays targets, evidence requirements, owner, due date, and gap.
- Supports one seeded replenishment action.

Candidates tab:

- Uses a compact comparison table.
- Supports batch filter, qualification filter, client state, and primary/backup role.
- Opens a details drawer with evidence, quote, rights, and risk.
- Loads fixed seeded batches instead of a generic CSV importer.

### 7.5 Client Review

Internal mode:

- Selects exactly 30 qualified candidates.
- Verifies required coverage and backup availability.
- Publishes a review snapshot.

Client mode:

- Shows only approved fields.
- Supports Select, Maybe, Pass, reason codes, and comments.
- Hides historical price, internal score details, search queries, backup strategy, and sensitive notes.

### 7.6 Activity

Use a simple chronological list, not a full event-sourcing UI. Record brief publication, matrix lock, package generation, batch load, review publication, client submission, and replenishment creation.

## 8. Domain model

Core relationship:

```text
Campaign
  -> BriefVersion
  -> MatrixScenario
  -> MatrixVersion
  -> MatrixCell
  -> SearchPackage
  -> CandidateBatch
  -> CampaignCandidate
  -> ReviewRound
  -> ClientDecision
  -> GapAssessment
  -> ReplenishmentPackage | MatrixVersion fork | BriefVersion fork
```

Creator identity is separate from campaign-specific candidate data. Quote, evidence, recommendation, and client state belong to CampaignCandidate.

Do not introduce generic command buses, event stores, plugin systems, or formula builders. Plain TypeScript types, pure domain functions, and a small state store are sufficient.

## 9. Matrix constraints

### 9.1 Blocking constraints

- Total cost is at most USD 180,000.
- Expected effective views are at least 2,600,000.
- Blended CPM is at most USD 70.
- YouTube is present.
- At least three high-quality long-form creators are planned.
- US and UK are covered.
- Road, mountain biking, and urban commuting are covered.
- Rights cost is included.
- No blocking brief conflict remains.
- No invalid numeric row exists.

### 9.2 Non-blocking goals

- Avoid excessive dependence on one creator tier.
- Preserve budget buffer.
- Maintain backups for critical cells.
- Use long-form content for product credibility and short-form content for supplementary reach.
- Do not count motorcycle or skiing-only creators toward current cycling coverage.

### 9.3 Seed scenarios

Scenario A, Credibility First:

- Four YouTube long-form creators.
- Approximate total cost: USD 172,000.
- Approximate effective views: 2.75 million.
- Approximate blended CPM: USD 62.55.

Scenario B, Reach Efficiency:

- Three to four YouTube long-form creators, with more short-form allocation.
- Approximate total cost: USD 167,000.
- Approximate effective views: 3.25 million.
- Approximate blended CPM: USD 51.38.

Exact row values in the fixture must reconcile with displayed totals. Both scenarios pass blocking constraints and express a real trade-off.

## 10. Rights and quote model

Rights include:

- Usage type.
- Territory.
- Duration.
- Exclusivity.
- Raw-footage requirement.
- Rights cost.

Quote includes:

- Creator fee.
- Deliverables.
- Rights terms.
- Availability and publish window.
- Payment terms.
- Valid-until date.
- Currency.
- Status.
- Gmail thread reference.

The MVP renders these fixed fields. It does not implement negotiation workflows or currency conversion.

## 11. Search package schema

Required fields:

```text
package_id
campaign_id
brief_version_id
matrix_version_id
matrix_cell_id
market
platform
riding_scenario
creator_tier
content_format
target_creator_count
candidate_target_count
backup_target_count
budget_ceiling_per_creator
expected_views_floor
rights_requirements
must_have_rules
exclusion_rules
evidence_requirements
owner
due_at
status
parent_package_id?
```

`candidate_target_count = planned creators × search multiplier`.

## 12. Candidate qualification and evidence

### 12.1 Evidence proof points

- Real cycling.
- First-person POV.
- Stabilization on rough terrain.
- Daylight.
- Dusk, night, or tunnel.
- Safety or incident recording.
- Mounting or hands-free use.
- Long-form product explanation.

Every recommendation references one or more evidence records.

### 12.2 Qualification results

- Qualified.
- Needs Review.
- Disqualified.

Real cycling is a blocking requirement. Motorcycle-only, skiing-only, generic outdoor, unverifiable, or copied content cannot satisfy it.

### 12.3 Long-form quality assumption

For this demo, a long-form-capable creator has:

- A native YouTube video format planned for at least eight minutes.
- At least two recent real-cycling evidence videos.
- Evidence for at least two camera proof points.
- No blocking brand-safety issue.

These thresholds are configurable demo assumptions, not confirmed client facts.

### 12.4 Recommendation ranking

The fixed transparent score is:

- Cycling and proof-point relevance: 35%.
- Format and production ability: 20%.
- Relevant-content performance stability: 20%.
- Quote and rights fit: 15%.
- US/UK audience fit: 10%.

Scoring ranks qualified candidates; it never overrides a blocking rule. The MVP allows a simple manual recommendation override with a required reason.

## 13. First review and backup policy

- Client Review Round 1 contains exactly 30 candidates.
- The internal pool contains at least 10 additional qualified backups.
- Every critical Matrix cell has at least one backup.
- YouTube long-form backup count is at least the planned creator count for that cell.
- Backups are hidden from the initial client projection.

These are explicit implementation assumptions used to make “reasonable Backup” testable.

## 14. Feedback and replenishment

Client decisions are Select, Maybe, or Pass with reason codes and an optional comment.

After submission, recompute the selected portfolio and choose one of four actions:

1. Promote Backup: a qualified matching backup exists.
2. Replenish: the brief and matrix remain valid, but a cell lacks candidates.
3. Replan Matrix: the preferred mix changes while campaign goals remain.
4. Revise Brief: budget, market, timing, rights, or formal scenario scope changes.

The MVP implements Promote Backup and Replenish as interactive actions. Replan Matrix and Revise Brief are represented by a clear fork recommendation and version relationship, not fully interactive editors.

## 15. Plan, forecast, and variance

- Plan uses Matrix assumptions.
- Forecast uses candidate quote and evidence data.
- Variance shows the difference without mutating the locked plan.

Passing a candidate or changing quote data affects Forecast only. The source Matrix version remains immutable.

## 16. Internal and client projection

Client-visible fields:

- Creator and platform.
- Audience and relevant-performance summary.
- Cycling-camera evidence.
- Recommendation rationale.
- Planned deliverables.
- Quote range.
- Rights summary.
- Decision and comment.

Internal-only fields:

- Historical inquiry and price floor.
- Contact and agency details.
- Internal risk notes.
- Score details and override reason.
- Primary/backup strategy.
- Search query and rejection reason.
- Negotiation and payment notes.

A domain-level projection test must assert that internal-only fields are absent.

## 17. Feishu and Gmail simulation

Keep integration simulation deliberately small:

- Show a preview card for one Feishu task notification.
- Record success or simulated failure in Activity.
- Show a Gmail thread reference for quote provenance or client-review invitation.
- Do not implement retry queues, idempotency infrastructure, or message composers.

The UI labels all integration events as Simulated. Integration failure does not change domain state.

## 18. Technical architecture

Recommended stack:

- React, TypeScript, and Vite.
- React Router.
- TanStack Table.
- Zod for fixture validation.
- A small React state store or reducer with localStorage persistence.
- Vitest for unit and integration-style flow tests.

There is no backend, database, auth system, model call, scraper, or external API dependency.

Suggested source boundaries:

```text
src/
  domain/       pure calculations and business rules
  data/         typed seed fixtures and local repository
  pages/        route-level screens
  components/   reusable product UI
  integrations/ tiny simulated Feishu/Gmail functions
  tests/        domain and flow tests
```

## 19. Validation and failure handling

Implement only failures that materially demonstrate the assignment:

- Invalid Matrix numeric fields.
- Zero expected views.
- Failed blocking constraints.
- Attempt to edit a locked Matrix.
- Stale Matrix after Brief version change.
- Missing real-cycling evidence.
- Historical inquiry mistaken for a current quote.
- Review round not containing 30 eligible candidates.
- Sensitive internal field leaking into client projection.

Do not build broad recovery infrastructure for unlikely cases. Inline validation and explicit blocking messages are enough.

## 20. Tests

The required one-command suite is `npm test`.

Minimum tests:

- Row cost, expected views, row CPM, and blended CPM.
- Budget, views, CPM, YouTube, long-form, market, and scenario constraints.
- Rights cost inclusion.
- Matrix-to-search-package conversion.
- Real-cycling qualification and motorcycle-only rejection.
- Plan/forecast variance.
- Thirty-candidate review validation.
- Client projection field exclusion.
- Feedback-to-gap and replenishment decision.
- Locked-version immutability.
- One integration-style test for the whole seeded flow.

Playwright is excluded from the MVP. Optional engineering work cannot consume the user-acceptance reserve.

## 21. Acceptance walkthrough

The README contains a five-to-eight-minute walkthrough matching the end-to-end flow in section 6.

Key numeric assertions:

- `180,000 / 2,600,000 × 1000 = 69.23`, which passes CPM.
- `180,000 / 2,500,000 × 1000 = 72`, which fails both views and CPM.
- A plan with only two long-form creators fails even if budget and CPM pass.

The demo provides a Reset Demo action so reviewers can always return to the same initial state.

## 22. Required submission artifacts

- `README.md`: setup, run, test, scope, assumptions, mock boundaries, unfinished items, next priorities, and demo path.
- The local Web demo.
- This design specification.
- Search Package JSON example.
- Fixed seed fixtures.
- One-command test suite.
- `decision.md`: AI usage, accepted and rejected suggestions, one bad case, validation method, and next step.

## 23. End-to-end time box and scope guard

The twelve-hour window includes implementation, self-verification, user acceptance, and final corrections. The target schedule is:

- Hours 0–8: implementation of the mandatory path.
- Hour 8–9: automated tests, manual walkthrough, documentation, and handoff packaging.
- Hours 9–11: user acceptance.
- Hours 11–12: acceptance fixes and final packaging.

Engineering must hand off a complete candidate build by hour nine. It must not consume the user-acceptance reserve.

### Must complete

- Fixed campaign shell.
- Brief conflict resolution.
- Two valid Matrix scenarios.
- Real Matrix formulas and blocking constraints.
- Matrix lock and package generation.
- Seeded candidate batches with cycling evidence.
- Thirty-candidate review plus backups.
- Client projection and structured feedback.
- Gap plus backup/replenishment action.
- README, decision log, fixtures, and required tests.

### Deferred until after user acceptance

- Project JSON export/import.
- Advanced table filters.
- Animated transitions.
- Multiple client review rounds beyond the seeded path.
- Additional integration failure controls.
- Browser E2E automation.

These items are not started merely because implementation appears ahead of schedule. Early completion is used for verification and earlier user handoff.

### Explicitly excluded

- Campaign creation and multi-campaign management.
- Real file parsing.
- Real creator search or scraping.
- Real AI calls.
- Real Feishu, Gmail, or WhatsApp integration.
- Authentication and permissions.
- Backend and database.
- Generic workflow builders.
- Generic formula or rule builders.
- Column customization, drag-and-drop, or spreadsheet keyboard parity.
- Production-scale performance and concurrency.

Any new feature must replace an existing item of equal effort; it cannot silently expand the scope.

## 24. Definition of done

The work is complete only when:

- The seeded business loop can be demonstrated without network access or credentials.
- Matrix numbers and constraints are real and tested.
- The cycling-camera context is visible in brief, matrix, evidence, qualification, and feedback.
- Client feedback produces a traceable gap and a non-destructive next action.
- Every mandatory assignment item maps to a screen, file, or test.
- Real and mocked behavior is clearly labeled.
- The project starts and tests with documented commands.
- Reset Demo restores the expected initial state.
