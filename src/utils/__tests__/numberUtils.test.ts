import { parseFloatFrench, formatWeight, formatWeightWithUnit } from '../numberUtils';

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
});
