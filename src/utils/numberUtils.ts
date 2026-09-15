/**
 * Convertit proprement une chaîne représentant un nombre décimal (avec '.' ou ',') en float.
 * Gère les claviers français/européens où la virgule ',' est utilisée comme séparateur décimal.
 * Exemple: "82,5" -> 82.5, "82.5" -> 82.5, "82" -> 82
 */
export function parseFloatFrench(val: string | number | null | undefined): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : Math.round(val * 100) / 100;

  const normalized = String(val).replace(',', '.').trim();
  if (normalized === '' || normalized === '.' || normalized === '-') return undefined;

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : Math.round(parsed * 100) / 100;
}

/**
 * Formate un poids en conservant jusqu'à 2 chiffres après la virgule (ex: 72.5 -> "72.5", 72.25 -> "72.25", 72 -> "72")
 */
export function formatWeight(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val.toFixed(2)).toString();
}

/**
 * Formate un poids avec son unité et jusqu'à 2 chiffres après la virgule.
 */
export function formatWeightWithUnit(val?: number | null, unit: string = 'kg'): string {
  if (val === undefined || val === null || isNaN(val)) return `-- ${unit}`;
  return `${formatWeight(val)} ${unit}`;
}
