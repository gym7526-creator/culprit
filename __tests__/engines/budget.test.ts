import { budgetFill, budgetStatus } from '@/engines/budget';

describe('budgetStatus', () => {
  it('is under below 95% of budget', () => {
    expect(budgetStatus(112.4, 130)).toBe('under');
  });
  it('is near within 5% under budget', () => {
    expect(budgetStatus(123.5, 130)).toBe('near');
    expect(budgetStatus(130, 130)).toBe('near');
  });
  it('is over above budget', () => {
    expect(budgetStatus(130.01, 130)).toBe('over');
  });
  it('handles a zero budget', () => {
    expect(budgetStatus(0, 0)).toBe('under');
    expect(budgetStatus(5, 0)).toBe('over');
  });
});

describe('budgetFill', () => {
  it('clamps to [0, 1]', () => {
    expect(budgetFill(65, 130)).toBeCloseTo(0.5);
    expect(budgetFill(200, 130)).toBe(1);
    expect(budgetFill(-5, 130)).toBe(0);
    expect(budgetFill(5, 0)).toBe(1);
  });
});
