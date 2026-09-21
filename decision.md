# Product and engineering decisions

## Chosen product shape

This is a campaign workspace, not a generic CRM or an AI chat surface. The navigation mirrors the actual decision loop: Overview → Brief → Mix Planner → Search & Candidates → Client Review → Activity. The head-mounted cycling camera stays visible in the proof requirements, Matrix cells, candidate evidence, and client recovery flow.

The Matrix receives the deepest implementation because it makes downstream quality measurable. Every row binds market, platform, riding scenario, format, creator count, unit economics, expected relevant views, rights cost, and a search multiplier. Derived totals and blocking constraints are computed rather than presented as static mock values.

## Deliberate assumptions

- The $180,000 cap includes rights.
- “High-quality long-form” is represented by native YouTube long reviews and verified real-cycling proof.
- Brief conflicts are resolved to an eight-week launch, while motorcycle and skiing remain outside the current scope.
- Scenario A is the walkthrough path; Scenario B proves comparison without creating a generic scenario builder.
- Round 1 contains exactly 30 qualified primaries and retains 10 qualified backups internally.
- Select and Maybe count toward forecast coverage; Pass does not.
- Backup promotion is preferred over replenishment because it preserves the approved brief and locked plan.

## AI use and control boundary

AI assisted requirement decomposition, formula/test drafting, UI exploration, and documentation. Runtime behavior does not depend on an AI model. Brief publication, formulas, qualification, field projection, and gap decisions are deterministic and covered by tests.

The implementation intentionally rejects:

- AI as final creator selector;
- opaque composite scores;
- runtime extraction pretending to be reliable without a model or source system;
- a generalized rules engine, command bus, event store, or connector framework;
- silent mutation of the locked Matrix after client feedback.

The ranking formula is visible and fixed: relevance 35%, production 20%, performance stability 20%, commercial fit 15%, and audience fit 10%. Blocking evidence rules always outrank that score.

## Bad case used for proof

`creator-moto-only` / **Torque Atlas** has strong POV reach but only motorcycle evidence. `qualifyCandidate` disqualifies it with `No verified real-cycling evidence`; `src/tests/candidate.test.ts` locks this behavior. `creator-missing-evidence` is routed to Needs Review rather than being guessed into qualification.

## Privacy boundary

`toClientCandidate` creates a new allow-listed object. It never clones an internal object and deletes fields afterward. Historical pricing, internal notes, score detail, Gmail thread IDs, payment terms, and primary/backup strategy therefore cannot cross the client projection. `src/tests/projection.test.ts` asserts the boundary.

## Production follow-ons

If this concept advances, the next investments would be authenticated roles, a server-owned campaign model, source ingestion with human confirmation, real provider adapters, audit identities/timestamps, accessibility testing, and observability. They are not required to validate this product loop and were excluded to keep the code maintainable within the assignment window.
