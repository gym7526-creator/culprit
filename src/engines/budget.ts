/** Budget status for the budget bar (spec §6.5): under → mint, within 5% → amber, over → coral. */
export type BudgetStatus = 'under' | 'near' | 'over';

export const BUDGET_NEAR_THRESHOLD = 0.95;

export function budgetStatus(total: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return total > 0 ? 'over' : 'under';
  }
  const ratio = total / budget;
  if (ratio > 1) return 'over';
  if (ratio >= BUDGET_NEAR_THRESHOLD) return 'near';
  return 'under';
}

/** Fill fraction for the bar, clamped to [0, 1]. */
export function budgetFill(total: number, budget: number): number {
  if (budget <= 0) return total > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, total / budget));
}
