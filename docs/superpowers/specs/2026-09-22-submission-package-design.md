# CreatorOS Submission Package Design

## Goal

Turn the existing, tested Campaign Agent Desk into an evaluator-ready submission without expanding product scope. The package must let an evaluator understand the assignment response, run the demo, follow the end-to-end story, inspect engineering evidence, and see the deliberate mock boundaries without reconstructing context from internal planning files.

## Scope

This pass changes documentation and verification evidence only. It does not add product features, external integrations, a backend, a general-purpose AI model, or additional workflow branches.

The submission package has three evaluator-facing documents:

1. `README.md` remains the entry point. It includes the pre-work disclosure required by the brief, exact setup commands, the five-to-eight-minute walkthrough, implementation versus mock boundaries, known limitations, and links to the other submission documents.
2. `DESIGN.md` is the single consolidated product and system design. It replaces the need for an evaluator to read the internal `docs/superpowers/specs/` files.
3. `docs/最终验收记录.md` is a reproducible acceptance record. It maps assignment requirements to files, UI actions, and tests, and records the final automated verification results.

The existing `decision.md` remains the detailed AI-use and engineering-decision record. The README and DESIGN documents link to it instead of duplicating it in full.

## Information Architecture

### README

The README must answer, in order:

- What the product is and which head-mounted cycling-camera campaign it serves.
- The three required pre-work statements: closest relevant personal experience, work not previously done, and the first minimum loop planned.
- How to install, run, reset, test, and build it.
- What the evaluator should demonstrate in five to eight minutes.
- Which behaviors are deterministic implementation and which are simulated.
- Which branches are intentionally design-only or excluded.
- Where to find consolidated design, AI-use decisions, and acceptance evidence.

The closest-experience statement must come from the candidate. It must not be inferred from repository content or generated as a fictional claim.

### DESIGN.md

The consolidated design contains:

- Problem framing and success criteria.
- Users and responsibility boundaries.
- The complete business loop from source materials to replenishment or upstream revision.
- Agent-first interaction model and human approval gates.
- Core domain objects and their lineage.
- Brief conflict and version rules.
- Matrix formulas, constraints, scenario comparison, and lock semantics.
- Search Package derivation.
- Candidate evidence, hard qualification, fit ranking, and calibration.
- Thirty-client-candidate and ten-backup rules.
- Internal-to-client allow-list projection.
- Client feedback, gap assessment, backup promotion, replenishment, Matrix replan, and Brief revision.
- Integration and data-governance boundaries.
- Architecture, persistence, localization, accessibility, testing, risks, and production follow-ons.

The document distinguishes implemented interactive paths from design-only branches. It states that Promote Backup and Replenishment are interactive, while Replan Matrix and Revise Brief are modeled and recommended but are not full editors.

### Final Acceptance Record

The acceptance record contains:

- A requirement-to-evidence matrix.
- Automated commands and observed results.
- A manual walkthrough checklist in Chinese.
- Submission packaging checks: clean worktree, no secret/API-key dependency, no required network service, and explicit mock labels.
- A residual-risk section that does not overstate browser-level coverage.

Automated test success is not presented as proof of visual quality. The record clearly separates automated verification from the final human click-through.

## Source-of-Truth Rules

- Assignment requirements come from the original brief as already extracted and reviewed in the project thread.
- Implemented behavior comes from current source code and tests, not from aspirational planning documents.
- Product rationale and AI-use boundaries come from `decision.md` and the approved design specs.
- Counts and pass/fail claims are written only after fresh verification.
- Known limitations remain explicit; documentation must not claim that real AI extraction, live creator search, Gmail, Feishu, or customer delivery is implemented.

## Acceptance Criteria

The documentation pass is complete when:

1. An evaluator can start from `README.md` and reach every required submission artifact.
2. The full loop and the deeply implemented Matrix path are described without reading internal specs.
3. The README contains all three pre-work statements and a dedicated limitations section.
4. Every mandatory assignment deliverable maps to at least one repository file, UI interaction, or automated test.
5. `npm test` passes all tests and `npm run build` succeeds in the isolated worktree.
6. The repository contains no `TBD`, `TODO`, or fabricated personal-experience statement in evaluator-facing documents.
7. The changes are committed on the isolated branch and integrated only after verification.
