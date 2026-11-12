export function getContrastTextColor(hex?: string): string {
  if (!hex || hex.length < 6) return '#FFFFFF';
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Seuil WCAG AA / AAA à 0.45 pour garantir une lisibilité optimale sur les teintes moyennes claires (#9CB080 kaki, etc.)
  return luminance > 0.45 ? '#0B0E14' : '#FFFFFF';
}
