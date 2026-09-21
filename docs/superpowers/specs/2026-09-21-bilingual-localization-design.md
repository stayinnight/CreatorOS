# Bilingual Localization Design

## Goal

Add a global English/Chinese language switch to Campaign OS. English is the default. Switching language updates all system-owned interface and demo content immediately without resetting or rerunning campaign work.

## Scope

The selected language applies to:

- Global navigation, buttons, headings, labels, status text, empty states, confirmations, validation, and error messages.
- Agent stage copy, tool names, summaries, replies, recommendations, and generated system messages.
- Mock Brief, Matrix, Candidate, Calibration, Gap, and Review business prose.
- Accessibility labels, loading descriptions, and next-step guidance.

The following values always remain unchanged:

- User-authored chat input.
- Creator names and handles.
- Campaign, Run, Artifact, Candidate, and Source identifiers.
- URLs, platform names, and required brand or product proper nouns.

Adding more languages, machine translation, locale-specific routing, and server-side locale negotiation are out of scope.

## Chosen Approach

Use a small, typed localization layer built inside the application. Do not add a third-party i18n dependency.

This approach fits a deterministic two-language demo: it keeps bundle and setup costs low, makes missing keys visible to TypeScript, and avoids duplicating pages or business state. A full i18n framework would add concepts that this application does not need, while two copies of the seed or UI would drift.

## Architecture

### Language context

Create `src/i18n/LanguageProvider.tsx` with:

- `Locale = "en" | "zh-CN"`.
- A provider that initializes from the language storage key and otherwise uses `"en"`.
- `useLanguage()` returning `locale`, `setLocale`, `toggleLocale`, and `t`.
- An effect that writes the selected locale to storage and sets `document.documentElement.lang`.

`LanguageProvider` wraps `CampaignProvider`. Locale is presentation state, not campaign state, so resetting the campaign cannot reset the selected language.

### Typed dictionaries

Create focused dictionary modules under `src/i18n/`:

- `messages.ts`: English and Chinese dictionaries plus interpolation.
- `keys.ts`: the inferred or declared `TranslationKey` type.
- `formatters.ts`: status, count, date, and structured domain label helpers.
- `entityCopy.ts`: localized mock prose selected by stable entity ID and field.

English is the source dictionary. The Chinese dictionary must satisfy the same key type. `t(key, params)` returns the English value if a runtime lookup is ever missing; it must never render an empty label or throw the page.

Interpolation supports named scalar parameters only. Plural-sensitive sentences use explicit singular and plural keys rather than a general pluralization engine.

### Canonical business state

Campaign state remains language-neutral. Enums such as `Ready`, `Running`, and `Approved`, identifiers, numeric values, and URLs are not rewritten when the locale changes. Components translate them at render time through formatters.

No separate Chinese campaign seed is created. Localized mock prose is resolved with stable entity identifiers, for example a candidate ID plus `rationale`, with the current canonical string as the safe English fallback.

### Agent messages

System-generated messages gain optional semantic localization metadata:

```ts
interface LocalizedMessage {
  messageKey?: TranslationKey;
  messageParams?: Record<string, string | number>;
}
```

The existing `text` field remains the canonical English fallback and preserves compatibility with stored state and existing tests. New deterministic system messages set `messageKey` and parameters when they are created. At render time:

- User-role messages always render `text` unchanged.
- Agent/system messages render `t(messageKey, messageParams)` when a key exists.
- Legacy messages without a key render `text` unchanged.

Agent tool steps use their stable tool `kind` to resolve localized labels and summaries. Their execution behavior, duration, and state transitions do not depend on locale.

## User Interface

The global rail contains an accessible segmented control labeled `Language` in English and `语言` in Chinese. It contains `EN` and `中文` options, uses the existing monochrome palette and rounded control language, and shows a visible selected and keyboard-focus state.

Switching is immediate and does not navigate, scroll the timeline, close the Inspector, change the active Run, or replay a typewriter animation. The control remains available on Inbox, Campaign, Runs, Client Preview, and nested Run routes.

The viewport does not need to preserve identical line breaks across languages, but controls must not clip at supported desktop widths. Existing responsive behavior remains in place.

## Data Flow

1. On application startup, `LanguageProvider` reads its dedicated storage key.
2. Missing or invalid values resolve to English.
3. Components call `t`, domain formatters, or entity-copy selectors during render.
4. The user selects `EN` or `中文`.
5. The provider updates locale, the React tree rerenders, and `<html lang>` and local storage update.
6. Campaign state, persisted workflow progress, selected artifacts, user text, and scroll state remain unchanged.

## Persistence and Reset

Use a dedicated versioned key such as `creator-mix-planner:locale:v1`. `resetState()` continues to delete only campaign data keys. It must not remove the locale key.

If storage is unavailable or contains an unsupported locale, initialization falls back to English. Storage write failure does not block switching for the current session.

## Migration Strategy

Migration happens by content category so each stage stays testable:

1. Add the provider, dictionaries, formatters, and global switch.
2. Migrate app shell, route pages, and accessibility/loading copy.
3. Migrate structured artifact views and domain status labels.
4. Add semantic keys to deterministic Agent messages and tool stages.
5. Localize mock business prose through stable entity selectors.
6. Scan production source for remaining system-owned visible literals and classify any intentional proper nouns.

Old persisted campaign data remains readable. No destructive storage migration is required.

## Error Handling

- Invalid stored locale: use English and overwrite it on the next successful selection.
- Missing translation at runtime: return the English dictionary value or supplied canonical fallback.
- Legacy system message without localization metadata: display its existing text.
- User message that matches known system copy: never translate it because role ownership takes precedence.
- Unknown enum or entity ID: show the canonical value rather than a blank or fabricated translation.

## Testing

Automated tests cover:

- English is selected when no locale has been stored.
- Selecting Chinese changes shell, workflow, Agent-stage, and artifact copy immediately.
- Switching back to English restores English copy.
- Refresh initialization uses the stored choice.
- Resetting campaign state does not reset locale.
- `<html lang>` tracks the selection.
- User-authored text, creator handles, IDs, and URLs do not change.
- Existing system messages with semantic keys switch language after creation.
- Legacy messages without keys still render safely.
- Missing/invalid locale values fall back to English.
- Full existing test suite and production build remain green.

Manual acceptance follows one complete flow in English, switches to Chinese midway, completes the flow, then switches back to English. The reviewer confirms that state and selections are preserved and that no visible system-owned copy remains in the previous language.

## Acceptance Criteria

1. A new browser profile opens the product in English.
2. A single global control switches all in-scope current content to Chinese and back without page reload.
3. The chosen locale survives refresh and campaign reset.
4. Generated Agent content and its Thinking/Action/Answer process use the selected language.
5. Existing and new workflow progress is identical before and after a language change.
6. User input, creator identity, IDs, URLs, platform names, and required proper nouns remain unchanged.
7. Invalid or old local storage never prevents the product from rendering.
8. Automated tests and the production build pass.
