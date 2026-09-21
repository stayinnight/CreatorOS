# Artifact Transition and Next-Step Guidance

## Context

The Agent Desk has the correct campaign workflow but exposes two interaction gaps:

1. `Open comparison` synchronously replaces the context rail with the artifact inspector. Because there is no opening state or mounted transition, the interface appears to jump.
2. After the Matrix is locked and search packages are generated, the next executable action is hidden inside an artifact. Asking the Agent what to do next produces a status sentence instead of a state-specific action.

The monochrome treatment also overuses 2px corners and hard borders. The result reads as a wireframe rather than a finished operational tool.

## Goals

- Make opening and switching artifacts feel intentional without simulating long-running work.
- Expose exactly one recommended next step for every supported workflow state.
- Let users advance from either the inspector or an Agent answer.
- Retire stale next-action cards so the timeline cannot present conflicting calls to action.
- Keep the monochrome editorial identity while adding enough softness and depth for daily use.

## Non-goals

- No network-backed AI or artificial multi-second loading.
- No generic workflow engine or new global navigation.
- No broad redesign of the inbox, client preview, or candidate review screens.
- No animation framework dependency; CSS transitions are sufficient.

## Interaction model

### Artifact opening lifecycle

Opening an artifact uses a small UI lifecycle separate from campaign domain state:

1. **Idle** — the artifact action is available.
2. **Opening** — the clicked control reads `Opening…`, shows a spinner, and ignores duplicate clicks.
3. **Shell entered** — the inspector slides in from the right while the work area reflows.
4. **Content ready** — header/KPI placeholders crossfade to the real artifact content.

The entire transition lasts 450–600ms. It communicates spatial change, not server latency. Switching between already-open artifacts keeps the shell mounted and crossfades only the content. Closing reverses the shell transition. Under `prefers-reduced-motion`, all delays collapse to effectively zero.

### Recommended next-step resolver

A pure selector derives a single next action from campaign state. The same result powers the inspector guidance and Agent responses.

| State | Current state copy | Recommended action | Result |
|---|---|---|---|
| Mix draft, constraints passing | Mix is ready to lock | Lock Matrix | Creates locked Mix v1 |
| Mix draft, constraints failing | Matrix has blocking constraints | Review failing cells | Focuses the constraint/matrix area; lock remains unavailable |
| Mix locked, no packages | Matrix is locked | Generate search packages | Creates bounded packages from the Matrix |
| Packages ready, sourcing not completed | Search packages are ready | Start 10-person calibration | Builds and opens calibration batch |
| Calibration waiting | Calibration batch needs review | Review calibration | Opens candidate batch |
| Calibration approved, slate not validated | Direction is approved | Validate slate | Runs 30 + 10 validation |
| Review waiting for publication | Slate is projection-safe | Preview client view | Opens preview; publish remains an explicit approval |
| Gap waiting for recovery | Client feedback created a local gap | Recover gap | Opens gap assessment |
| Completed | Run is complete | View result | Opens the latest result artifact |

The selector returns an action identifier, label, explanatory copy, destination/dispatch intent, and availability. It must never return two primary actions.

### Inspector guidance

Every actionable artifact inspector displays a sticky `Recommended next step` panel directly below its header. It contains:

- current stage;
- the reason this action is recommended;
- what will happen after execution;
- one primary button;
- an optional secondary link such as `Review constraints`.

For the Matrix, destructive/test utilities (`Test failure`, `Restore`) remain secondary controls. The primary workflow action moves out of the bottom utility row and into the guidance panel.

### Agent answers

`下一步`, `下一步做什么`, and equivalent English requests resolve through the same next-step selector. The Agent creates an actionable message card instead of a generic text response. Clicking its button executes or opens the exact state-appropriate action.

`当前进度` returns a compact progress card: current step, completed step count, and the next action. It must not merely repeat `Running`.

### Timeline action lifecycle

Only the newest applicable `NextAction` message is interactive. Older actions are visually retained for auditability but rendered as:

- `Completed` when their intended state transition has happened; or
- `Superseded` when the workflow moved on by another route.

Retired cards have no active primary button. Duplicate messages with the same action and run are not appended.

## Visual system adjustments

The interface remains monochrome and editorial, with these shared tokens:

- card and inspector surfaces: `12px` radius;
- buttons and inputs: `9px` radius;
- compact labels/chips: `6px` radius;
- subtle elevation: a low-opacity black shadow plus a one-pixel neutral border;
- hover: one-to-two-pixel upward shift and a slightly stronger shadow;
- active/pressed: return to zero offset;
- focus: retain the existing high-contrast focus ring.

Pills are reserved for statuses. Large content cards do not become pill-shaped. Typography and the black/white palette remain unchanged.

## Motion specification

- Inspector shell: `transform: translateX(18px)` and opacity to rest over 240ms.
- Work-area reflow: 280ms using the same easing curve.
- Inspector placeholder-to-content crossfade: 180ms.
- KPI/content stagger: 40–60ms between small groups, capped at 180ms total.
- Buttons: 140ms hover/press transition.
- Reduced motion: no deliberate wait, transform, or stagger.

Animation must not block keyboard focus. The opening control exposes `aria-busy`; the inspector receives an accessible label and its heading can be focused after entry without trapping focus.

## Data and implementation boundaries

- Keep opening/transition state local to the page/UI layer; do not put animation phases in the campaign reducer.
- Add a pure `getRecommendedNextAction(state)` domain-facing selector.
- Route both Inspector and Agent timeline actions through the selector's stable action identifiers.
- Continue to use existing reducer actions for domain transitions.
- Do not add arbitrary timers to campaign domain logic. The only short timer is the visual opening lifecycle.

## Error and edge behavior

- Double-clicking an opening action dispatches only once.
- Closing during the short opening phase cancels the pending selection.
- A stale timeline card cannot replay a completed action.
- If no supported next action exists, show a neutral completion/status panel without a dead button.
- Constraint failures replace the lock CTA with a focused review action and visible explanation.

## Acceptance criteria

1. Clicking `Open comparison` immediately shows busy feedback, then opens the inspector with a visible but fast transition.
2. The inspector content does not flash blank, and reduced-motion users receive the final content immediately.
3. Cards and controls use the approved 12/9/6px radius hierarchy and subtle depth.
4. In every seeded workflow state, there is at most one recommended primary action.
5. At the screenshot's `Source and quality candidates · Running` state, asking `下一步做什么` returns a card that opens/starts the 10-person calibration flow.
6. Matrix guidance changes correctly from lock, to package generation, to calibration.
7. Previous next-action cards display `Completed` or `Superseded` and cannot dispatch again.
8. Existing campaign flow tests remain green; new tests cover selector mapping, stale-action retirement, duplicate-click prevention, and reduced-motion behavior.

