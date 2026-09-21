# Bilingual Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent global English/Chinese switch that localizes all system-owned UI, Agent output, and mock business prose while leaving user content and stable identifiers unchanged.

**Architecture:** A dependency-free `LanguageProvider` owns presentation locale separately from campaign state. Typed dictionaries and focused formatters translate stable UI keys, enum values, Agent message keys, tool kinds, and seed entity fields at render time; canonical campaign data remains unchanged.

**Tech Stack:** React 19, TypeScript 5.7, React Router 6, Zod 4, Vitest, jsdom, Vite.

## Global Constraints

- The only supported locales are `"en"` and `"zh-CN"`; a fresh or invalid preference defaults to `"en"`.
- Do not add a third-party localization dependency.
- The locale is stored under `creator-mix-planner:locale:v1` and is not removed by campaign reset.
- System-owned UI, Agent content, and mock business prose switch immediately without rerunning workflow actions.
- User-authored text, creator names/handles, IDs, URLs, platform names, and required product/brand proper nouns remain unchanged.
- Canonical campaign state stays language-neutral; never create a second translated campaign seed.
- Missing localization data must display the canonical English fallback and must not throw.

---

### Task 1: Build the locale runtime and persistence boundary

**Files:**
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/LanguageProvider.tsx`
- Create: `src/tests/languageProvider.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `Locale = "en" | "zh-CN"`.
- Produces: `TranslationKey = keyof typeof en`.
- Produces: `translate(locale, key, params?)`, `useLanguage()`, and `LANGUAGE_STORAGE_KEY`.
- Consumes: browser `localStorage` and `document.documentElement.lang` only; it must not consume campaign state.

- [ ] **Step 1: Write failing runtime tests**

Add tests that mount a probe inside the provider and verify default English, Chinese selection, refresh initialization, invalid-value fallback, `<html lang>`, and a safe storage-write failure:

```tsx
function Probe() {
  const { locale, setLocale, t } = useLanguage();
  return <><output>{locale}:{t("nav.inbox")}</output><button onClick={() => setLocale("zh-CN")}>switch</button></>;
}

it("defaults to English and persists Chinese independently", () => {
  localStorage.clear();
  const view = render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(view.getByText("en:Inbox")).toBeTruthy();
  fireEvent.click(view.getByText("switch"));
  expect(view.getByText("zh-CN:收件箱")).toBeTruthy();
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
  expect(document.documentElement.lang).toBe("zh-CN");
});

it("falls back to English for an invalid stored locale", () => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");
  const view = render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(view.getByText("en:Inbox")).toBeTruthy();
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `npm test -- src/tests/languageProvider.test.tsx`

Expected: FAIL because `LanguageProvider` and the dictionary do not exist.

- [ ] **Step 3: Implement the typed dictionary and translator**

Create a flat English source dictionary and a Chinese dictionary constrained to the same keys. Start with the runtime and shell keys needed by Tasks 1–2; later tasks extend both objects together.

```ts
export const en = {
  "nav.inbox": "Inbox",
  "nav.campaigns": "Campaigns",
  "nav.runs": "Runs",
  "language.label": "Language",
  "language.english": "EN",
  "language.chinese": "中文",
} as const;

export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;

const zhCN: Record<TranslationKey, string> = {
  "nav.inbox": "收件箱",
  "nav.campaigns": "项目",
  "nav.runs": "运行记录",
  "language.label": "语言",
  "language.english": "EN",
  "language.chinese": "中文",
};

export function translate(locale: Locale, key: TranslationKey, params: TranslationParams = {}) {
  const template = (locale === "zh-CN" ? zhCN[key] : en[key]) ?? en[key];
  return Object.entries(params).reduce((copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)), template);
}
```

Keep `Locale` in `messages.ts` or a small `types.ts`, but expose one public type and avoid a circular import.

- [ ] **Step 4: Implement the provider and mount it above campaign state**

```tsx
export const LANGUAGE_STORAGE_KEY = "creator-mix-planner:locale:v1";

