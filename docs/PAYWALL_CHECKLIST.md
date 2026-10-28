# Paywall: Apple 3.1.2 checklist and RevenueCat setup

## 3.1.2 checklist (custom paywall, `app/(paywall)/`)

| Requirement | Where |
| --- | --- |
| Price and billing period are the largest text on each plan card | `PlanCard` (`headline`, 22 pt): "$39.99/year", "$9.99/month" |
| Per-month equivalent is secondary to the real billed price | `$3.33/mo` in `callout` under the yearly price |
| Free-trial length, then price, stated before purchase | P3 fine print: "3 days free, then $39.99/year. Auto-renews until canceled. Cancel anytime in Settings." |
| Trial badge only on a plan that has a trial | `annual.trialDays` from the store (`introPrice.price === 0`) |
| Auto-renewal and how to cancel | Fine print on P3 and the welcome offer |
| Close button always visible, top-left, no countdowns | `PaywallFrame` (44×44 pt X on every step) |
| Restore Purchases | Footer on every step, Welcome screen link, Settings |
| Terms of Use (EULA) and Privacy Policy links | Footer + Settings (`src/config.ts`) |
| Prices localized from the store, never hardcoded | All amounts come from RevenueCat offerings (`src/purchases`) |
| Manage / cancel subscription in app | Settings → "Manage subscription" (RevenueCat Customer Center) |
| Fine print ≥ 13 pt and ≥ 4.5:1 contrast | `caption` (13 pt) in `textSecondary` (contrast test) |

## What the owner sets up

1. **Apple Developer Program** ($99/year) and an app record in App Store Connect with bundle ID
   (replace `com.culprit.app` in `app.json`).
2. **App Store Connect → Subscriptions:** one group with
   - `culprit_annual_3990`: $39.99/year, introductory offer = free trial, 3 days.
   - `culprit_monthly_999`: $9.99/month, no trial.
   - For the welcome offer: a second annual product (or a promotional/intro price) at $29.99 for the first year.
3. **RevenueCat:** new project → iOS app (App Store Connect API key / in-app purchase key).
   - Entitlement `pro`, attached to all products.
   - Offering `default` (set as current) with `$rc_annual` and `$rc_monthly` packages.
   - Offering `welcome_offer` with an annual package whose product has the paid intro price.
   - Enable **Customer Center**.
4. **Keys:** add the public SDK keys as EAS environment variables:
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` later).
5. **Terms / Privacy:** host a privacy policy and set the URL in `src/config.ts` (Terms default to
   Apple's standard EULA).
6. **Sandbox test:** create a Sandbox Apple ID, install a dev build (`eas build --profile development`),
   buy the annual plan, check the app unlocks, delete and reinstall, tap Restore Purchases.

Without a key, dev builds and previews use an in-memory test store (labelled "Test store: no real
payment"); a release build without a key sells nothing instead of unlocking for free.
