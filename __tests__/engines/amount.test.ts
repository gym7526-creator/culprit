import { displayAmount, servingScale } from '@/engines/amount';

describe('display amounts', () => {
  it('converts grams to oz / lb', () => {
    expect(displayAmount(600, 'g')).toEqual({ qty: 1.25, unit: 'lb' });
    expect(displayAmount(100, 'g')).toEqual({ qty: 3.5, unit: 'oz' });
  });
  it('converts ml to cups / tbsp / tsp', () => {
    expect(displayAmount(240, 'ml')).toEqual({ qty: 1, unit: 'cup' });
    expect(displayAmount(30, 'ml')).toEqual({ qty: 2, unit: 'tbsp' });
    expect(displayAmount(5, 'ml')).toEqual({ qty: 1, unit: 'tsp' });
  });
  it('scales by servings', () => {
    expect(displayAmount(1.5, 'cup', servingScale(4, 2))).toEqual({ qty: 0.75, unit: 'cup' });
    expect(displayAmount(2, 'each', servingScale(4, 6))).toEqual({ qty: 3, unit: 'each' });
  });
});
