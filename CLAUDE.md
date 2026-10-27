# CLAUDE.md: Culprit

Culprit is an iPhone-first (Android second) subscription app: "Find the foods wrecking your stomach, without logging a thing."
A 60-second quiz produces a week of stomach-friendly dinners priced at the user's store. The plan runs a guided
elimination → reintroduction program; the only daily input is one tap at night. The full product spec is
`docs/SPEC.md` (the original build prompt). This file is the working summary: keep it updated with decisions.

## Working agreement

- Build **one phase at a time** (see the phase plan below). After each phase: run lint + typecheck + tests, commit with a
  clear message, summarize what's done and what the owner needs to provide (keys, accounts, assets), then **stop and
  wait for "next phase"**.
- **Ask before adding any dependency** not listed in "Stack" below.
- **Never invent** statistics, reviews, ratings, user counts, testimonials or medical claims. Only the sourced stats in
  `docs/SPEC.md` §17 may appear, with their sources. Prices are always labelled "est.".
- **Never call an LLM or AI API from the app.** AI is used only offline in `/data-pipeline` to draft content, which is
  then derived, validated by scripts and human-reviewed.

## Non-negotiable product rules

1. **Zero work:** the user never logs meals. One tap per day (max two, plus a test-day yes/no).
2. **Preloaded, not generated:** recipes, ingredients, tags, prices, tests and education ship as versioned JSON in
   `/assets/data`, loaded into SQLite on first launch and on content-version change.
3. **Offline-first and private:** health data (check-ins, results, safety answers) stays in on-device SQLite. Nothing
   health-related goes to analytics or any server.
4. **Never a diagnosis:** the app finds patterns to test. Red-flag symptoms route to a doctor.
5. **Instant value:** the user sees their own real first week (engine output) before the paywall.
6. **Premium and fun:** one question per screen, big buttons, haptics, smooth motion. Detective theme: warm, not cheesy.

## Safety and legal (built in from day one)

- **Age:** under 13 blocked. 13–17: no gut elimination program (friendly "18+" screen); later skin mode allowed without
  diet experiments. 18+: everything. Alcohol test only 21+ and opt-in.
- **Red flags** in onboarding (blood/black stool, weight loss, swallowing trouble, persistent vomiting, chest pain, fever
  with stomach pain, onset after 50, family history of colon cancer, celiac or IBD) → "Please check with a doctor before
  starting." Continue only after "I understand". Log nothing identifiable.
- **Eating disorder:** if yes → explain the risk, recommend a professional, offer a gentle mode with no elimination.
  **Never show calories or weight-loss language anywhere.**
- **Pregnant/breastfeeding** → recommend a doctor check; allow continuing.
- **Restriction limits:** Calm phase 14 days minimum, 28 maximum. Every group is reintroduced. The personal plan is as
  broad as possible: only confirmed triggers are limited, and only at the dose that caused symptoms.
- **Language:** allowed: "patterns", "likely trigger", "seems to bother you", "test", "may help". Banned: "diagnose",
  "cure", "treat IBS", "heal your gut", "guaranteed", any disease claim. The only exception is the medical
  disclaimer's own wording. A unit test (`__tests__/copy.test.ts`) scans `/src/copy` for banned words.
- **Disclaimer** (onboarding, Settings, results report) lives in `src/copy/common.ts` → `disclaimer`.
- **Methodology screen** "How Culprit works" in Settings with sources (Apple 1.4.1).
- **Data licensing:** never copy Monash FODMAP data or paid databases. USDA FDC is public domain. Open Food/Beauty Facts
  data is ODbL: separate table + in-app attribution.
- **No fabricated social proof.** Real numbers arrive later via remote config.

## Stack (approved dependencies)

Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 (strict, `noUncheckedIndexedAccess`, **no `any`, no
`@ts-ignore`**) · Expo Router (typed routes) · Zustand (+ `persist`) · `expo-sqlite` · `react-native-reanimated` (+
`react-native-worklets`) · `react-native-gesture-handler` · `expo-haptics` · `expo-blur` · `expo-linear-gradient` ·
`react-native-svg` · `lottie-react-native` (optional) · `@shopify/flash-list` · `@expo-google-fonts/plus-jakarta-sans` +
`@expo-google-fonts/inter` · `lucide-react-native` · `react-native-purchases` (+ `-ui`, needs `expo-dev-client`) ·
`expo-notifications` · `posthog-react-native` (no session replay, no health data) · `react-native-view-shot` +
`expo-sharing` · `expo-print` · `expo-keep-awake` · `expo-localization` · `expo-store-review` · Jest + jest-expo + React
Native Testing Library · Maestro (e2e) · EAS Build/Submit. No backend in the MVP.

