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

export type NumericFieldType = 'weightKg' | 'reps' | 'rir';

/**
 * Calcule la valeur suivante du clavier numérique en gérant les décimales,
 * la suppression et le basculement du signe +/- pour les charges PDC assistées.
 */
export function computeNextNumericValue(
  prevVal: string,
  key: string,
  activeField: NumericFieldType | null
): string {
  if (key === '+/-') {
    if (activeField !== 'weightKg') return prevVal;
    if (prevVal === '' || prevVal === '0') return '-';
    if (prevVal === '-') return '';
    if (prevVal.startsWith('-')) return prevVal.slice(1);
    return '-' + prevVal;
  }
  if (key === 'backspace') {
    return prevVal.length > 0 ? prevVal.slice(0, -1) : '';
  }
  if (key === '.') {
    if (activeField === 'reps') return prevVal;
    if (prevVal.includes('.')) return prevVal;
    if (prevVal === '') return '0.';
    if (prevVal === '-') return '-0.';
    return prevVal + '.';
  }

  // Limitation à 2 chiffres après la virgule (ex: 82.25)
  if (prevVal.includes('.')) {
    const decimalPart = prevVal.split('.')[1];
    if (decimalPart && decimalPart.length >= 2) {
      return prevVal;
    }
  }

  // Si premier chiffre après 0 ou -0 (sans point)
  if (prevVal === '0') {
    return key;
  }
  if (prevVal === '-0') {
    return '-' + key;
  }

  // Limitation à 6 caractères (7 si signe négatif)
  const maxLen = prevVal.startsWith('-') ? 7 : 6;
  if (prevVal.length >= maxLen) {
    return prevVal;
  }

  return prevVal + key;
}
