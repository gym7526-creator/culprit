# Accessibility & polish checklist (Phase 7)

| Item | Status | How it's enforced |
| --- | --- | --- |
| Every control has a role and an accessible name | ✅ | `__tests__/mainApp/phase7.test.tsx` sweeps Today, Plan, List, Results and all Settings screens |
| Text contrast ≥ 4.5:1 (light + dark) | ✅ | `__tests__/theme.test.ts`; status colors as text use the `*Ink` tokens |
| Touch targets ≥ 44×44 pt | ✅ | `size.minTouch` / `size.button` / `size.optionCard` tokens; icon buttons use `hitSlop` |
| Dynamic Type never clips | ✅ | `minHeight` everywhere, no fixed text heights |
| Reduce Motion | ✅ | Springs, confetti, progress and sheets switch to fades (`useReducedMotion`); Reanimated layout animations follow the system setting |
| VoiceOver: charts | ✅ | Charts are a single accessible element with a summary label |
| VoiceOver: live updates | ✅ | Timers, the loader checklist and toasts use live regions |
| Error boundaries | ✅ | `AppErrorBoundary` on the root and every route group (friendly message + retry, no stack traces) |
| Empty / loading / error states | ✅ | Every screen; empty states say what happens next with one button |
| No health data in analytics | ✅ | Typed event list; onboarding branch screens are never sent; test asserts no symptoms/scores/results |
| Notifications: quiet hours, max 2 check-in nudges | ✅ | `engines/schedule.ts` tests; milestones are sent once (`appStore.notified`) |
| iOS data protection | ✅ | `NSFileProtectionComplete` entitlement in `app.json` (needs the Data Protection capability, which EAS syncs) |
| Exclude the database from iCloud backup | ⏳ owner decision | Needs a small native module (no approved package sets `NSURLIsExcludedFromBackupKey`). Trade-off: excluded data is lost when moving to a new phone. |
| No warnings in a release build | ⏳ needs a device build | `npx expo export` bundles cleanly; check `eas build --profile production` logs before TestFlight |
| Manual VoiceOver pass on a device | ⏳ Phase 9 | Walk onboarding → paywall → Today → check-in → Results with VoiceOver on |
