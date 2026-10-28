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
npm run check              # lint + typecheck + tests + content:validate
npm run content:build      # rebuild /assets/data from data-pipeline/source (derives all recipe tags)
npm run content:validate   # schema + integrity + §5.2 coverage report (fails on any problem)
npm run content:prices     # monthly BLS refresh → data-pipeline/source/bls-prices.json, then content:build
npm run engine:simulate -- --weeks 4 --profile fodmap   # day-by-day program simulation with real engines
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
- **Press animation** (`usePressScale` / `PressableScale`): 70 ms squeeze to 0.95 on touch, then on release a
  quick overshoot to 1.035 that springs back (`motion.popSpring`); opacity fade with Reduce Motion. Used by
  buttons, OptionCard, Chip, CheckInFaces, DinnerCard, PlanCard.
- **WheelPicker**: Reanimated scroll handler drives a 3D drum (rows scale / fade / tilt by distance); always
  settles exactly on an item (native snap for flings, plus a settle step on drag end / momentum end / 120 ms
  idle, which also covers web); haptic tick per row; tap a row to jump; fades top and bottom. The scroller has an
  explicit height (web otherwise grew it to fit every row, which broke scrolling).
- Single-select auto-advance: `SingleChoice` highlights the picked card at once (colour fade + pop + check zooms
  in), locks further taps, and moves on after `motion.autoAdvance` (900 ms).
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

## Content pipeline (Phase 1, done)

- Sources are TypeScript in `data-pipeline/source/` (compact helpers `i()` for ingredients, `r()` for recipes).
  `content:build` validates each item against `src/data/content/schema.ts`, **derives every recipe tag** in
  `data-pipeline/lib/derive.ts`, writes `/assets/data/*.json` + `manifest.json` (content version = content hash).
  Never hand-edit `/assets/data`; the validator rejects stale or edited `derived` blocks.
- Pipeline scripts run on Node 22's built-in TypeScript stripping (`node file.ts`): imports use `.ts` extensions,
  no enums/namespaces. `@types/node` is a dev dependency for them.
- Derivation rules: `calmSafeGut` = every FODMAP group ≤ low at the per-serving amount (an ingredient's
  `fodmapSafeServingG` lowers moderate/high to low at or under that weight); `calmSafeReflux` = no reflux tags
  and ≤ `REFLUX_FAT_CAP_G` (25 g) fat per serving; diets = intersection; allergens = union; `glutenFree` = no
  wheat allergen; `lowGlycemic` = no high-glycemic ingredient.
- FODMAP levels are general public knowledge (never Monash data) and **need dietitian review before launch**.
- Prices: hand-estimated typical store-brand prices, always shown as "est.". `content:prices` fetches BLS
  Average Price series (13 candidates in `source/places.ts`, verified against the API at fetch time) and
  regional series; the build applies them with a 0.9 store-brand factor. The sandbox can't reach api.bls.gov,
  so it hasn't been run yet.
- Test library: 18 tests + a placebo `control`, NHS 3-day escalating protocol. Alcohol is 21+ and opt-in.
  The late-dinner test is timing-only (doses without ingredients).
- Cards cite only the §17 sources (a test enforces this).
- **Pending owner approval:** the build-time recipe drafting script (spec §5.2) should use `@anthropic-ai/sdk`
  as a devDependency. The 150 MVP recipes were drafted directly; the script lands once the dependency is approved.

## Engines (Phase 2, done)

All in `src/engines`, pure TypeScript, no React. **Engines import each other with relative `.ts` paths** (no `@/`
alias) so Node can run them directly for `engine:simulate`; type-only imports are erased. No TS-only runtime syntax
(enums, namespaces, constructor parameter properties).

- `dates.ts`: "YYYY-MM-DD" day keys, UTC-safe math, Monday-first weeks. `rng.ts`: FNV-1a + mulberry32.
- `scoring.ts` (§6.3): baseline = last 5 valid calm/rest scores; reaction = Δ ≥ 2, or Δ ≥ 1 with a matching chip;
  confidence by failed checks (SD > 0.8, unusual days in window, nearby placebo reaction; similar-size placebo
  reaction → low); low + borderline → unclear. Explanations from `src/copy/results.ts`.
