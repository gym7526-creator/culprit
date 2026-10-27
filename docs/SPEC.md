# CULPRIT: Full Build Spec for Claude Code

> **Instructions to Claude Code:** Read this entire document before writing any code. First, create `CLAUDE.md` in the repo root that summarizes the rules, stack, and phase plan below. Then execute **Phase 0 only** and stop for my review. After each phase: run the tests, commit with a clear message, give me a short summary of what's done and what I need to do (keys, accounts, assets), then wait for "next phase". Ask before adding any dependency not listed here. Never invent statistics, reviews, ratings, or medical claims.

---

## 1. What we're building (read this twice)

**Culprit** is an iPhone-first (Android second) subscription app that works like TapCook, but for your stomach (and later your skin).

**The promise:** *"Find the foods wrecking your stomach, without logging a thing."*

**How it works in one sentence:** The user answers a 60-second quiz once. The app hands them a full week of stomach-friendly dinners priced at their grocery store, with one grocery list. The plan itself runs a guided elimination-and-reintroduction program, and the user's only daily input is one tap at night ("How was your stomach today?"). After a few weeks the app tells them exactly which foods are their triggers, and every future weekly plan is built around their personal results.

**Core principles (non-negotiable):**
1. **Zero work.** The user never logs meals or types food names. The app decides what they eat, so it already knows. One tap per day, max two.
2. **Preloaded, not generated.** All recipes, ingredients, trigger tags, prices, test schedules and education content ship inside the app as bundled data. **No LLM/AI API calls at runtime in the MVP.** AI is used only by me, offline, at build time to help create the content, which then gets validated by scripts and reviewed by a human.
3. **Offline-first and private.** Health data (check-ins, results) stays on the device in the MVP. Nothing health-related is sent to analytics or a server.
4. **Never a diagnosis.** The app finds patterns to test. It never says "you have IBS/GERD". Red-flag symptoms always route to a doctor.
5. **Instant value.** Before the paywall, the user sees their own first week (dinners + total price vs. budget + the suspects we'll test first).
6. **Feels premium and fun.** One question per screen, big buttons, haptics, smooth motion, satisfying reveals ("Case solved"). Detective theme, but warm and calm, not cheesy.

**Modes:**
- **Gut mode** (launch): bloating, gas, stomach pain, heartburn/reflux, diarrhea, constipation.
- **Skin mode** (phase 8, behind a feature flag): acne/breakouts. Same engine pattern, longer test windows.

---

## 2. Safety, legal and honesty rules (build these in from day one)

- **Age:**
  - Under 13: blocked entirely (COPPA). Ask birth year during onboarding.
  - 13–17: Gut elimination program is **not available**. Show a friendly "the full program is for 18+, talk to a parent or doctor about your stomach" screen. Skin mode (later) is allowed for 13–17, but routine and product testing only, with no diet experiments.
  - 18+: everything.
- **Red flags screen (mandatory in onboarding):** blood in stool, black/tarry stool, unintentional weight loss, trouble or pain swallowing, persistent vomiting, chest pain, fever with stomach pain, symptoms that started after age 50, family history of colon cancer, celiac disease or IBD. If any are selected, show: "Please check with a doctor before starting. These symptoms need a proper look." Let the user continue only after tapping "I understand", and log nothing identifiable about it.
- **Eating-disorder safeguard:** Ask "Have you ever had an eating disorder or been told you might?" If yes: explain that elimination diets can be risky for them, recommend doing this only with a professional, and offer a gentler mode that skips elimination: reflux timing tips plus balanced, no-restriction meal plans. Never show calorie counts or weight-loss language anywhere in the app.
- **Pregnancy:** if pregnant or breastfeeding, recommend checking with a doctor before diet changes. Allow continuing.
- **Restriction limits:** The Calm (elimination) phase lasts 14 days minimum and 28 days maximum, never longer. Every food group gets reintroduced. The final personal plan must be **as broad as possible**: only confirmed triggers are limited, and only at the dose that caused symptoms.
- **Language rules:**
  - Allowed: "patterns", "likely trigger", "seems to bother you", "test", "may help".
  - Banned: "diagnose", "cure", "treat IBS", "heal your gut", "guaranteed", any disease claim.
- **Medical disclaimer:** shown in onboarding (one line plus a link), in Settings, and on the results report: "Culprit is a wellness tool that helps you spot food patterns. It is not medical advice and doesn't diagnose or treat any condition. Talk to a doctor about ongoing symptoms."
- **Methodology screen** (Apple guideline 1.4.1 wants health apps to disclose their methods): a "How Culprit works" page in Settings explaining the elimination/reintroduction method, with links to sources (section 17).
- **Data licensing:** do **not** copy Monash University's FODMAP app data or any paid database. Build trigger tags from public, general knowledge and public-domain sources (USDA FoodData Central is public domain). If Open Food Facts or Open Beauty Facts data is used, it's under ODbL: show attribution in the app ("Product data © Open Food Facts contributors, ODbL") and keep that data in a separate table.
- **Never fabricate social proof.** No fake ratings, reviews, user counts or testimonials. Use honest lines like "Built on the method dietitians use" until real numbers exist (I'll supply them later via remote config).
- **Prices are estimates.** Always label them "est." and explain them in an info sheet ("Based on typical regular prices in your region, not live store prices").

---

## 3. Tech stack

- **Expo (latest stable SDK)** + **React Native** + **TypeScript (strict mode, no `any`)**
- **Expo Router** (file-based navigation, typed routes)
- **State:** Zustand (+ `persist` middleware for small prefs). **Data:** `expo-sqlite` for check-ins, plans, program state and results. Bundled content as versioned JSON in `/assets/data`, loaded into SQLite on first launch and on content-version change.
- **UI/animation:** `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `expo-blur`, `expo-linear-gradient`, `react-native-svg` (charts, rings), `lottie-react-native` (optional, for 2–3 hero animations), `@shopify/flash-list` for long lists.
- **Fonts:** `@expo-google-fonts/plus-jakarta-sans` (headings + UI) and `@expo-google-fonts/inter` (body/small text).
- **Icons:** `lucide-react-native` (consistent stroke icons). Emoji are allowed inside option cards for playfulness.
- **Purchases:** `react-native-purchases` + `react-native-purchases-ui` (RevenueCat). Requires a dev build (`expo-dev-client`); Expo Go only runs RevenueCat's preview/mock mode.
- **Notifications:** `expo-notifications` (local notifications only in the MVP).
- **Analytics:** `posthog-react-native`, with **no session replay**, no health data, and an anonymous ID.
- **Sharing/export:** `react-native-view-shot` + `expo-sharing` (share cards), `expo-print` (doctor PDF).
- **Misc:** `expo-keep-awake` (cooking mode), `expo-localization`, `expo-store-review` (ask for a rating after a "win" moment).
- **Testing:** Jest + React Native Testing Library (engines and components); Maestro for e2e flows (onboarding → paywall → first check-in).
- **Build/deploy:** EAS Build + EAS Submit. Secrets in EAS environment variables, never committed.
- **Backend:** none required for the MVP. (Later: Supabase for optional encrypted backup and sync, and remote config.)

---

## 4. Repo structure

```
/app                      # Expo Router screens
  /(onboarding)/...       # one file per onboarding step
  /(paywall)/...
  /(tabs)/today.tsx
  /(tabs)/plan.tsx
  /(tabs)/list.tsx
  /(tabs)/results.tsx
  /recipe/[id].tsx
  /test/[id].tsx          # test detail
  /settings/...
  /debug.tsx              # dev-only: time travel, seed data, reset
/src
  /components             # design-system components
  /theme                  # tokens, typography, colors (light/dark)
  /engines                # PURE TypeScript, no React: plan, grocery, price, program, scoring, schedule
  /data                   # loaders, SQLite schema + migrations, repositories
  /features               # feature hooks (useToday, usePlan, useCheckIn...)
  /copy                   # all user-facing strings in one place (easy to edit + localize later)
  /analytics
  /purchases
  /notifications
/assets/data              # bundled JSON content (versioned)
/data-pipeline            # Node/TS scripts that build + validate content (not shipped)
/__tests__
```

---

## 5. Content and data (preloaded, built by scripts in `/data-pipeline`)

Every dataset has a JSON schema (zod) and a validation script. The build fails if validation fails.

### 5.1 Ingredients master (`ingredients.json`, target ~350 items)
```ts
type Ingredient = {
  id: string;                    // "garlic_clove"
  name: string;                  // "Garlic"
  aisle: Aisle;                  // "produce" | "meat_seafood" | "dairy" | "bakery" | "pantry" | "frozen" | "spices" | "international" | "beverages"
  fodmap: {                      // level at a typical serving; general public knowledge, NOT copied from Monash
    fructan: Level; gos: Level; lactose: Level; fructose: Level; sorbitol: Level; mannitol: Level;
  };                             // Level = "none" | "low" | "moderate" | "high"
  reflux: RefluxTag[];           // "caffeine" | "alcohol" | "chocolate" | "mint" | "citrus" | "tomato" | "high_fat" | "fried" | "spicy" | "carbonation"
  skin: SkinTag[];               // "dairy_milk" | "whey" | "high_glycemic"
  allergens: Allergen[];         // "milk" | "egg" | "fish" | "shellfish" | "tree_nut" | "peanut" | "wheat" | "soy" | "sesame"
  diets: DietTag[];              // "vegan" | "vegetarian" | "pescatarian"
  swaps?: string[];              // ingredient ids of low-trigger swaps (e.g. garlic -> garlic_infused_oil, onion -> green_onion_tops / chives)
  packs: Pack[];                 // purchasable packs, used for whole-pack pricing
  pantryStaple?: boolean;        // oil, salt, pepper, soy sauce...
  perishableDays?: number;       // for waste minimization
};
type Pack = { size: number; unit: "g" | "ml" | "each"; basePriceUSD: number; storeBrand: boolean };
```
Include the flavor tricks people need to stay on track: **garlic-infused oil** (garlic's fructans dissolve in water, not oil, so a properly made infused oil is low-FODMAP; store-bought only, since homemade garlic oil carries a food-safety risk), green onion tops, chives, fresh herbs, ginger, lemon zest, cumin, paprika, and so on.

### 5.2 Recipes (`recipes.json`, MVP target **150 dinners**, later 300+)
```ts
type Recipe = {
  id: string; title: string; cuisine: string;
  minutes: number; difficulty: "easy" | "medium";
  servingsBase: number; equipment: Equipment[];           // "stovetop" | "oven" | "air_fryer" | "slow_cooker" | "instant_pot" | "grill" | "sheet_pan"
  ingredients: { ingredientId: string; qty: number; unit: "g" | "ml" | "each" | "tbsp" | "tsp" | "cup" }[];
  steps: { text: string; timerSec?: number }[];
  kidFriendly: boolean; mild: boolean;
  testSlot?: { canHost: TestGroup[] };                   // which test add-ons fit this dish (e.g. a stir-fry can host garlic or onion)
  imageKey: string;                                      // maps to a bundled illustrated image or gradient + emoji
  // DERIVED by the pipeline (never hand-edited):
  derived: { fodmapMax: Record<FodmapGroup, Level>; refluxTags: RefluxTag[]; allergens: Allergen[]; diets: DietTag[];
             calmSafeGut: boolean; calmSafeReflux: boolean; lowGlycemic: boolean };
};
```
**Library coverage requirements** (the validator enforces these):
- At least 70 recipes that are `calmSafeGut` (no moderate/high FODMAP ingredient at the recipe serving), and at least 50 that are `calmSafeReflux` (no reflux tags, and a moderate-fat cap). At least 35 that are safe for both.
- At least 25 vegetarian, at least 10 vegan, at least 30 kid-friendly, at least 40 recipes of 20 minutes or less, and a spread of cuisines (American, Mexican-inspired, Italian-inspired, Asian-inspired, Mediterranean, sheet-pan, bowls, soups).
- At least 60 recipes with a `testSlot` covering every test group.
- Every ingredient referenced must exist in the master list. Steps must be clear, numbered and doable by a beginner.

**How recipes get made:** a pipeline script uses an LLM at build time only to draft recipes from a structured brief. A second script derives all tags from the ingredient master (tags are never trusted from the LLM). A third validates. I review a sample before shipping.

**Images:** no copyrighted photos. Use either (a) a consistent illustrated style generated once at build time and bundled, or (b) for the MVP, beautiful gradient cards with a large food emoji and the cuisine color. Start with (b).

### 5.3 Simple daily extras (`staples.json`)
Breakfast and lunch are not planned recipe-by-recipe (keeps the program zero-work). Instead, ship a short rotating "safe breakfasts" and "safe lunches" list per phase (e.g. "oats with lactose-free milk and blueberries", "rice bowl with leftover dinner"), plus "safe snacks" by category. Today shows 2 suggestions each. Leftover-friendly dinners count as tomorrow's lunch.

### 5.4 Test library (`tests.json`): the reintroduction program
Protocol, modeled on NHS dietitian reintroduction leaflets: **one group at a time, 3 days, escalating portion** (Day 1 portion, Day 2 = 2×, Day 3 = 3×). Stop the test early if symptoms show up. Wait until the user has had at least 2 calm days before starting the next test.

| Test group | Test food (add-on to that night's dinner, or a side) | Day 1 portion |
|---|---|---|
| Fructans: wheat | regular wheat bread or pasta | 1 slice bread / ½ cup cooked pasta |
| Fructans: onion | cooked onion | 1 tbsp |
| Fructans: garlic | garlic | ¼ clove |
| GOS | chickpeas or lentils | 2 tbsp |
| Lactose | regular milk or plain yogurt | ½ cup (125 ml) milk / 125 g yogurt |
| Fructose | honey or mango | 1 tsp honey / ¼ mango |
| Sorbitol | avocado or sweet corn | ¼ avocado / 3 tbsp corn |
| Mannitol | cauliflower, celery or sweet potato | 2 tbsp cauliflower / ¼ celery stick / 3 tbsp sweet potato |

**Reflux tests** (for reflux-dominant or mixed profiles): coffee (1 cup in the morning), tomato-based dinner, fried/fatty dinner, spicy dinner, chocolate (small square after dinner), citrus (orange or juice), carbonated drink, mint (mint tea), **late dinner** (a timing test: eat within 1.5h of bedtime instead of 3h). The alcohol test exists only for users 21+, and is opt-in.

**Test order (prioritized by how common the trigger is):**
- Bloating/IBS profile: wheat → onion → garlic → mannitol → GOS → lactose → fructose → sorbitol. Fructans and mannitol are the most common triggers in reintroduction studies, about 56% and 54% of patients.
- Reflux profile: coffee → tomato → fried/fatty → spicy → late dinner → chocolate → citrus → carbonation → mint (→ alcohol if 21+ and opted in).
- Mixed: interleave, starting with the user's chosen main symptom. Foods the user says they "already know are fine" can be skipped (with a confirmation).
- Users can mark "I already know this one bothers me". We then skip the test and mark it "Self-reported", shown differently from a tested result.

**Control (placebo) tests:** insert 1 control test for roughly every 4 real tests. It looks like a normal test ("Today's add-on: 2 rice cakes") but uses a non-trigger food. In onboarding, the user agrees to this explicitly: "Some test days are placebo checks so your results are accurate. We'll reveal which ones at the end." Controls are revealed on the final report. Why: in a 2024 reintroduction study, 26% of patients reacted to a glucose control, so expectation alone causes "reactions".

### 5.5 Prices (`prices.json` + `regions.json` + `chains.json`)
- `basePriceUSD` per pack = a typical regular (non-sale) store-brand price. Build it with a pipeline script from **BLS Average Price Data** (monthly US-city-average prices for common foods, free API), with documented estimates for items BLS doesn't cover.
- **Region multiplier:** BLS publishes regional averages (Northeast, Midwest, South, West). Map ZIP → state → Census region using a bundled ZIP3→state table.
- **Chain index:** a static multiplier per chain (Walmart, Aldi, Kroger family, Target, H-E-B, Publix, Albertsons/Safeway, Meijer, Wegmans, Whole Foods, Trader Joe's, Costco, Other), documented as estimates. Defaults: Aldi 0.85, Walmart 0.90, Kroger 1.00, Target 1.03, Publix 1.12, Whole Foods 1.30, and so on. Keep it editable in one file.
- **Refresh:** a monthly pipeline script updates the BLS numbers. The app shows a content version number in Settings.
- The user can tap any grocery line and override its price. The override is remembered for that store.

### 5.6 Education cards (`cards.json`)
About 30 cards, 30–60 seconds each, unlocked over the program ("Why we test one food at a time", "Garlic oil trick", "Eat dinner 3 hours before bed", "Why some test days are placebos"). Plain words, an 8th-grade reading level, and a source link where relevant.

---

## 6. Engines (pure TypeScript, fully unit tested, no React imports)

### 6.1 Program engine (state machine), `engines/program.ts`
```
SETUP → CALM → TESTING → PERSONAL
                 ↑   ↓
              (rest days between tests)
```
- **CALM:** all plans use `calmSafeGut` and/or `calmSafeReflux` recipes depending on the profile, plus reflux timing rules. Lasts at least 14 days. Ends early after day 14 once there have been 3 calm days in a row (score ≤ 1). Ends no later than day 28, no matter what. If symptoms didn't improve by day 28, show a kind "Calm didn't settle things: here's what that can mean, and it's worth talking to a doctor" screen, then let the user continue to testing or pause.
- **TESTING:** pull the next test from the queue. A test lasts up to 3 dose days. After a test ends, rest until 2 days in a row score at or below baseline+1, with at least 1 rest day. Then start the next test.
- **PERSONAL:** all tests are resolved. Weekly plans now include every tolerated group, include partial groups only up to their safe dose, and exclude only confirmed triggers. Offer a "retest" for anything Unclear, and a 3-month optional re-check.
- The engine must be **deterministic** and **time-based** (inject `now()` so the debug menu can time-travel).
- **Pause/vacation:** a "Pause program" option freezes the state machine. Resuming restarts at least 2 calm days before continuing testing.

### 6.2 Daily check-in model
- **One tap, once per evening.** "How was your stomach today?" 5 big buttons:
  - 0 = 😌 Great
  - 1 = 🙂 Good
  - 2 = 😐 Okay
  - 3 = 😣 Bad
  - 4 = 😫 Awful
- **Optional second tap** (chips, multi-select, skippable): bloating, gas, pain, heartburn, diarrhea, constipation, nausea.
- **Optional third tap**, shown only on test days: "Did you have tonight's test food?" Yes / No. If No, that dose is repeated tomorrow.
- **"Unusual day?" toggle** (collapsed by default): sick, period, very stressed, travel, alcohol, poor sleep. Unusual days are excluded from baseline and lower confidence.
- **Missed check-in:** stays missing (never assumed). If a dose day is missing, extend the test by one day.
- **Late check-in:** allow logging yesterday until noon the next day.

### 6.3 Trigger scoring, `engines/scoring.ts`
```
baseline = mean of the last 5 valid (non-unusual) CALM or REST day scores; baselineSD = their std dev
for each test:
  for dose d in 1..3 (stop when reaction found):
     window = max(score[testDay_d], score[testDay_d + 1])   // reactions can show the same evening or the next day
     delta  = window - baseline
     reaction_d = (delta >= 2) OR (delta >= 1 AND matching symptom chip, e.g. heartburn on a reflux test, bloating/gas on a FODMAP test)
  outcome:
     reaction at dose 1 → TRIGGER
     reaction at dose 2 → PARTIAL (small amounts OK: tolerates the day-1 portion)
     reaction at dose 3 → PARTIAL (moderate amounts OK: tolerates the day-2 portion)
     no reaction        → TOLERATED
  confidence:
     HIGH   if baselineSD <= 0.8 AND no unusual days in the window AND the nearest control test showed no reaction
     MEDIUM if one of those fails
     LOW    if two or more fail, OR the nearest control test produced a reaction of similar size → suggest retest
  self-reported skips → SELF_REPORTED (no confidence score)
UNCLEAR = LOW confidence where the delta is borderline (1 ≤ delta < 2 with no matching chip) → offer a one-tap retest added to the end of the queue
```
- Write **at least 25 unit tests**: clear trigger, partial at each dose, tolerated, missing days, unusual days, noisy baseline, control reaction lowering confidence, early stop, retest flow.
- Expose a human explanation string for every result, e.g. "Your stomach went from 'Good' to 'Bad' the night you had ½ clove of garlic, and back to normal 2 days later."

### 6.4 Weekly plan generator, `engines/plan.ts`
**Inputs:** profile (main symptom, phase, test schedule, results), household size, kids, cook nights (e.g. Mon–Fri), max minutes, equipment, diet, allergens, dislikes, budget, chain + region, pantry staples, bedtime, past-week history, thumbs up/down feedback.

**Steps:**
1. **Filter** recipes by phase safety + diet + allergens + dislikes + equipment + time. During TESTING, the test night's recipe must have a `testSlot` that can host today's test group.
2. **Score** each candidate per night: cost (lower is better), variety (penalize the same main protein or cuisine on consecutive nights), recency (penalize anything used in the last 4 weeks), ingredient overlap (reward sharing perishable ingredients to cut waste), kid-friendly match, and liked/disliked feedback.
3. **Greedy assignment**, then **local-search improvement** (swap pairs) to minimize total weekly cost while staying under budget. If the budget can't be met, return the cheapest valid plan with an "over budget by $X" note plus 2 suggestions.
4. **Reflux rule:** every planned dinner gets an "eat by" time = bedtime − 3h, and the UI shows it.
5. **Deterministic:** seeded by week and user, so regenerating gives the same plan unless the user taps "Shuffle week".
6. **Swap:** return the top 3 alternatives for any night, each with a price delta. The list and total update instantly.
7. **"Eating out" night:** remove that dinner. Its groceries leave the list, and the screen shows safe-order tips for the current phase.
8. **Two-week mode:** plan 14 nights with one shopping trip. Put perishables in week-1 recipes, and use frozen or longer-life items in week 2.

**Performance:** generating a week must take under 150 ms on a mid-range phone.

### 6.5 Grocery list builder, `engines/grocery.ts`
- Sum ingredient needs across the plan (scaled to household size) and convert to grams/ml/each.
- Choose the **cheapest combination of whole packs** that covers each need (small knapsack per ingredient).
- Cross off pantry staples the user owns. Group lines by aisle in store-walk order (produce → bakery → meat → dairy → frozen → pantry → spices → beverages).
- Each line shows: name, packs to buy ("2 × 16 oz"), price est., which dinners use it (tap to see).
- Show the total and a budget bar: green when under budget, amber within 5%, coral when over.
- Support check-off while shopping, a "Share list" export as text, and adding a custom item.

### 6.6 Price engine, `engines/price.ts`
`price(pack) = basePriceUSD × regionMultiplier[region] × chainIndex[chain]`, rounded to cents, with user overrides applied last. Unit-test the rounding and the overrides.

### 6.7 Notification scheduler, `engines/schedule.ts` + `/notifications`
All notifications are local, rescheduled every time the plan or program changes. Copy is in section 11.
- **Nightly check-in** at the user's chosen time (default 8:30 pm). If the user doesn't respond, one gentle follow-up 45 minutes later. Never more than 2 per day.
- **Test-day heads-up** at 4 pm: "Tonight's test: ¼ clove garlic in your stir-fry."
- **Sunday plan drop** at 10 am: "Your week is ready: 5 dinners, $108 at Walmart (est.)."
- **Trial reminder:** if a free trial started, send a local notification 24h before it ends.
- **Milestones:** Calm complete, test result ready, Case solved.
- Respect quiet hours (10 pm–8 am, except the check-in time the user chose).

---

## 7. Design system (make it feel like a top-10 Health & Fitness app)

### 7.1 Feel
Calm, warm and trustworthy, with a playful detective wink. Lots of white space, big rounded shapes, one focal point per screen, satisfying haptics. Think "clean wellness app" with a "case file" twist on the Results tab only.

### 7.2 Tokens (`/src/theme`)
```
Colors (light)                          Colors (dark)
bg            #FBFAF7 (warm off-white)  #0E0E12
surface       #FFFFFF                   #17171D
surfaceAlt    #F3F1EC                   #1F1F27
textPrimary   #15141A                   #F4F3F0
textSecondary #5E5B66                   #A9A6B2
border        #E7E4DD                   #2A2A33
brand         #6C4CF1 (violet)          #8B72FF
brandSoft     #EEE9FF                   #2A2346
good          #18B785 (mint)            #2BD39E      // tolerated / under budget
partial       #F2A93B (amber)           #FFBE55      // small amounts OK
trigger       #F0544F (coral)           #FF6B66      // trigger / over budget
unclear       #9A97A3                   #7D7A87
```
- **Type scale** (Plus Jakarta Sans for headings and buttons, Inter for body):
  - Display 34/40 Bold
  - Title 28/34 Bold
  - Headline 22/28 SemiBold
  - Body 17/24 Regular
  - Callout 15/21 Medium
  - Caption 13/18 Medium
  - Support Dynamic Type: never fix heights that clip text.
- **Spacing:** 4-pt grid (4, 8, 12, 16, 20, 24, 32, 40). Screen padding 20. **Radius:** cards 20, buttons 28 (pill), chips 14, sheets 28 (top).
- **Elevation:** one soft shadow only (y 4, blur 16, 6% black). In dark mode, use borders instead of shadows.

### 7.3 Core components (build all in Phase 0, with a dev-only gallery screen showing every state)
- **PrimaryButton:** full width, **56 pt tall**, pill, brand background, white 17 pt SemiBold label.
  - Pressed: scale 0.97 with spring + light haptic.
  - Disabled: 40% opacity.
  - Loading: spinner replaces the label, button keeps its width.
  - Always pinned to the bottom of onboarding screens, above the safe area, with a soft fade behind it.
- **SecondaryButton:** same size, brandSoft background, brand text. **TextButton:** brand text, 44 pt min hit area.
- **OptionCard** (onboarding answers): min height 64 pt, radius 20, emoji (28 pt) left, label 17 pt, optional sublabel.
  - Selected: 2 pt brand border, brandSoft fill, check icon on the right, light haptic + spring pop (scale 1 → 1.03 → 1).
  - Single-select auto-advances after 250 ms. Multi-select uses the Continue button.
- **Chip:** 36 pt tall, toggleable, used for symptoms and dislikes.
- **ProgressBar** (onboarding top): 6 pt tall, rounded, animates width; back chevron on the left.
- **Card**, **DinnerCard** (gradient + emoji + title + minutes + price est. + "eat by" pill), **TestBanner** (amber border, flask icon), **CheckInFaces** (5 large 64 pt round buttons in a row with labels underneath), **ScoreRing** (SVG ring with an animated stroke), **BudgetBar**, **StatusPill** (good/partial/trigger/unclear), **BottomSheet**, **Toast**, **ConfettiBurst** (subtle, brand + mint), **Stepper**, **Slider**, **TimePicker**, **EmptyState** (illustration + 1 line + 1 CTA).
- **Accessibility:**
  - Every touchable is at least 44×44 pt.
  - Text contrast at least 4.5:1.
  - Every control has a VoiceOver label.
  - Respect Reduce Motion: replace springs and confetti with fades.

### 7.4 Motion
- Screen transitions: native stack slide. Onboarding: horizontal slide plus progress bar growth.
- **Plan-building loader:** 6–8 seconds, a checklist animating line by line with a ring filling 0→100%.
- **Result reveal:** card flip (rotateY) from "Testing…" to the result, with a stamp animation ("TRIGGER" in coral / "CLEARED" in mint) and a matching haptic (warning / success).
- **Check-in:** the tapped face scales up, the others fade, then a checkmark draws in and the streak number ticks up.

---

## 8. Onboarding (one question per screen, progress bar, about 3 minutes)

General rules:
- Back button on every screen.
- Answers saved immediately, so killing the app resumes at the same step.
- Every screen fires `onboarding_step_viewed`.
- Copy lives in `/src/copy/onboarding.ts`.

**O0. Welcome.** Hero: an animated stack of 3 dinner cards fanning out with a small "trigger" stamp landing on one ingredient.
- Title: "Find the foods wrecking your stomach."
- Sub: "Without logging a thing."
- CTA: "Get started". Small link: "I already have an account" (restore purchases).

**O1. What to fix first?** (single-select) 🫃 "My stomach" (bloating, gas, heartburn…) / ✨ "My skin" (breakouts; shows "Coming soon, we'll start with your stomach" while the Skin flag is off) / 🔁 "Both".

**O2. Your birth year** (wheel picker). Apply the age rules from section 2.

**O3. What bothers you?** (multi-select chips) Bloating, Gas, Stomach pain or cramps, Heartburn or reflux, Diarrhea, Constipation, Nausea. **O3b.** If more than one was picked: "Which one bothers you most?" (single-select from those picked). This sets the profile: FODMAP-dominant, reflux-dominant, or mixed.

**O4. How often?** Every day / A few times a week / About once a week / Less than that.

**O5. When does it hit?** Right after eating / A few hours later / At night or lying down / In the morning / No pattern.

**O6. How much does it get in the way?** A 5-step slider with faces.
- **Then an empathy screen (not a question):** "You're not alone. About 1 in 7 adults dealt with bloating in just the past week, and nearly a third had heartburn." (These two stats are sourced, section 17.) Below: "Most never get a clear answer. Let's find yours."

**O7. Any suspects?** (multi-select chips) Dairy, Bread or pasta, Onion, Garlic, Beans, Coffee, Spicy food, Fried food, Fruit, Alcohol, Fizzy drinks, "No idea". **O7b.** "Any of these you KNOW are fine?" (multi-select from the same list). Picked items become test skips, after a confirmation.

**O8. Tried anything before?** (multi-select) Cutting out dairy, Gluten-free, Low-FODMAP, Antacids or acid pills, Probiotics, Nothing yet.
- **Then an objection screen:** "Elimination diets work, but most people quit because tracking every bite is exhausting. Culprit plans every dinner for you. Your only job: one tap at night." Side-by-side visual: "The old way: food diary, spreadsheets, guessing" vs "Culprit: follow the plan, tap once."

**O9. Safety check.** Red-flag list (section 2), multi-select + "None of these". Then the ED question, then the pregnancy question (only if relevant from O2). Show the right message for each answer.

**O10. How you eat.** Diet: No restrictions / Vegetarian / Vegan / Pescatarian. Allergies (chips). "Foods you won't eat" (chips + "Add"). If the user mentions celiac disease, show: "Follow your doctor's plan. Culprit will keep everything gluten-free for you." Then force gluten-free recipes and skip the wheat test.

**O11. Who's eating?** Stepper 1–8 people + "Kids at the table?" toggle. Message: "Everyone eats the same dinner. They just won't know it's 'gut-friendly'."

**O12. Cooking.** Which nights you cook (7 day toggles, default Mon–Fri) → time per dinner (15 / 30 / 45 min) → equipment (multi-select).

**O13. Where you shop.** ZIP code (numeric keypad, 5 digits, validated) → store chain list, with the most common chains for that region first → "We'll estimate prices at Walmart near 30301."

**O14. Weekly grocery budget.** Slider $40–$300 in $5 steps, defaulted from household size (1→$60, 2→$90, 4→$140). Copy: "We'll keep your week under this."

**O15. Already in your kitchen?** Tap to toggle staples (oil, salt, pepper, rice, oats, pasta, soy sauce, vinegar, spices). These get crossed off lists.

**O16. Bedtime.** Time picker, default 11:00 pm. For reflux profiles, explain: "Eating 3 hours before bed is one of the biggest heartburn helpers. We'll time your dinners."

**O17. Check-in time.** Time picker, default 8:30 pm. Copy: "One tap. Two seconds. That's the whole job."
- **Then the pre-permission screen:** illustration of the check-in notification. Buttons: "Turn on my check-in" (calls the real iOS prompt) / "Not now" (we ask again after their first plan). Never mimic the system dialog.

**O18. Where did you hear about us?** TikTok, Instagram, YouTube, Friend or family, Google, App Store, Reddit, Other. TikTok first.

**O19. How it works + consent.** A visual timeline:
- "Weeks 1–2: Calm start. Easy dinners that skip common triggers."
- "Weeks 3–8: Detective mode. We add one food back at a time."
- "After that: your personal plan, forever."

Checkbox (required): "I understand some test days are placebo checks, and that Culprit isn't medical advice." CTA: "Build my plan".

**O20. Building your plan** (loader, 6–8s, can't be skipped). Lines animate in with checkmarks:
- "Matching 150 dinners to your symptoms…"
- "Setting aside common triggers for now…"
- "Lining up your first suspects: wheat, onion…" (personalized)
- "Pricing everything at Walmart near 30301…"
- "Timing dinners to finish by 8:00 pm…" (reflux only)

The ring fills to 100%, then a success haptic.

**O21. Your first week** (the pre-paywall magic moment).
- Header: "Your first week is ready."
- 5 DinnerCards (titles visible, steps locked).
- Big number: "$112.40 at Walmart (est.)", with "$17.60 under your $130 budget" in mint.
- "Set aside for now: onion, garlic, wheat, beans…" chip row.
- "First suspects we'll test: Wheat → Onion → Garlic."
- Recipes and the list are blurred, with a lock icon. CTA: "Unlock my plan". This screen builds a real plan with the real engine, so it's genuinely theirs.

**O22. Save your progress (optional).** Sign in with Apple / Continue with Google / "Skip for now" (local only). If any social login is offered, Sign in with Apple must be offered too. With accounts, include in-app account deletion (Apple requirement).

**→ Paywall (section 9).**

---

## 9. Paywall (hard paywall, like TapCook and Cal AI)

Build a **custom paywall in code**, powered by RevenueCat Offerings (so prices are always localized and correct). Entitlement: `pro`. Products:
- `culprit_annual_3990`: **$39.99/year, 3-day free trial**, **pre-selected**. Shown as "$3.33/mo".
- `culprit_monthly_999`: **$9.99/month**, no trial.

**Screen flow** (3 short steps; the user can close at any step):

**P1. "Try Culprit free."** Big check-mark list:
- ✅ "A new gut-friendly plan every week"
- ✅ "Priced at your store, under your budget"
- ✅ "Find your triggers with one tap a day"
- ✅ "Your personal results, forever"

Under the list: "No payment due now." CTA: "Continue".

**P2. Trial timeline** (honest, builds trust). A vertical timeline:
- 🔓 "Today: Full access to your plan."
- 🔔 "Day 2: We'll remind you before your trial ends."
- 💳 "Day 3: Your subscription starts. Cancel anytime before."

CTA: "Continue".

**P3. Choose your plan.** Two plan cards:
- Annual card (selected) with a badge "3 DAYS FREE · SAVE 67%", showing "$39.99/year" with "$3.33/mo" under it.
- Monthly card: "$9.99/month".

CTA changes with the selection: "Start my free trial" (annual) or "Subscribe" (monthly). Fine print (13 pt, readable, 4.5:1 contrast): "3 days free, then $39.99/year. Auto-renews until canceled. Cancel anytime in Settings." Footer: Restore Purchases · Terms · Privacy.

**Rules:**
- Price and billing period must be large and legible (Apple 3.1.2).
- The close (X) button is always visible in the top-left. No hidden close, and no fake countdown timers.
- Show the trial badge only on the plan that actually has a trial.
- After a successful purchase: success haptic + confetti, then "You're in. Your calm start begins tomorrow."
- **If the paywall is closed:** go back to the O21 preview (locked). Twenty-four hours later, show a one-time welcome offer: an annual intro price (e.g. $29.99 for the first year), via a RevenueCat offering `welcome_offer`. Don't nag more than once per day.
- Store the trial start date locally to schedule the day-2 reminder.
- Add **RevenueCat Customer Center** in Settings for managing and canceling subscriptions.
- All prices come from RevenueCat. Never hardcode dollar amounts in the UI (the copy uses placeholders filled from the offering).

---

## 10. Main app (after purchase)

Tab bar: **Today · Plan · List · Results**, plus a profile button (top-right avatar) that opens Settings. Icons from lucide: Sun, CalendarDays, ShoppingBasket, Search (magnifier for the "case file").

### 10.1 Today
- Header: date, plus a **phase pill**: "Calm · Day 6 of 14" (mint), "Testing · Garlic · Day 2 of 3" (amber), or "Your plan" (brand).
- **Tonight's dinner card** (large): emoji/gradient, title, minutes, servings, "Eat by 8:00 pm" (reflux), and a **"Start cooking"** button → cooking mode.
- **Test banner** (test days only): "🧪 Tonight's test: ½ clove garlic, added to your stir-fry. Day 2 of 3." Tap for "Why this amount?"
- **Check-in card** (shown from 5 pm, or whenever the notification is tapped): "How was your stomach today?" → CheckInFaces → optional chips → done animation. After checking in, the card collapses to "✓ Checked in · 6-day streak."
- **Breakfast and lunch ideas:** 2 small horizontal cards each from the staples list.
- **Program ring:** progress through the whole program, with "Next: Onion test starts Thursday."
- **One education card per day** (dismissible).

### 10.2 Plan (week view)
- A week strip at the top (Mon–Sun). Each night is a DinnerCard with a price est. Test nights carry a flask badge. Non-cook nights say "Not cooking".
- Tap a dinner → recipe. Long-press or "⋯" → bottom sheet: Swap (3 alternatives with +/− price), Mark as eating out, Thumbs up/down.
- Header actions: "Shuffle week", "2-week plan" toggle.
- The bottom shows the week total vs budget (BudgetBar).

### 10.3 Recipe and cooking mode
- Hero, title, minutes, a servings scaler (defaults to household size), and the ingredient list with quantities. Swap tips appear inline ("Use garlic-infused oil, not fresh garlic").
- If it's a test night, the test ingredient is highlighted in amber with its exact amount.
- **Cooking mode:** large text, one step per screen, swipe to advance, tap-to-start timers, screen kept awake. At the end: "Done! Check in tonight."

### 10.4 List
- Grouped by aisle, with checkboxes, pack counts, price est. per line, and which dinners use each item.
- Sticky total + budget bar at the bottom, with a small "est." info icon → sheet explaining how prices are estimated.
- Pantry items are crossed off with a "you have this" label (tap to un-cross). "Add item", "Share list".
- A "Done shopping" button collapses checked items.

### 10.5 Results ("Case file")
- Title: "Your case file". Subtitle depends on state: "3 suspects cleared, 1 trigger found, 4 to go."
- A **suspect board** grid: one card per test group, showing the group icon, name, and a status pill (Untested / Testing / Trigger / Small amounts OK / Cleared / Unclear / Self-reported).
- Tap a card → test detail: daily scores chart for that test (baseline line + dose markers), the plain-English explanation from the scoring engine, confidence, and a "Retest" button.
- **Trend chart:** daily stomach score over the program (7-day smoothed line). The Calm phase is shaded.
- **"Case solved" report** (unlocked when the queue is empty):
  - A summary list grouped into Triggers / Small amounts OK / Cleared, with control tests revealed.
  - **Share card** (1080×1350 image): "My Culprit results: Garlic ❌ · Onion ❌ · Dairy ✅ · Coffee ✅ · Wheat (small amounts) 🟡", with the app name and a subtle URL. No health details beyond what the user chooses to share; preview before sharing.
  - **Doctor PDF:** profile summary, timeline, every test with doses, results and confidence, and the disclaimer.
  - The moment it unlocks: confetti + success haptic, then `expo-store-review` asks for a rating (max once per 120 days).

### 10.6 Settings
- Profile & preferences: household, budget, store/ZIP, cook nights, time, equipment, diet, dislikes, pantry, bedtime.
- Notifications (check-in time, toggles). Subscription (Customer Center, Restore).
- Program: pause/resume, retest a food, restart program.
- "How Culprit works" (method + sources), Medical disclaimer, Privacy Policy, Terms, Data attribution, Contact/Help.
- Export my data (JSON), Delete all my data (and account, if any), content version, app version.

### 10.7 Debug screen (dev builds only)
Time travel (± days), seed a demo user at any phase, simulate check-in patterns (clear trigger / noisy / control reaction), reset onboarding, show program state JSON, force paywall/offer.

---

## 11. Copy and notification text (voice: friendly detective, calm, short)

- Check-in push: "How was your stomach today? One tap 👆"
- Follow-up: "Still there? Tonight's tap keeps your results accurate."
- Test heads-up: "🧪 Tonight's test: ¼ clove garlic in your stir-fry."
- Sunday: "Your week is ready: 5 dinners, ${total} at ${store} (est.)."
- Calm complete: "Calm start done ✅ Time to start finding your culprits."
- Result ready: "Garlic test complete. Tap to see the verdict."
- Case solved: "Case solved 🕵️ Your full results are ready."
- Trial: "Your free trial ends tomorrow. Keep your plan going, or cancel anytime in Settings."

Empty and edge states always explain what happens next, with one button.

---

## 12. Skin mode (Phase 8, behind `FEATURE_SKIN` flag)

Same zero-work formula, adapted:
- **Onboarding (short):** main concern (breakouts, blackheads, redness, oily, dry) → where (forehead, cheeks, chin/jaw, back) → how long → current products (pick types) → sensitive skin? → monthly skincare budget → store → check-in time. Under 18: no diet experiments.
- **What it hands you:** a complete morning + night routine built from preloaded product **archetypes**, priced at their store (est.), under budget:
  - gentle non-comedogenic cleanser
  - oil-free moisturizer
  - non-comedogenic sunscreen SPF 30+ (AM)
  - one evening treatment: benzoyl peroxide wash / adapalene 0.1% gel / salicylic acid 2%
  - Example products may be listed with factual info only.
- **Rules from AAD guidance, built into the schedule:**
  - Change **one product at a time**.
  - Judge a treatment only after **6–8 weeks** (full clearing often takes 3–4 months).
  - Choose "non-comedogenic" products. Don't scrub. Wash twice daily and after sweating. Don't pick.
- **Experiments** (18+ only, optional, framed as "may help some people"): pause cow's milk for 4 weeks then reintroduce it for 2; lower-sugar/low-glycemic swaps for 8–12 weeks. Evidence: moderate for low-glycemic, weaker and mostly observational for milk.
- **Daily input:** one tap, "Skin today?": Clear / A few spots / Some breakouts / Bad breakout. Optional **guided selfie** (face-outline overlay, same angle and light, stored on the device only, never uploaded) → weekly before/after slider.
- **Results board:** "New moisturizer: possibly breaking you out", "Milk: no clear effect". Same scoring idea with longer windows.
- Barcode scan for skincare products (optional): Open Beauty Facts lookup cached locally, flagging fragrance and showing "non-comedogenic" only if the label claims it. Show ODbL attribution.

---

## 13. Analytics (PostHog), with no health data

**Events:** `app_opened`, `onboarding_step_viewed {step}`, `onboarding_completed`, `plan_preview_viewed`, `paywall_viewed {step, offering}`, `paywall_closed {step}`, `trial_started {product}`, `purchase_completed {product}`, `purchase_restored`, `welcome_offer_viewed`, `checkin_submitted` (**no score**), `test_started {group}`, `test_completed` (**no outcome**), `plan_generated`, `dinner_swapped`, `eating_out_marked`, `list_item_checked`, `list_shared`, `share_card_created`, `pdf_exported`, `notification_opened {type}`, `program_paused`, `retest_requested`, `rating_prompt_shown`.

**User properties:** acquisition source (O18), mode, profile type (fodmap/reflux/mixed), household size bucket, budget bucket, store chain, phase. Never send symptom answers, scores or results.

**Funnels to build:** Welcome → O21 → paywall → trial; trial → paid; day-1/7/30 check-in retention.

---

## 14. Privacy and security

- All health data stays in SQLite on the device. Enable SQLite file protection (iOS Data Protection class "complete until first user authentication" or stronger).
- No health data in iCloud backups of the DB if it can be avoided (Apple guideline 5.1.3).
- "Delete all my data" wipes SQLite, prefs and the RevenueCat app user alias (subscription status remains with Apple).
- Secrets (RevenueCat keys, PostHog key) live in EAS env vars.
- The privacy policy and terms are placeholders I will replace with real, reviewed documents before launch. Put links in Settings and on the paywall.
- App Store privacy nutrition label: analytics only (no health data collected off-device).

---

## 15. Build phases (stop after each one)

**Phase 0: Foundation.** Expo project, TypeScript strict, Expo Router, ESLint + Prettier, theme tokens (light/dark), fonts, all components from 7.3 with the dev gallery screen, copy module, SQLite setup + migrations, a Zustand store skeleton, `CLAUDE.md`. *Done when:* the gallery shows every component state in light and dark mode, and lint + tests pass.

**Phase 1: Content pipeline.** zod schemas, ingredients (350), a recipe drafting script, the tag-derivation script, the validator with all coverage rules from 5.2, tests.json, staples.json, cards.json, the price pipeline (BLS fetch + region/chain tables), ZIP3→region. Output to `/assets/data` with a content version. *Done when:* `npm run content:validate` passes and prints a coverage report.

**Phase 2: Engines.** program, scoring (25+ tests), plan, grocery, price, schedule, all pure TS. *Done when:* all unit tests pass, plan generation takes under 150 ms, and the debug CLI prints a sample 4-week program simulation.

**Phase 3: Onboarding + plan preview.** Every screen in section 8 with real engine output at O21, resume-on-relaunch, safety logic, notification pre-permission. *Done when:* a Maestro flow completes onboarding for 3 profiles (bloating, reflux, mixed) and an under-18 path is blocked correctly.

**Phase 4: Paywall + purchases.** RevenueCat setup (I'll add keys and products), the custom 3-step paywall, welcome offer, restore, Customer Center, entitlement gating, trial reminder. *Done when:* a sandbox purchase unlocks the app, restore works, and the paywall passes the 3.1.2 checklist.

**Phase 5: Main tabs.** Today, Plan (swap, eating out, shuffle, 2-week), Recipe + cooking mode, List. *Done when:* a full simulated week works end to end in the debug time-travel.

**Phase 6: Check-ins, tests, results.** Check-in flow, the test lifecycle wired to the program engine, the Results case file, reveal animations, share card, doctor PDF, rating prompt. *Done when:* a simulated 8-week program produces correct results and the report.

**Phase 7: Polish.** Notifications (all types), analytics events, settings, data export/delete, accessibility pass (VoiceOver, Dynamic Type, contrast), reduce-motion, performance pass, error boundaries, empty states. *Done when:* the accessibility checklist passes and there are no warnings in a release build.

**Phase 8: Skin mode** behind the flag (section 12).

**Phase 9: Ship prep.** App icon + splash (I'll provide or approve), App Store screenshots plan (6 frames: hook, first week priced, one-tap check-in, test day, case file, share card), metadata draft (name, subtitle, keywords), review notes ("No login required; hard paywall; sandbox account provided"), TestFlight build.

---

## 16. Coding rules for you (Claude Code)

- TypeScript strict, no `any`, no `// @ts-ignore`. Small, focused components. Business logic lives only in `/src/engines`.
- All user-facing strings live in `/src/copy`. All colors and sizes come from theme tokens (no magic numbers in styles).
- Use FlashList for lists over 20 items. Memoize heavy selectors.
- Every engine function gets unit tests. Every screen handles loading, empty and error states.
- Don't add dependencies beyond section 3 without asking me.
- Never call an LLM or AI API from the app.
- Never invent data that's shown to users as fact (stats, reviews, prices without the "est." label).
- Keep `CLAUDE.md` updated with decisions you make.
- At the end of every phase: run lint + tests, commit, summarize, and list anything you need from me.

---

## 17. Sources for in-app claims and method (use these in "How Culprit works")

- Bloating in about 1 in 7 US adults in the past week (88,795 surveyed): https://blogs.the-hospitalist.org/content/bloating-common-often-ignored-survey
- Heartburn/reflux symptoms in 30.9% of US adults in the past week (71,812 surveyed, Cedars-Sinai): https://www.hpnonline.com/patient-satisfaction/population-health-care-continuum/article/21119353/acid-reflux-affects-nearly-a-third-of-us-adults-weekly
- Reintroduction study (80% responded to low-FODMAP; 85% found at least one trigger; fructans 56%, mannitol 54%; 26% reacted to a glucose control): https://gi.org/journals-publications/ebgi/schoenfeld_nov2024/
- NHS FODMAP reintroduction protocol (3-day escalating portions, one group at a time): https://www.gloshospitals.nhs.uk/documents/17365/FODMAP_reintroduction_information_for_website_Feb_23_update.pdf
- ACG GERD guideline (avoid meals 2–3 hours before bed, avoid trigger foods, elevate head of bed): https://www.healio.com/news/gastroenterology/20211122/acg-updates-guidelines-for-gerd-diagnosis-management
- Garlic-infused oil and fructans: https://www.fodmapeveryday.com/know-whats-garlic-oil/
- AAD acne habits (6–8 weeks per product, non-comedogenic, don't scrub): https://www.aad.org/public/diseases/acne/skin-care/habits-stop
- Diet and acne evidence (low-glycemic moderate, milk weaker): https://blogs.the-hospitalist.org/content/update-diet-and-acne
- Open Food Facts licensing (ODbL): https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/
- RevenueCat + Expo setup: https://www.revenuecat.com/docs/getting-started/installation/expo
- Onboarding paywalls with trials convert best, and most purchases happen on Day 0 (Adapty 2026): https://adapty.io/blog/high-performing-paywall-2026/

**Start now: create `CLAUDE.md`, then do Phase 0 and stop.**