Packages are added in the phase that first needs them (Phase 0 installed only the foundation set).

**Peer / framework packages installed because the approved ones require them** (not new features): `expo-linking`,
`expo-constants`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `react-native-safe-area-context`,
`react-native-screens`, `react-dom` (expo-router peer, pinned 19.3.0), `react-native-worklets` (Reanimated 4),
`@react-native/jest-preset` + `test-renderer` (jest-expo / RNTL peers), `eslint`, `eslint-config-expo`, `prettier`,
`eslint-config-prettier`, `eslint-plugin-prettier`.

### Install / commands

```bash
npx expo install <pkg>     # always (resolves SDK-compatible versions)
                           # in the cloud sandbox api.expo.dev is blocked → prefix EXPO_OFFLINE=1
npm run lint               # eslint (flat config, expo + prettier)
npm run typecheck          # tsc --noEmit
npm test                   # jest (jest-expo preset)
npm run check              # all three
npm start                  # expo start
```

Expo APIs change every SDK. Before using one, check the installed package's types/README in `node_modules` (or the
versioned docs at docs.expo.dev/versions/v58.0.0/). Don't trust memory.

## Repo layout

```
/app                 Expo Router screens (root-level app/, NOT src/app)
  _layout.tsx        fonts, splash, gesture root, SQLite provider + migrations, theme, Stack
  index.tsx          entry (placeholder until Phase 3 onboarding)
  gallery.tsx        DEV-ONLY design-system gallery (redirects away in release builds)
  (onboarding)/ (paywall)/ (tabs)/ recipe/[id] test/[id] settings/ debug.tsx   ← later phases
/src
  components/        design-system components (barrel: src/components/index.ts)
  theme/             tokens (colors light/dark, type scale, spacing, radius, elevation), ThemeProvider, useTheme
  engines/           PURE TypeScript, no React: plan, grocery, price, program, scoring, schedule (Phase 2)
  data/              SQLite schema + migrations, repositories, content loaders
  features/          Zustand stores + feature hooks
  copy/              ALL user-facing strings
  analytics/ purchases/ notifications/                                     ← later phases
/assets/data         bundled versioned JSON content (Phase 1)
/data-pipeline       Node/TS content scripts, not shipped (Phase 1)
/__tests__           Jest tests
/docs/SPEC.md        the full product spec
```

Import alias: `@/*` → `src/*`.

## Coding rules

- Business logic only in `src/engines` (pure, deterministic, inject `now()`). Every engine function gets unit tests.
- All strings in `src/copy`. All colors/sizes from theme tokens: no magic numbers in styles.
- Small, focused components. FlashList for lists over 20 items. Memoize heavy selectors.
- Every screen handles loading, empty and error states.
- Accessibility: touchables ≥ 44×44 pt, text contrast ≥ 4.5:1 (enforced by `__tests__/theme.test.ts`), every control
  has an accessibility label/role/state, respect Reduce Motion (springs/confetti → fades), never fix heights that clip
  Dynamic Type (use `minHeight`).

## Design system (Phase 0, done)

Tokens in `src/theme/tokens.ts` follow spec §7.2 exactly, plus these **decisions**:

- **`*Ink` text colors** (`brandInk`, `goodInk`, `partialInk`, `triggerInk`, `unclearInk`): the spec's mint / amber /
  coral / grey fail 4.5:1 as _text_ on light surfaces, so they stay for fills, rings, bars and icons, and the darker or
  lighter `*Ink` variants are used whenever status color is text. Each `*Soft` token is a tinted fill for pills.
- **`onBrand`** (text on brand fills): white in light mode. In dark mode, white on `#8B72FF` is only ~3.5:1, so dark
  mode uses `#0E0E12` (near-black) on the brand fill. The light-mode button matches the spec exactly.
- `overlay` (sheet backdrop) and `shadow` tokens; the shadow is used in light mode only, with borders in dark mode.
- Fonts: Plus Jakarta Sans (headings, buttons, callout, caption), Inter (body). Each weight is its own family name
  (no `fontWeight` on custom fonts).
- Components (all in the dev gallery, light + dark toggle): Text, Screen, BottomCTA, PrimaryButton, SecondaryButton,
  TextButton, OptionCard, Chip, ProgressBar, Card, DinnerCard, TestBanner, CheckInFaces, ScoreRing, BudgetBar,
  StatusPill, BottomSheet, Toast, ConfettiBurst, Stepper, Slider, WheelPicker, TimePicker, EmptyState.
- No date-time picker or slider package is approved, so Slider (gesture-handler) and TimePicker/WheelPicker (snapping
  ScrollView) are custom. WheelPicker is reused for the O2 birth-year picker.