- `program.ts` (§6.1): `advance(state, {checkins, tests, now})` replays ready days (a day is ready once it has a
  check-in, or after noon the next day). Calm 14–28 days; tests up to 3 dose nights (a missed check-in or "didn't eat
  it" repeats the dose; max 6 attempts); same-night reaction stops early; rest until 2 good days (≤ baseline + 1).
  Pause/resume, retests, self-reports, `projectSchedule()` for planning test nights, `personalRules()` for plans.
- `triggers.ts`: ingredient → test groups (fructan split into wheat / onion / garlic; mixed products count as both
  onion and garlic). Personal plans exclude triggers and allow partial groups only up to the safe dose's grams.
- `plan.ts` (§6.4): filters → per-(night, recipe) score (cost + variety/recency/feedback/kids/perishables + seeded
  jitter) → greedy (test nights first) → swap/replace local search with bound pruning → whole-pack grocery total →
  budget retries → 2 suggestions. `swapOptions`, `applySwap`, `planGroceries`, `eatByTime`.
- `grocery.ts` (§6.5): cheapest whole-pack combination (bounded DFS, greedy fallback), store-walk aisle order,
  pantry cross-off, share text. `price.ts` (§6.6): base × region × chain, override last, ZIP3 lookup, chain order.
- `schedule.ts` (§6.7): pure list of pending local notifications; quiet hours 22:00–08:00 except the chosen
  check-in time; follow-up +45 min; trial reminder moved out of quiet hours to 21:00 the evening before.

## Onboarding (Phase 3, done)

- Screens in `app/(onboarding)/`, one per step. Order and conditional visibility live in
  `src/features/onboarding/flow.ts` (`STEPS`, `BRANCHES`, `isVisible`, `nextStep`); answer logic (age gate, profile
  detection, budget defaults, exclusive chips) is pure in `src/engines/onboarding.ts`.
- Answers persist in SQLite (`health_kv` via `src/data/healthStorage.ts`, sync storage for Zustand). The last step is
  stored in prefs; `app/index.tsx` resumes there on relaunch (the loader restarts from how-it-works).
- O20 builds the real program + first week with the engines (`buildFirstWeek`), saves both, then O21 reloads them
  (`usePlanPreview`). The week starts tomorrow. Per-dinner prices use `recipeCostEstimate` (pro-rata, "est.").
- Red flags: which ones were picked is never stored, only that the notice was acknowledged.
- O22 accounts: no backend in the MVP, so it's a "saved on this phone" screen; no social login means Apple's
  Sign in with Apple rule doesn't apply yet. `(paywall)` is a placeholder until Phase 4.
- `prefs.installId` (random, per install) seeds plans.
- Screen tests use `expo-router/testing-library` (`standard-navigation` added to transformIgnorePatterns).
- Maestro flows in `.maestro/` (fodmap, reflux, mixed, under-18). They need a simulator/dev build: not run in the
  cloud sandbox.

## Paywall + purchases (Phase 4, done)

- `src/purchases`: `PurchasesClient` interface; `revenuecat.ts` (real, loaded lazily only when a key exists),
  `mock.ts` (in-memory test store for dev/preview/tests), `index.ts` picks one. Keys:
  `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` (EAS env). Release build without a key → store unavailable.
- Pure rules in `src/engines/paywall.ts` (period parsing, savings %, welcome-offer timing, trial end).
- `src/features/subscriptionStore.ts` (kv-store, not health data): cached `isPro`, trial start, paywall memory.
- Screens `app/(paywall)/`: index (P1), timeline (P2, only when the annual plan has a trial), plans (P3),
  welcome-offer (24 h after first close, once, max one auto-show a day), success. Close → locked O21.
- `app/(tabs)` redirects non-subscribers; `app/index.tsx` routes pro → tabs, finished onboarding → welcome offer
  or locked O21, else resume onboarding. Settings has Manage subscription (Customer Center) + Restore.
- Trial reminder: `src/notifications/trialReminder.ts` uses `scheduleNotifications` (24 h before, out of quiet hours).
- Checklist + owner setup steps: `docs/PAYWALL_CHECKLIST.md`. Sandbox purchase needs the owner's App Store
  Connect + RevenueCat setup and a dev build (not possible in the cloud sandbox).

## Main tabs (Phase 5, done)

- `src/features/appStore.ts` (health data → SQLite `health_kv`): program, plans by weekStart, feedback, list
  checks/custom items/done-shopping, pantry un-crosses, shuffles, 2-week flag, dismissed cards, check-ins (Phase 6).
  Onboarding's O20 now writes the program + first week here (the `repositories.ts` tables are unused for now).
- `src/features/plan/actions.ts`: `syncProgramAndPlan(today)` (advance the program, generate a plan when none
  covers today, re-plan the rest of the week when projected test nights move), swap, eating out (and back),
  shuffle (rest of the week only), 2-week toggle. Pure helpers: `engines/week.ts`, `engines/today.ts`,
  `engines/amount.ts` (US units, servings scale).
- Tabs `app/(tabs)/`: Today (phase pill, tonight/tomorrow dinner, test banner + "why this amount", ideas, program
  ring + next test, daily education card), Plan (week strip, swap sheet with ± price, thumbs, eating out, shuffle,
  2-week, suggestions when over budget, BudgetBar), List (FlashList by aisle, checkboxes, pack + price + "for"
  dishes, pantry cross-off, add item, share, done shopping, est. info), Results placeholder (Phase 6).
  `app/recipe/[id]` (servings scaler, tips, amber test food) and `app/recipe/[id]/cook` (paged steps, timers,
  keep-awake, confetti end). `app/debug.tsx` (dev only): time travel, toggle Pro, open paywall/offer, reset.
- Photos: `npm run content:photos` (needs `PEXELS_API_KEY`; the cloud sandbox can't reach Pexels) writes
  `assets/photos/*.jpg`, `data-pipeline/source/photo-credits.json` and `src/data/photos.ts`. Without photos,
  cards use gradient + emoji. Overrides: `data-pipeline/source/photo-overrides.json`.
- New approved deps installed: `expo-keep-awake`, `@shopify/flash-list` (added to Jest transformIgnorePatterns).

## Check-ins, tests, results (Phase 6, done)

- Pure: `engines/checkin.ts` (card from 5 pm; yesterday until noon; streak), `engines/report.ts` (suspect board,
  counts, 7-day trend, per-test chart window, case report, share line, `caseSolved`), `engines/simulate.ts`
  (clear / noisy / placebo-reaction synthetic check-ins, used by the debug screen and the 8-week test).
- Check-in: `features/checkin/CheckInCard.tsx` on Today. The first face tap saves the day and advances the
  program (`submitCheckin` → `syncProgramAndPlan`); symptoms, the test-food yes/no (dose days) and "unusual day"
  are optional extras. `/?checkin=1` forces the card (notification tap, Phase 7). Analytics never get scores.
- Reveals: Today shows "{Group} test complete" cards for unrevealed results → `app/test/[group].tsx` (1.4 s
  suspense, verdict pill, explanation, confidence + why, SVG chart with baseline and dose markers, Retest).
  Calm-complete and case-solved moments are one-time (`appStore.celebrated`).
- Results tab: subtitle counts, suspect board grid, trend chart (calm shaded), solved report (triggers / small
  amounts / cleared / unclear / self-reported / placebo days), share card (`app/share.tsx`, view-shot 1080×1350 +
  expo-sharing, outcomes only), doctor PDF (`features/results/doctorReport.ts` → expo-print), rating prompt via
  expo-store-review once per 120 days when the case is solved. Charts are hand-rolled SVG (no chart dependency).
- Debug: seed a demo user, simulate 7 days (clear / noisy / placebo) or 8 weeks; the app clock moves with it.
- New approved deps: `react-native-view-shot`, `expo-sharing`, `expo-print`, `expo-store-review`.

## Polish (Phase 7, done)

- Notifications: `src/notifications/sync.ts` builds the full list with `scheduleNotifications` (check-in +
  follow-up, 4 pm test heads-up with portion + dish, Sunday plan, trial, milestones once each via
  `appStore.notified`) and reschedules on any store change (`useNotifications`, debounced, serialised). Taps route
  by type (`routeForNotification`). Toggles + check-in time in Settings → Notifications.
- Analytics: PostHog behind `EXPO_PUBLIC_POSTHOG_KEY` (+ optional `EXPO_PUBLIC_POSTHOG_HOST`), lazy-loaded, no
  session replay, no screen capture, opt-out switch in Settings. Typed events only; onboarding branch screens are
  never sent. User properties: source, mode, profile, household/budget buckets, chain, phase.
- Settings (`app/settings/`): preferences (re-plans from today), notifications, program (pause/resume, retest,
  restart), How Culprit works + sources, disclaimer, privacy, terms, attribution (incl. photo credits),
  contact (`SUPPORT_EMAIL` in `src/config.ts`), export (JSON via the share sheet), delete all data (keeps the
  cached Apple entitlement), versions.
- Delete all data is `app/settings/delete.tsx`: what gets deleted → "Yes, delete" → type DELETE → done. Subscribers
  see "Cancel my subscription" (Customer Center, else apps.apple.com/account/subscriptions); apps can't cancel
  Apple subscriptions themselves.
- `AppErrorBoundary` on the root and every route group. `NSFileProtectionComplete` entitlement.
- Checklist: `docs/A11Y_CHECKLIST.md` (automated a11y sweep in `__tests__/mainApp/phase7.test.tsx`).
- After onboarding, subscribers skip the paywall (e.g. after "Delete all my data").

## Skin mode (Phase 8, done, behind `FEATURE_SKIN`)

- Flag: `EXPO_PUBLIC_FEATURE_SKIN=1` (`src/config.ts`), or the debug screen switch (`prefs.skinOverride`).
  Flag off: O1 shows "Coming soon" and nothing else changes.
- Content: `data-pipeline/source/skincare.ts` → `assets/data/skincare.json` (`SkincareFile` schema): 6 product
  archetypes (cleanser, oil-free moisturizer, SPF 30+, benzoyl peroxide wash, adapalene 0.1%, salicylic 2%), label
  facts only, no brands, prices "est."; milk pause (28 + 14 days) and low-glycemic (56 days) experiments, 18+;
  AAD habits with source.
- Engine `engines/skin.ts`: routine builder (AM cleanser → moisturizer → SPF; PM treatment wash replaces the
  cleanser; owned products cost nothing; region × store price index), program with a 14-day baseline then one
  change at a time (treatment first, experiments queued after), switch treatment, scoring with 14-day windows
  (≥ 7 check-ins each; ±0.5 on the 0–3 scale → seems to help / possibly worse; milk = reintroduction vs end of
  pause).
- UI: `app/skin-setup/[step]` (one question per screen; ZIP/store only if unknown) → `app/skin-setup/preview`
  (priced routine before the paywall) → paywall. `app/(tabs)/skin.tsx`: "Skin today?" one tap, current change,
  routine checklist with budget bar, switch evening product, results, experiments (adults only), habits.
  Skin-only users see only the Skin tab; 13–17 can set up skin mode from the 18+ screen (no experiments).
- Copy avoids "treatment" (banned-word test); the UI says "product".
- **Not built (needs dependency approval):** guided selfie + before/after (needs `expo-camera` or
  `expo-image-picker` + file storage) and barcode scan with Open Beauty Facts (needs a camera package + network
  cache + ODbL attribution).

## Stores & pricing upgrade (after Phase 8)

- 55 grocery chains in `data-pipeline/source/places.ts` with state footprints, `family` and `leaderIn`.
  `storeGroups()` (engines/price.ts) → Near you (state; leaders first, then local before multi-region) /
  Nationwide / All stores (searchable) / Other with a typed `answers.storeName`. `StorePicker` is shared by
  onboarding O13 and Settings → Preferences. `storeLabel()` shows the typed name everywhere.
- Skincare has its own retailers (`skincare.json` → `retailers`: Walmart, Target, CVS, Walgreens, Amazon,
  Costco/Sam's, grocery aisle) with store-brand indexes; skin price = region × retailer index. Setup step
  `retailer` replaces reusing the grocery store; changeable on the Skin tab.
- Price transparency: the List header says which store/ZIP prices are for; the "est." sheet explains tiers.
- `docs/DATA_SOURCES.md` explains every data source in plain English.
- Location detection was not added (would need `expo-location` + a permission prompt); ZIP entry stays.
- **My stores (multi-store):** 81 stores, each with a `type` (`STORE_TYPES`), optional `sells` / `aisleIndex` /
  `skinIndex` / `storeBrand` overrides. `engines/stores.ts`: `TYPE_COVERAGE` (full / limited / none per aisle +
  skincare), `TYPE_AISLE_INDEX` (category price factors, applied in `packPrice` via `PriceContext.aisleIndex`),
  `rankStores` (stores that don't fully sell every aisle on the list are blocked, with what's missing),
  `bestStore`, `bestSplit` (best pair, offered when it saves ≥ $8). `answers.stores` + `answers.storeAuto`;
  `answers.chainId` = the store the list is priced for. `withBestStore` re-plans at the cheapest store when
  building weeks. List: "Shopping at…" bar, Switch store sheet (blocked stores disabled with reasons), split
  offer + per-line "at {store}". Skincare uses the same stores (`skinStoreId`: pick or cheapest selling skincare);
  `skincare.json` no longer has its own retailer list.

## Phase plan (spec §15)

- [x] **0 Foundation:** Expo + TS strict + Router, ESLint/Prettier, tokens (light/dark), fonts, all §7.3 components +
      dev gallery, copy module, SQLite + migrations, Zustand skeleton, CLAUDE.md.
- [x] **1 Content pipeline:** zod schemas, 390 ingredients, 150 recipes, tag derivation, validator with §5.2
      coverage rules, tests/staples/cards JSON, BLS price pipeline + region/chain tables, ZIP3→region.
      `npm run content:validate` prints a coverage report. (LLM drafting script pending dependency approval.)
- [x] **2 Engines:** program, scoring (34 tests), plan (~15 ms/week in Node), grocery, price, schedule.
      `npm run engine:simulate` prints a program simulation.
- [x] **3 Onboarding + plan preview:** §8 screens, real engine output at O21, resume-on-relaunch, safety logic,
      notification pre-permission. Maestro: 3 profiles + under-18 blocked.
- [x] **4 Paywall + purchases:** RevenueCat (owner adds keys/products), 3-step paywall, welcome offer, restore,
      Customer Center, entitlement gating, trial reminder.
- [x] **5 Main tabs:** Today, Plan (swap/eating out/shuffle/2-week), Recipe + cooking mode, List.
- [x] **6 Check-ins, tests, results:** check-in flow, test lifecycle, case file, reveals, share card, doctor PDF, rating.
- [x] **7 Polish:** notifications, analytics, settings, export/delete, a11y pass, reduce motion, perf, error boundaries.
- [x] **8 Skin mode** behind `FEATURE_SKIN`.
- [ ] **9 Ship prep:** icon/splash, screenshots plan, metadata, review notes, TestFlight.

## Decision log

- 2026-10-27: Scaffolded with `create-expo-app` (blank-typescript, SDK 58). Routes live in root `/app` per the spec (the
  template's AGENTS.md suggested `src/app`, which was removed in favour of this file).
- 2026-10-27: Added the `*Ink` and `onBrand` tokens for WCAG contrast (see Design system).
- 2026-10-27: Prefs persistence uses `expo-sqlite/kv-store` instead of adding AsyncStorage.
- 2026-10-27: Reflux moderate-fat cap set to 25 g per serving. `@types/node` added (types only) for pipeline scripts.
- 2026-10-27: Markdown is excluded from Prettier (it reflowed CLAUDE.md lists).
- 2026-10-28: **Scoring window refinement.** The spec's window max(score[day], score[day+1]) makes a bad score on the
  next dose night count against the *previous* dose, so partials could almost never happen. The next day now only
  counts when it isn't itself the next dose day; a reaction on dose night 2 means dose 1's portion was tolerated
  (matches the NHS guidance the spec cites). Delayed reactions still count on rest days.
- 2026-10-28: Stovetop, oven and sheet pan are assumed available; other equipment must be selected in onboarding.
- 2026-10-28: Test-night foods go on the grocery list at the day-3 portion (one person).
- 2026-10-28: Food photos: owner approved licensed stock photos (closest match per recipe, free commercial
  licence such as Unsplash/Pexels, attribution recorded). Applies from Phase 5.
- 2026-10-28: Terms link defaults to Apple's standard EULA; privacy URL is a placeholder for the owner.
- 2026-10-28: Check-in card stays on the day being logged until "Done" (logging yesterday before noon no
  longer jumps straight to today's card).
- 2026-10-28: **Food tests respect diet and allergies** (`testsToSkip`): a test whose dose ingredient has a listed
  allergen or is outside the diet is skipped (milk allergy → no dairy test; vegetarian → no bacon "rich food"
  test). Changing diet/allergies in Settings removes newly conflicting upcoming tests. Placebo always stays.
- 2026-10-28: When the time limit has to be relaxed (too few quick recipes), only the quickest extra recipes
  are added (`RELAX_SPARE`), not the whole list. `__tests__/engines/planSafetyFuzz.test.ts` checks every rule
  for 40 random people.
- 2026-10-28: Red-flag option worded "Losing weight without trying" (the copy test bans "weight loss").
