import { getContrastTextColor } from '../colorUtils';

describe('colorUtils - WCAG AA Contrast (AM-03)', () => {
  it('returns dark text (#0B0E14) on Citadel khaki accent (#9CB080)', () => {
    expect(getContrastTextColor('#9CB080')).toBe('#0B0E14');
  });

  it('returns dark text on white (#FFFFFF)', () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('#0B0E14');
  });

  it('returns white text (#FFFFFF) on dark background (#0B0E14 / #1E293B)', () => {
    expect(getContrastTextColor('#0B0E14')).toBe('#FFFFFF');
    expect(getContrastTextColor('#1E293B')).toBe('#FFFFFF');
  });

  it('returns white fallback for missing or invalid hex', () => {
    expect(getContrastTextColor(undefined)).toBe('#FFFFFF');
    expect(getContrastTextColor('')).toBe('#FFFFFF');
  });
});
