import { generateWarmupSets } from '../warmupCalculator';

describe('warmupCalculator (AJ-15)', () => {
  it('returns empty array for zero, negative or non-finite target weights', () => {
    expect(generateWarmupSets(0)).toEqual([]);
    expect(generateWarmupSets(-40)).toEqual([]);
    expect(generateWarmupSets(Number.NaN)).toEqual([]);
  });

  it('generates 2 light sets when target weight is <= barWeightKg (20 kg)', () => {
    const sets = generateWarmupSets(20);
    expect(sets).toHaveLength(2);
    expect(sets[0]).toMatchObject({ weightKg: 10, reps: 10, percentage: 50 });
    expect(sets[1]).toMatchObject({ weightKg: 15, reps: 5, percentage: 75 });
  });

  it('generates 3 progressive sets for medium weights (e.g. 40 kg)', () => {
    const sets = generateWarmupSets(40);
    expect(sets).toHaveLength(3);
    expect(sets[0].weightKg).toBe(17.5);
    expect(sets[1].weightKg).toBe(25);
    expect(sets[2].weightKg).toBe(35);
    sets.forEach((s) => expect(s.weightKg).toBeLessThan(40));
  });

  it('generates 4 progressive sets rounded to 2.5 kg for heavy weights (e.g. 100 kg)', () => {
    const sets = generateWarmupSets(100);
    expect(sets).toHaveLength(4);
    expect(sets.map((s) => s.weightKg)).toEqual([20, 50, 70, 85]);
    expect(sets.map((s) => s.reps)).toEqual([10, 5, 3, 1]);
  });
});
