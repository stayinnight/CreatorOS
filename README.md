# Creator Mix Planner

A deterministic, locally runnable campaign-planning demo for a **cycling head-mounted camera launch in the US and UK**. It closes the loop from inconsistent source material to a locked creator Matrix, evidence-qualified creators, client feedback, and targeted replenishment.

The Matrix is the deep path: its cost, views, CPM, coverage constraints, version lock, search-package generation, forecast gap, and recovery actions are real TypeScript domain logic. Feishu, Gmail, public discovery, and quote collection are explicitly simulated.

## Run locally

Requirements: Node 18.18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. State is saved in `localStorage`; use **Reset demo** in the header to restore the fixed starting fixture.

```bash
npm test
npm run build
```

## Five-to-eight-minute walkthrough

1. **Overview** — establish the product truth: a cycling head-mounted camera needs real Road, MTB, and Urban proof rather than generic action-sports reach.
2. **Brief** — inspect Email, Excel, and Meeting Notes. Resolve launch timing to **8 weeks** and keep motorcycle/skiing **pending and excluded**, then publish Brief v1.
3. **Mix Planner** — compare *Credibility First* and *Reach Efficiency*. In Scenario A, click **Simulate long-form gap** to see hard constraints block locking, then **Restore scenario**, lock Matrix v1, and generate six search packages.
4. **Search & Candidates** — inspect bounded package criteria, load two seeded batches, and audit the qualification queue. Open **Torque Atlas** to see a high-reach motorcycle creator disqualified because there is no verified real-cycling evidence. Open **Open Air Edit** to see missing evidence routed to human review.
5. **Client Review** — publish exactly 30 qualified primary creators while 10 backups remain internal. Switch to the client projection and observe that internal scores, notes, historical prices, payment terms, and backup roles are absent.
6. Apply the seeded client feedback. UK Urban passes create a traceable forecast gap without mutating the locked plan. **Promote backup**, then **Create replenishment** for the remaining cell.
7. **Activity** — review the chronological audit and clearly labelled Feishu/Gmail simulation previews.

## Acceptance checks

- Budget ≤ $180,000 including rights; views ≥ 2.6M; blended CPM ≤ $70.
- YouTube exists, at least three long-form creators exist, and US/UK plus Road/MTB/Urban are covered.
- Search packages preserve Brief, Matrix, and Matrix-cell lineage.
- Real cycling evidence is blocking; motorcycle-only and missing-evidence cases cannot silently enter the client slate.
- Round 1 has exactly 30 client candidates plus at least 10 hidden backups.
- Client projection is built by explicit field selection and is covered by a leakage test.
- Feedback changes the forecast only; it never edits the locked Matrix.
- Gap recovery chooses backup promotion before creating a child replenishment package.

## Scope boundary

Included: one fixed campaign, two Matrix scenarios, deterministic fixtures, pure domain calculations, candidate evidence/qualification, review projection, gap recovery, local persistence, and responsive UI.

Excluded: backend, authentication, database, live AI extraction, live creator search, scraping, real messaging, quote negotiation, generic workflow infrastructure, and production concurrency. These are deliberate take-home boundaries, not hidden mocks.

## Project map

- `src/domain/` — testable business logic.
- `src/data/seed.ts` — 42-profile deterministic campaign fixture.
- `src/pages/` — six workflow surfaces.
- `src/tests/` — formulas, gates, projection safety, persistence, and full seeded flow.
- `fixtures/search-package.example.json` — one exported downstream contract.
- `decision.md` — product/engineering decisions and AI disclosure.
- `docs/superpowers/specs/` — approved product specification.