function initialLocale(): Locale {
  try { return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh-CN" ? "zh-CN" : "en"; }
  catch { return "en"; }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch { /* current session still works */ }
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, toggleLocale: () => setLocale((item) => item === "en" ? "zh-CN" : "en"), t: (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params) }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
```

Wrap `<BrowserRouter>` with `<LanguageProvider>` in `src/main.tsx`. Leave `CampaignProvider` and its persistence unchanged.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/tests/languageProvider.test.tsx src/tests/persistence.test.ts`

Expected: both files PASS; campaign persistence tests still prove reset behavior.

```bash
git add src/i18n src/main.tsx src/tests/languageProvider.test.tsx
git commit -m "feat: add persistent language runtime"
```

### Task 2: Add the global switch and localize the application shell

**Files:**
- Create: `src/components/LanguageToggle.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/pages/InboxPage.tsx`
- Modify: `src/pages/RunsPage.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/pages/ClientPreviewPage.tsx`
- Modify: `src/styles.css`
- Modify: `src/i18n/messages.ts`
- Create: `src/tests/languageShell.test.tsx`
- Modify: `src/tests/appShell.test.tsx`

**Interfaces:**
- Consumes: `useLanguage()` from Task 1.
- Produces: `<LanguageToggle />`, a two-option accessible global segmented control.

- [ ] **Step 1: Write failing shell-switch tests**

Render `<App />` inside `LanguageProvider` and `MemoryRouter`. Assert English initially, then click `中文` and assert navigation, reset button, page heading, timeline accessibility label, and one empty-state string change. Also assert the route and campaign state did not change.

```tsx
expect(screen.getByRole("navigation", { name: "Work navigation" })).toBeTruthy();
fireEvent.click(screen.getByRole("button", { name: "切换到中文" }));
expect(screen.getByRole("navigation", { name: "工作区导航" })).toBeTruthy();
expect(screen.getByText("重置演示")).toBeTruthy();
expect(screen.getByText("活动项目")).toBeTruthy();
```

- [ ] **Step 2: Run the shell test and confirm RED**

Run: `npm test -- src/tests/languageShell.test.tsx`

Expected: FAIL because there is no language switch and shell copy is static.

- [ ] **Step 3: Implement the accessible segmented switch**

```tsx
export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  return <div className="language-toggle" role="group" aria-label={t("language.label")}>
    <button type="button" aria-pressed={locale === "en"} aria-label={locale === "en" ? t("language.currentEnglish") : t("language.switchEnglish")} onClick={() => setLocale("en")}>EN</button>
    <button type="button" aria-pressed={locale === "zh-CN"} aria-label={locale === "zh-CN" ? t("language.currentChinese") : t("language.switchChinese")} onClick={() => setLocale("zh-CN")}>中文</button>
  </div>;
}
```

Place it in `.global-rail` below the wordmark. Style it as a rounded monochrome pill with visible selected, hover, and `:focus-visible` states. Do not change the global grid dimensions.

- [ ] **Step 4: Migrate shell and route-page copy**

Add keys and replace visible literals in the five listed page files and `App.tsx`. Include headings, navigation, reset confirmation, reset action, workspace note, status fallback, accessibility labels, loading labels, empty states, page instructions, and preview controls. Keep `Campaign OS`, `GlobalStar`, campaign/product names, platform names, IDs, and URLs as canonical proper nouns.

Use explicit formatted keys for counts:

```ts
"runs.count.one": "{count} run",
"runs.count.many": "{count} runs",
"inbox.materials": "{count} source materials",
```

Choose one/many at the component call site; do not add a pluralization engine.

- [ ] **Step 5: Run shell tests and commit**

Run: `npm test -- src/tests/languageShell.test.tsx src/tests/appShell.test.tsx src/tests/monochromeShell.test.tsx`

Expected: all listed files PASS in both locales.

```bash
git add src/app src/pages src/components/LanguageToggle.tsx src/i18n/messages.ts src/styles.css src/tests/languageShell.test.tsx src/tests/appShell.test.tsx
git commit -m "feat: add global bilingual shell"
```

### Task 3: Localize structured workflow and mock business content

**Files:**
- Create: `src/i18n/formatters.ts`
- Create: `src/i18n/entityCopy.ts`
- Modify: `src/i18n/messages.ts`
- Modify: `src/components/StatusBadge.tsx`
- Modify: `src/components/ConstraintPanel.tsx`
- Modify: `src/components/MatrixTable.tsx`
- Modify: `src/components/MatrixRowDrawer.tsx`
- Modify: `src/components/CandidateDrawer.tsx`
- Modify: all files under `src/components/agent/` except `TypewriterAnswer.tsx`, `useAgentTurn.ts`, `useArtifactTransition.ts`, and `useChatScroll.ts`
- Create: `src/tests/domainLocalization.test.tsx`
- Modify: `src/tests/qualificationInspector.test.tsx`

**Interfaces:**
- Produces: `formatStatus(t, value)`, `formatDomainValue(t, value)`, and `localizedEntityField(locale, entityType, id, field, fallback)`.
- Consumes: canonical enum/string values and stable entity IDs; never mutates them.

- [ ] **Step 1: Write failing formatter and representative artifact tests**

Cover status/domain values plus Brief, Matrix, Candidate Qualification, Review, and Gap views. Assert creator identity and URLs remain byte-for-byte equal in both locales.

```tsx
expect(formatStatus(zhT, "WaitingForApproval")).toBe("等待批准");
expect(formatDomainValue(zhT, "Long Review")).toBe("长视频评测");
expect(localizedEntityField("zh-CN", "candidate", "candidate-riley", "internalNote", "fallback")).not.toBe("fallback");
expect(chineseView.getByText("@riley.rides")).toBeTruthy();
expect(chineseView.getByRole("link").getAttribute("href")).toBe(sourceUrl);
```

- [ ] **Step 2: Run domain tests and confirm RED**

Run: `npm test -- src/tests/domainLocalization.test.tsx src/tests/qualificationInspector.test.tsx`

Expected: FAIL because formatters and localized entity fields do not exist.

- [ ] **Step 3: Implement exhaustive formatters**

Define typed maps for the finite values in `domain/model.ts` and `agent/model.ts`: run/step/artifact status, artifact kind, candidate decision/role, qualification status, gate status, evidence confidence, source type, riding scenario, creator tier, content format, proof point, rights usage/territory, review status, calibration decision, reject reason, and recommended action.

```ts
const statusKeys = {
  Ready: "status.ready",
  Running: "status.running",
  WaitingForApproval: "status.waitingForApproval",
  Approved: "status.approved",
} as const satisfies Partial<Record<string, TranslationKey>>;

export function formatStatus(t: Translator, value: string) {
  const key = statusKeys[value as keyof typeof statusKeys];
  return key ? t(key) : value;
}
```

Unknown values return themselves. Do not translate creator identity, platform names, markets, IDs, or URLs.

- [ ] **Step 4: Implement stable entity-field localization**

Use a dictionary keyed by stable IDs and fields for seed prose such as source titles/excerpts, conflict labels/options, Matrix scenario strategy and row notes, package rules, batch notes, artifact summaries, candidate notes/reasons/comments, evidence descriptions, quote deliverables/availability/payment terms, decision copy, and Review/Gap explanations.

```ts
type EntityType = "briefSource" | "briefConflict" | "matrixScenario" | "matrixRow" | "searchPackage" | "batch" | "candidate" | "artifact" | "decision";

const zhEntityCopy: Record<string, string> = {
  "briefSource.source-email.title": "客户启动邮件",
  "matrixScenario.scenario-balanced.strategy": "在覆盖、预算和长视频深度之间取得平衡",
  "candidate.candidate-riley.internalNote": "真实公路骑行与稳定的第一视角证据",
};

export function localizedEntityField(locale: Locale, type: EntityType, id: string, field: string, fallback: string) {
  if (locale === "en") return fallback;
  return zhEntityCopy[`${type}.${id}.${field}`] ?? fallback;
}
```

Populate every visible system-owned seed field found in `src/data/seed.ts`; do not translate names, handles, product names, platforms, IDs, or URLs.

- [ ] **Step 5: Migrate structured components**

Replace hard-coded visible UI copy with `t`, enum rendering with formatters, and seed prose rendering with `localizedEntityField`. Cover all artifact inspectors, cards, rails, Candidate/Matrix drawers, calibration controls, next-step guidance, loading/error/empty states, and accessibility labels.

Do not alter action payload values. A localized rejection label must still dispatch the canonical `RejectReason` value.

- [ ] **Step 6: Run component tests and commit**

Run: `npm test -- src/tests/domainLocalization.test.tsx src/tests/qualificationInspector.test.tsx src/tests/artifactTransition.test.tsx src/tests/recommendedNextStep.test.tsx`

Expected: all listed files PASS.

```bash
git add src/i18n src/components src/tests/domainLocalization.test.tsx src/tests/qualificationInspector.test.tsx
git commit -m "feat: localize workflow artifacts and demo copy"
```

### Task 4: Make Agent messages and execution stages locale-aware

**Files:**
- Modify: `src/agent/model.ts`
- Modify: `src/data/seedSchema.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/agent/agentTurn.ts`
- Modify: `src/agent/actions.ts`
- Modify: `src/agent/workflow.ts`
- Modify: `src/agent/runRevision.ts`
- Modify: `src/agent/facts.ts`
- Modify: `src/agent/recommendedAction.ts`
- Modify: `src/agent/intent.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Modify: `src/components/agent/AgentTurnTrace.tsx`
- Modify: `src/components/agent/AgentWorking.tsx`
- Modify: `src/components/agent/TypewriterAnswer.tsx`
- Modify: `src/i18n/messages.ts`
- Create: `src/i18n/agentCopy.ts`
- Create: `src/tests/agentLocalization.test.tsx`
- Modify: `src/tests/agentTurnUi.test.tsx`

**Interfaces:**
- Extends `AgentMessage` with optional `messageKey?: TranslationKey` and `messageParams?: Record<string, string | number>`.
- Produces: `localizeAgentMessage(locale, message)`, `localizeToolStep(locale, step)`, and `localizeTurnUnderstanding(locale, turn)`.
- Preserves `text`, `label`, `summary`, and `understanding` as canonical English fallbacks for old stored state.

- [ ] **Step 1: Write failing Agent localization tests**

Create a system message with a key and a user message with identical English text. Switch locales and assert only the system message changes. Cover generated parameter interpolation, tool stage headings, tool labels, a completed trace, and a legacy message with no key.

```tsx
const system = { ...baseMessage, role: "Agent", text: "30 candidates ready", messageKey: "agent.slate.ready", messageParams: { primaryCount: 30, backupCount: 10 } };
const user = { ...baseMessage, id: "user", role: "User", text: "30 candidates ready" };
expect(localizeAgentMessage("zh-CN", system)).toBe("客户名单已就绪：30 位主选，10 位内部备选");
expect(localizeAgentMessage("zh-CN", user)).toBe("30 candidates ready");
expect(localizeAgentMessage("zh-CN", { ...system, messageKey: undefined })).toBe("30 candidates ready");
```

- [ ] **Step 2: Run Agent tests and confirm RED**

Run: `npm test -- src/tests/agentLocalization.test.tsx src/tests/agentTurnUi.test.tsx`

Expected: FAIL because message metadata and Agent copy helpers do not exist.

- [ ] **Step 3: Add backward-compatible message metadata**

```ts
export interface AgentMessage {
  // existing fields remain unchanged
  messageKey?: TranslationKey;
  messageParams?: Record<string, string | number>;
}
```

Update the Zod message schema with optional fields defaulting to `undefined`. Confirm old serialized state parses without migration.

- [ ] **Step 4: Attach semantic keys at every deterministic message creation site**

For seed, workflow helpers, reducer actions, fact answers, scope revision, recommendations, exceptions, Agent replies, artifact summaries, and next actions:

- Keep canonical English `text`.
- Add a stable `messageKey`.
- Put counts, status values, names, costs, or evidence counts in `messageParams`.
- Never attach a system key to a user-role message.

Use separate keys for materially different sentences; do not use exact-string lookup or translate after concatenation.

```ts
messages.push({
  id: "message-next-review",
  role: "Agent",
  type: "NextAction",
  text: "Calibration approved. I can validate the 30 + 10 slate and prepare the client review.",
  messageKey: "agent.calibration.approvedNextReview",
  messageParams: { primaryCount: 30, backupCount: 10 },
  payloadRef: "prepare-review",
  runId: agent.activeRunId,
  createdAt: "2026-09-21T09:55:30+08:00",
});
```

- [ ] **Step 5: Localize stage and tool presentation from stable kinds**

`agentCopy.ts` maps `AgentToolKind` and `RunStep["kind"]` to label/summary keys. `AgentTurnTrace` renders these explicit localized headings:

```ts
const phaseKey = {
  Understanding: "agent.phase.thinking",
  RunningTools: "agent.phase.action",
  Composing: "agent.phase.answer",
  Completed: "agent.phase.completed",
} as const;
```

English values are `Thinking · Understanding task`, `Action · Calling tools`, and `Answer · Organizing result`; Chinese values are `思考 · 正在理解任务`, `行动 · 正在调用工具`, and `回答 · 正在组织结果`.

`AgentTimeline` calls `localizeAgentMessage` before `TypewriterAnswer`. Locale changes must render the complete translated answer immediately and must not replay the typewriter animation for historical messages.

- [ ] **Step 6: Run Agent regression tests and commit**

Run: `npm test -- src/tests/agentLocalization.test.tsx src/tests/agentTurnUi.test.tsx src/tests/agentTurn.test.ts src/tests/agentActionProcess.test.tsx src/tests/agentDemoFlow.test.ts src/tests/agentMatrixFlow.test.ts src/tests/agentReviewFlow.test.ts`

Expected: all listed tests PASS and canonical reducer behavior is unchanged.

```bash
git add src/agent src/app/campaignReducer.ts src/data src/components/agent src/i18n src/tests/agentLocalization.test.tsx src/tests/agentTurnUi.test.tsx
git commit -m "feat: localize agent execution and replies"
```

### Task 5: Complete source audit and protect the language boundary

**Files:**
- Modify: remaining production files reported by the audit
- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/entityCopy.ts`
- Create: `src/tests/localizationCoverage.test.tsx`
- Create: `docs/验收流程-中英切换.md`

**Interfaces:**
- Consumes: all localization interfaces from Tasks 1–4.
- Produces: an end-to-end bilingual acceptance test and a Chinese manual verification sequence.

- [ ] **Step 1: Write the failing end-to-end coverage test**

Drive the deterministic demo through material analysis, decision resolution, Matrix generation/lock, sourcing/calibration, and Review. Capture visible system copy in English, switch to Chinese midway, and assert representative copy from every stage is Chinese while state IDs and a typed user message are unchanged. Switch back and assert the English rendering returns.

- [ ] **Step 2: Run the coverage test and confirm any remaining RED**

Run: `npm test -- src/tests/localizationCoverage.test.tsx`

Expected: FAIL on the first remaining untranslated system-owned string or missing semantic message key.

- [ ] **Step 3: Audit production literals and close explicit gaps**

Run:

```bash
rg -n '>[[:space:]]*[A-Za-z\p{Han}]|aria-label=|placeholder=|title=' src/app src/pages src/components
rg -n 'text:|label:|summary:|question:|recommendation:|rationale:|error:' src/agent src/app/campaignReducer.ts src/data/seed.ts
```

Classify every hit as one of:

- translation key call;
- canonical proper noun or protected user/entity identity;
- non-visible implementation value;
- missing localization to fix now.

Do not silence the audit by translating stable IDs, URLs, platform names, or action payload values.

- [ ] **Step 4: Add the Chinese manual acceptance guide**

Document this exact sequence:

1. Clear only `creator-mix-planner:locale:v1`; open the app and verify English.
2. Analyze three materials and observe English Thinking/Action/Answer stages.
3. Switch to Chinese and verify the current timeline, Inspector, mock Brief, and next action update without losing progress.
4. Type a Chinese user message and verify it remains unchanged when switching to English.
5. Continue through Matrix, sourcing/calibration, Review, and Gap; verify system copy follows the selected locale.
6. Refresh and verify locale persistence.
7. Reset the demo and verify campaign state resets while locale remains selected.
8. Confirm creator handles, IDs, URLs, platforms, and proper nouns are identical in both languages.

- [ ] **Step 5: Run the complete verification suite**

Run: `npm test`

Expected: every test file passes with zero failures.

Run: `npm run build`

Expected: TypeScript and Vite production build exit with code 0.

- [ ] **Step 6: Commit the completed audit**

```bash
git add src docs/验收流程-中英切换.md
git commit -m "test: verify complete bilingual workflow"
```

### Task 6: Final manual verification and integration

**Files:**
- Verify: all files changed in Tasks 1–5

**Interfaces:**
- Consumes: the completed bilingual application and Chinese acceptance guide.
- Produces: verified branch ready for the user-selected integration method.

- [ ] **Step 1: Start the isolated worktree application**

Run: `npm run dev -- --host 0.0.0.0`

Expected: Vite serves the application without runtime errors.

- [ ] **Step 2: Execute the documented browser acceptance flow**

Follow `docs/验收流程-中英切换.md` from a clean browser profile. Record any untranslated or clipped system-owned text as a failing defect and fix it before continuing.

- [ ] **Step 3: Re-run fresh automated verification after manual fixes**

Run: `npm test && npm run build`

Expected: zero test failures and build exit code 0.

- [ ] **Step 4: Review diff and commits**

Run:

```bash
git diff --check master...HEAD
git status --short
git log --oneline master..HEAD
```

Expected: no whitespace errors, no unintended uncommitted files, and focused commits matching Tasks 1–5.

- [ ] **Step 5: Hand off for integration**

Use the previously selected local-merge workflow unless the user changes direction. Merge only after verification passes, then rerun `npm test` and `npm run build` on the merged branch before removing the owned worktree.
