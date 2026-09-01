/**
 * Convertit proprement une chaîne représentant un nombre décimal (avec '.' ou ',') en float.
 * Gère les claviers français/européens où la virgule ',' est utilisée comme séparateur décimal.
 * Exemple: "82,5" -> 82.5, "82.5" -> 82.5, "82" -> 82
 */
export function parseFloatFrench(val: string | number | null | undefined): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;

  const normalized = String(val).replace(',', '.').trim();
  if (normalized === '' || normalized === '.' || normalized === '-') return undefined;

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : parsed;
}
