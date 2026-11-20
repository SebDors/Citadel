import { parseFloatFrench, formatWeight, formatWeightWithUnit, computeNextNumericValue } from '../numberUtils';

describe('numberUtils', () => {
  describe('parseFloatFrench', () => {
    it('parses French comma decimal strings properly', () => {
      expect(parseFloatFrench('82,5')).toBe(82.5);
      expect(parseFloatFrench('100,25')).toBe(100.25);
    });

    it('parses dot decimal strings properly', () => {
      expect(parseFloatFrench('82.5')).toBe(82.5);
      expect(parseFloatFrench('60')).toBe(60);
    });

    it('parses negative values for bodyweight assistance properly (AJ-16)', () => {
      expect(parseFloatFrench('-15')).toBe(-15);
      expect(parseFloatFrench('-12,5')).toBe(-12.5);
    });

    it('handles empty, null, undefined or invalid inputs cleanly', () => {
      expect(parseFloatFrench('')).toBeUndefined();
      expect(parseFloatFrench(null)).toBeUndefined();
      expect(parseFloatFrench(undefined)).toBeUndefined();
      expect(parseFloatFrench('.')).toBeUndefined();
      expect(parseFloatFrench('-')).toBeUndefined();
      expect(parseFloatFrench('abc')).toBeUndefined();
    });
  });

  describe('formatWeight', () => {
    it('formats numbers with up to 2 decimal places', () => {
      expect(formatWeight(75)).toBe('75');
      expect(formatWeight(75.5)).toBe('75.5');
      expect(formatWeight(75.25)).toBe('75.25');
      expect(formatWeight(null)).toBe('-');
      expect(formatWeight(undefined)).toBe('-');
    });
  });

  describe('formatWeightWithUnit', () => {
    it('formats value with unit', () => {
      expect(formatWeightWithUnit(80, 'kg')).toBe('80 kg');
      expect(formatWeightWithUnit(undefined, 'cm')).toBe('-- cm');
    });
  });

  describe('computeNextNumericValue', () => {
    it('toggles +/- sign only when activeField is weightKg (AJ-16)', () => {
      expect(computeNextNumericValue('', '+/-', 'weightKg')).toBe('-');
      expect(computeNextNumericValue('0', '+/-', 'weightKg')).toBe('-');
      expect(computeNextNumericValue('-', '+/-', 'weightKg')).toBe('');
      expect(computeNextNumericValue('15', '+/-', 'weightKg')).toBe('-15');
      expect(computeNextNumericValue('-15', '+/-', 'weightKg')).toBe('15');
      expect(computeNextNumericValue('10', '+/-', 'reps')).toBe('10');
      expect(computeNextNumericValue('2', '+/-', 'rir')).toBe('2');
    });

    it('formats negative decimals and digits cleanly without dropping sign', () => {
      expect(computeNextNumericValue('-', '.', 'weightKg')).toBe('-0.');
      expect(computeNextNumericValue('-0', '5', 'weightKg')).toBe('-5');
      expect(computeNextNumericValue('-12.5', '5', 'weightKg')).toBe('-12.55');
      expect(computeNextNumericValue('-12.55', '9', 'weightKg')).toBe('-12.55');
      expect(computeNextNumericValue('-125.75', '9', 'weightKg')).toBe('-125.75');
    });
  });
});
