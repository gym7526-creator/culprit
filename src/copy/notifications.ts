/** Local notification copy (spec §11). Placeholders are filled with `format()`. */
export const notificationCopy = {
  checkIn: 'How was your stomach today? One tap 👆',
  skinCheckIn: 'Skin today? One tap ✨',
  checkInFollowUp: 'Still there? Tonight’s tap keeps your results accurate.',
  testHeadsUp: '🧪 Tonight’s test: {portion} in your {dish}.',
  sundayPlan: 'Your week is ready: {count} dinners, {total} at {store} (est.).',
  calmComplete: 'Calm start done ✅ Time to start finding your culprits.',
  resultReady: '{group} test complete. Tap to see the verdict.',
  caseSolved: 'Case solved 🕵️ Your full results are ready.',
  trialEnding:
    'Your free trial ends tomorrow. Keep your plan going, or cancel anytime in Settings.',
} as const;
