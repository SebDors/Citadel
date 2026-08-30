/**
 * Normalise une chaîne de caractères en supprimant les accents (diacritiques)
 * et en convertissant en minuscules pour une comparaison insensible aux accents et à la casse.
 * Exemple: "Développé Couché" -> "developpe couche"
 */
export function normalizeString(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
