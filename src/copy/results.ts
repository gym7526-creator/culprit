/** Plain-English result explanations (spec §6.3). Placeholders are filled with `format()`. */
export const resultCopy = {
  faceLabels: ['Great', 'Good', 'Okay', 'Bad', 'Awful'],
  trigger: 'Your stomach went from “{from}” to “{to}” the night you had {portion}{recovery}',
  partial:
    'You were fine with {safePortion}, but your stomach went from “{from}” to “{to}” after {portion}{recovery}',
  tolerated: 'Your stomach stayed around “{from}” through all three days, up to {portion}.',
  unclear:
    'The signal was too small or too noisy to call. Your scores moved a little, but not clearly. A retest can settle it.',
  noBaseline: 'We didn’t have enough calm days logged before this test to compare against.',
  noData: 'There weren’t enough check-ins during this test to read a result.',
  selfReported: 'You told us this one bothers you, so we skipped testing it.',
  recoveryDays: ', and back to normal {days} days later.',
  recoveryOneDay: ', and back to normal the next day.',
  recoveryNone: '.',
  controlReacted:
    'This was a placebo day, and your scores rose anyway. Expectation can do that, so nearby results are less certain.',
  controlCalm: 'This was a placebo day, and your scores stayed steady.',
} as const;