- Haptics go through `src/components/haptics.ts` (no-ops on web).
- Single-select OptionCard auto-advance (250 ms, `motion.autoAdvance`) is a screen-level behaviour, wired in Phase 3.
- Reanimated shared values are written with `.set()` (React Compiler lint rule `react-hooks/immutability` rejects
  `.value =` writes). Reads inside worklets / `useAnimatedStyle` use `.value`.
- Gesture Handler v3 hook API (`usePanGesture` + `GestureDetector`); JS callbacks from worklets via `scheduleOnRN`
  (react-native-worklets).

## Data layer

- One SQLite DB `culprit.db`, opened by `<SQLiteProvider onInit={migrateDb}>`. Migrations live in
  `src/data/migrations.ts` as an ordered array, applied in one transaction and tracked by `PRAGMA user_version`. **Never
  edit a shipped migration; append a new one.**
- Small prefs live in Zustand `persist` backed by `expo-sqlite/kv-store` (no AsyncStorage dependency needed).
- iOS data protection / backup exclusion for the DB: Phase 7.

## Testing setup

- Jest via `jest-expo` preset, config in `package.json`. `resolver: react-native-reanimated/jest/resolver` (worklets'
  web build under Jest), gesture-handler's `jestSetup.js`, and `jest.setup.ts` (Reanimated `setUpTests`, in-memory
  kv-store, haptics mock, gesture-handler UI-runtime no-op).
- `lucide-react-native` is mapped to its CJS build for Jest (its ESM build is `.mjs`).
- RNTL v14: `render` and `fireEvent` are async, so always `await` them. Use `__tests__/helpers/renderWithTheme.tsx`
  (gesture root + safe area + forced color scheme).
- TypeScript 6 defaults `types` to `[]`, so `tsconfig.json` lists `"types": ["jest"]`.
- Must-pass guards: `theme.test.ts` (contrast), `copy.test.ts` (banned words + exact disclaimer),
  `gallery.test.tsx` (gallery renders in both themes).

## Environment notes

- The cloud sandbox blocks `api.expo.dev`, `exp.host` and `docs.expo.dev`: use `EXPO_OFFLINE=1` for `expo install`;
  `expo-doctor` passes 18/20 locally (the 2 failures are its network checks).
- `npx expo export --platform ios --platform android` bundles cleanly (verifies Metro resolution end to end).
- `app.json` uses placeholder bundle IDs `com.culprit.app`: replace them with the real ones before the first EAS build.

## Phase plan (spec §15)

- [x] **0 Foundation:** Expo + TS strict + Router, ESLint/Prettier, tokens (light/dark), fonts, all §7.3 components +
      dev gallery, copy module, SQLite + migrations, Zustand skeleton, CLAUDE.md.
- [ ] **1 Content pipeline:** zod schemas, ~350 ingredients, recipe drafting script, tag derivation, validator with §5.2
      coverage rules, tests/staples/cards JSON, BLS price pipeline + region/chain tables, ZIP3→region.
      `npm run content:validate` prints a coverage report.
- [ ] **2 Engines:** program, scoring (25+ tests), plan (<150 ms), grocery, price, schedule. A debug CLI prints a 4-week
      simulation.
- [ ] **3 Onboarding + plan preview:** §8 screens, real engine output at O21, resume-on-relaunch, safety logic,
      notification pre-permission. Maestro: 3 profiles + under-18 blocked.
- [ ] **4 Paywall + purchases:** RevenueCat (owner adds keys/products), 3-step paywall, welcome offer, restore,
      Customer Center, entitlement gating, trial reminder.
- [ ] **5 Main tabs:** Today, Plan (swap/eating out/shuffle/2-week), Recipe + cooking mode, List.
- [ ] **6 Check-ins, tests, results:** check-in flow, test lifecycle, case file, reveals, share card, doctor PDF, rating.
- [ ] **7 Polish:** notifications, analytics, settings, export/delete, a11y pass, reduce motion, perf, error boundaries.
- [ ] **8 Skin mode** behind `FEATURE_SKIN`.
- [ ] **9 Ship prep:** icon/splash, screenshots plan, metadata, review notes, TestFlight.

## Decision log

- 2026-10-27: Scaffolded with `create-expo-app` (blank-typescript, SDK 58). Routes live in root `/app` per the spec (the
  template's AGENTS.md suggested `src/app`, which was removed in favour of this file).
- 2026-10-27: Added the `*Ink` and `onBrand` tokens for WCAG contrast (see Design system).
- 2026-10-27: Prefs persistence uses `expo-sqlite/kv-store` instead of adding AsyncStorage.
