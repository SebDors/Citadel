/**
 * Référentiel musculaire normalisé pour Citadel
 * Feature 1 : Normalisation du référentiel musculaire et migration
 */

export const MUSCLE_GROUPS = [
  'Pectoraux',
  'Grand Dorsal',
  'Trapèzes',
  'Rhomboïdes',
  'Grand Rond',
  'Deltoïde Antérieur',
  'Deltoïde Latéral',
  'Deltoïde Postérieur',
  'Biceps',
  'Triceps',
  'Avant-bras',
  'Quadriceps',
  'Ischio-Jambiers',
  'Grand Fessier',
  'Adducteurs',
  'Mollets (Gastrocnémiens)',
  'Mollets (Soléaire)',
  'Lombaires',
  'Abdominaux',
  'Obliques',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export interface MuscleTarget {
  muscle: MuscleGroup;
  subRegion?: string;
  role: 'primary' | 'secondary';
  fraction: number;
}

/**
 * Répartition des groupes musculaires par grande catégorie d'exercice
 */
export const CATEGORY_MUSCLE_GROUPS: Record<
  'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos',
  MuscleGroup[]
> = {
  Pectoraux: ['Pectoraux'],
  Dos: ['Grand Dorsal', 'Trapèzes', 'Rhomboïdes', 'Grand Rond', 'Lombaires'],
  Épaules: ['Deltoïde Antérieur', 'Deltoïde Latéral', 'Deltoïde Postérieur'],
  Bras: ['Biceps', 'Triceps', 'Avant-bras'],
  Jambes: [
    'Quadriceps',
    'Ischio-Jambiers',
    'Grand Fessier',
    'Adducteurs',
    'Mollets (Gastrocnémiens)',
    'Mollets (Soléaire)',
  ],
  Abdos: ['Abdominaux', 'Obliques'],
};

/**
 * Fonction utilitaire pour normaliser une chaîne en minuscules sans accents
 */
function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Table de mapping explicite des variantes connues vers leur groupe normalisé et sous-région
 */
const EXACT_MAPPINGS: Record<string, { muscle: MuscleGroup; subRegion?: string }> = {
  // Pectoraux
  'pectoraux': { muscle: 'Pectoraux' },
  'pectoral': { muscle: 'Pectoraux' },
  'pecs': { muscle: 'Pectoraux' },
  'pec': { muscle: 'Pectoraux' },
  'pectoraux (global)': { muscle: 'Pectoraux' },
  'pectoraux (median)': { muscle: 'Pectoraux', subRegion: 'Médian' },
  'pectoraux (haut & median)': { muscle: 'Pectoraux', subRegion: 'Haut & Médian' },
  'pectoraux (bas)': { muscle: 'Pectoraux', subRegion: 'Bas' },
  'pectoraux (chef claviculaire - haut)': { muscle: 'Pectoraux', subRegion: 'Haut' },
  'pectoraux (chef claviculaire)': { muscle: 'Pectoraux', subRegion: 'Haut' },
  'pectoraux (chef sterno-costal - median)': { muscle: 'Pectoraux', subRegion: 'Médian' },
  'pectoraux (chef sterno-costal)': { muscle: 'Pectoraux', subRegion: 'Médian' },
  'pectoraux (chef abdominal - bas)': { muscle: 'Pectoraux', subRegion: 'Bas' },
  'pectoraux (chef abdominal)': { muscle: 'Pectoraux', subRegion: 'Bas' },
  'grand pectoral (haut)': { muscle: 'Pectoraux', subRegion: 'Haut' },
  'grand pectoral': { muscle: 'Pectoraux' },
  'dentele anterieur': { muscle: 'Pectoraux', subRegion: 'Dentelé antérieur' },

  // Dos
  'grand dorsal': { muscle: 'Grand Dorsal' },
  'dorsaux': { muscle: 'Grand Dorsal' },
  'dorsal': { muscle: 'Grand Dorsal' },
  'lats': { muscle: 'Grand Dorsal' },
  'latissimus dorsi': { muscle: 'Grand Dorsal' },
  'trapezes': { muscle: 'Trapèzes' },
  'trapeze': { muscle: 'Trapèzes' },
  'trapezes superieurs': { muscle: 'Trapèzes', subRegion: 'Supérieurs' },
  'trapezes (superieurs)': { muscle: 'Trapèzes', subRegion: 'Supérieurs' },
  'trapezes (moyens)': { muscle: 'Trapèzes', subRegion: 'Moyens' },
  'trapezes (inferieurs)': { muscle: 'Trapèzes', subRegion: 'Inférieurs' },
  'elevateur de la scapula': { muscle: 'Trapèzes', subRegion: 'Élévateur de la scapula' },
  'rhomboïdes': { muscle: 'Rhomboïdes' },
  'rhomboides': { muscle: 'Rhomboïdes' },
  'rhomboide': { muscle: 'Rhomboïdes' },
  'grand rond': { muscle: 'Grand Rond' },
  'lombaires': { muscle: 'Lombaires' },
  'lombaire': { muscle: 'Lombaires' },
  'lombaires (erecteurs du rachis)': { muscle: 'Lombaires', subRegion: 'Érecteurs du rachis' },
  'erecteurs du rachis': { muscle: 'Lombaires', subRegion: 'Érecteurs du rachis' },

  // Épaules
  'deltoide anterieur': { muscle: 'Deltoïde Antérieur' },
  'deltoides anterieurs': { muscle: 'Deltoïde Antérieur' },
  'deltoide avant': { muscle: 'Deltoïde Antérieur' },
  'deltoide lateral': { muscle: 'Deltoïde Latéral' },
  'deltoide lateral (epaules)': { muscle: 'Deltoïde Latéral' },
  'deltoides lateraux': { muscle: 'Deltoïde Latéral' },
  'deltoide posterieur': { muscle: 'Deltoïde Postérieur' },
  'deltoides posterieurs': { muscle: 'Deltoïde Postérieur' },
  'deltoide arriere': { muscle: 'Deltoïde Postérieur' },
  'arriere d epaule': { muscle: 'Deltoïde Postérieur' },
  'epaules': { muscle: 'Deltoïde Latéral' },
  'epaule': { muscle: 'Deltoïde Latéral' },
  'coiffe des rotateurs': { muscle: 'Deltoïde Postérieur', subRegion: 'Coiffe des rotateurs' },

  // Bras
  'biceps': { muscle: 'Biceps' },
  'biceps (chef court)': { muscle: 'Biceps', subRegion: 'Chef court' },
  'biceps (chef long)': { muscle: 'Biceps', subRegion: 'Chef long' },
  'brachial': { muscle: 'Biceps', subRegion: 'Brachial' },
  'brachial anterieur': { muscle: 'Biceps', subRegion: 'Brachial' },
  'triceps': { muscle: 'Triceps' },
  'triceps (chef long)': { muscle: 'Triceps', subRegion: 'Chef long' },
  'triceps (chef lateral)': { muscle: 'Triceps', subRegion: 'Chef latéral' },
  'triceps (chef medial)': { muscle: 'Triceps', subRegion: 'Chef médial' },
  'triceps (chef lateral et medial)': { muscle: 'Triceps', subRegion: 'Chef latéral et médial' },
  'triceps (global)': { muscle: 'Triceps' },
  'avant-bras': { muscle: 'Avant-bras' },
  'avant bras': { muscle: 'Avant-bras' },
  'avant-bras (flechisseurs)': { muscle: 'Avant-bras', subRegion: 'Fléchisseurs' },
  'avant-bras (extenseurs)': { muscle: 'Avant-bras', subRegion: 'Extenseurs' },
  'brachioradial': { muscle: 'Avant-bras', subRegion: 'Brachioradial' },

  // Jambes
  'quadriceps': { muscle: 'Quadriceps' },
  'quadriceps (droit femoral & vastes)': { muscle: 'Quadriceps', subRegion: 'Droit fémoral & Vastes' },
  'quadriceps (droit femoral)': { muscle: 'Quadriceps', subRegion: 'Droit fémoral' },
  'quadriceps (vastes)': { muscle: 'Quadriceps', subRegion: 'Vastes' },
  'ischio-jambiers': { muscle: 'Ischio-Jambiers' },
  'ischio jambiers': { muscle: 'Ischio-Jambiers' },
  'ischios': { muscle: 'Ischio-Jambiers' },
  'ischio': { muscle: 'Ischio-Jambiers' },
  'grand fessier': { muscle: 'Grand Fessier' },
  'fessiers': { muscle: 'Grand Fessier' },
  'fessier': { muscle: 'Grand Fessier' },
  'glutes': { muscle: 'Grand Fessier' },
  'moyen fessier': { muscle: 'Grand Fessier', subRegion: 'Moyen Fessier' },
  'abducteurs': { muscle: 'Grand Fessier', subRegion: 'Abducteurs' },
  'adducteurs': { muscle: 'Adducteurs' },
  'adducteur': { muscle: 'Adducteurs' },
  'mollets (gastrocnemiens)': { muscle: 'Mollets (Gastrocnémiens)' },
  'mollets (gastrocnemien)': { muscle: 'Mollets (Gastrocnémiens)' },
  'gastrocnemiens': { muscle: 'Mollets (Gastrocnémiens)' },
  'mollets': { muscle: 'Mollets (Gastrocnémiens)' },
  'mollet': { muscle: 'Mollets (Gastrocnémiens)' },
  'mollets (soleaire)': { muscle: 'Mollets (Soléaire)' },
  'mollets (soleaires)': { muscle: 'Mollets (Soléaire)' },
  'soleaire': { muscle: 'Mollets (Soléaire)' },
  'tibial anterieur': { muscle: 'Mollets (Soléaire)', subRegion: 'Tibial antérieur' },
  'cuisses': { muscle: 'Quadriceps', subRegion: 'Cuisses' },
  'cuisse': { muscle: 'Quadriceps', subRegion: 'Cuisses' },
  'jambes': { muscle: 'Quadriceps' },
  'jambe': { muscle: 'Quadriceps' },

  // Tronco / Abdos
  'abdominaux': { muscle: 'Abdominaux' },
  'abdos': { muscle: 'Abdominaux' },
  'grand droit': { muscle: 'Abdominaux' },
  'grand droit (partie haute)': { muscle: 'Abdominaux', subRegion: 'Partie haute' },
  'grand droit (partie basse)': { muscle: 'Abdominaux', subRegion: 'Partie basse' },
  'transverse': { muscle: 'Abdominaux', subRegion: 'Transverse' },
  'transverse / gainage': { muscle: 'Abdominaux', subRegion: 'Gainage' },
  'gainage': { muscle: 'Abdominaux', subRegion: 'Gainage' },
  'flechisseurs de hanche': { muscle: 'Abdominaux', subRegion: 'Fléchisseurs de hanche' },
  'flechisseurs de la hanche': { muscle: 'Abdominaux', subRegion: 'Fléchisseurs de hanche' },
  'flechisseurs': { muscle: 'Abdominaux', subRegion: 'Fléchisseurs de hanche' },
  'sangle abdominale': { muscle: 'Abdominaux' },
  'obliques': { muscle: 'Obliques' },
  'oblique': { muscle: 'Obliques' },
};

/**
 * Normalise n'importe quelle variante textuelle libre vers le groupe musculaire normé
 * avec sous-région optionnelle et fallback best-effort.
 */
export function normalizeMuscle(raw: string): { muscle: MuscleGroup; subRegion?: string } {
  if (!raw || typeof raw !== 'string') {
    return { muscle: 'Pectoraux' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { muscle: 'Pectoraux' };
  }

  // 1. Vérification si correspond déjà exactement à un des MUSCLE_GROUPS
  const exactMatch = MUSCLE_GROUPS.find((mg) => mg.toLowerCase() === trimmed.toLowerCase());
  if (exactMatch) {
    return { muscle: exactMatch };
  }

  const cleaned = cleanString(trimmed);

  // 2. Recherche directe dans la table de correspondance explicite
  if (EXACT_MAPPINGS[cleaned]) {
    return { ...EXACT_MAPPINGS[cleaned] };
  }

  // 3. Extraction générique d'une sous-région entre parenthèses : "Muscle (Sous-région)"
  const parenMatch = trimmed.match(/^([^()]+)\s*\(([^()]+)\)$/);
  if (parenMatch) {
    const mainPart = parenMatch[1].trim();
    const subPart = parenMatch[2].trim();
    const cleanedMain = cleanString(mainPart);

    if (EXACT_MAPPINGS[cleanedMain]) {
      const mapped = EXACT_MAPPINGS[cleanedMain];
      // On ignore les sous-parties comme "(Épaules)" ou "(Global)" qui ne sont pas de vraies sous-régions
      const isInformationalOnly = /^(epaules|global)$/i.test(cleanString(subPart));
      return {
        muscle: mapped.muscle,
        subRegion: isInformationalOnly ? mapped.subRegion : (mapped.subRegion || subPart),
      };
    }
  }

  // 4. Fallback heuristique par mots-clés
  let resolved: { muscle: MuscleGroup; subRegion?: string } | null = null;

  if (cleaned.includes('gainag') || cleaned.includes('transvers') || cleaned.includes('flechisseur')) {
    resolved = { muscle: 'Abdominaux' };
  } else if (cleaned.includes('ischio') || cleaned.includes('hamstring')) {
    resolved = { muscle: 'Ischio-Jambiers' };
  } else if (cleaned.includes('cuisse') || cleaned.includes('jambe')) {
    resolved = { muscle: 'Quadriceps' };
  } else if (cleaned.includes('pec')) {
    resolved = { muscle: 'Pectoraux' };
  } else if (cleaned.includes('dorsal') || cleaned.includes('latissimus') || cleaned.includes('dos')) {
    resolved = { muscle: 'Grand Dorsal' };
  } else if (cleaned.includes('trapez')) {
    resolved = { muscle: 'Trapèzes' };
  } else if (cleaned.includes('rhomboid')) {
    resolved = { muscle: 'Rhomboïdes' };
  } else if (cleaned.includes('rond')) {
    resolved = { muscle: 'Grand Rond' };
  } else if (cleaned.includes('delto')) {
    if (cleaned.includes('ant')) {
      resolved = { muscle: 'Deltoïde Antérieur' };
    } else if (cleaned.includes('post') || cleaned.includes('arrier')) {
      resolved = { muscle: 'Deltoïde Postérieur' };
    } else {
      resolved = { muscle: 'Deltoïde Latéral' };
    }
  } else if (cleaned.includes('epaule')) {
    resolved = { muscle: 'Deltoïde Latéral' };
  } else if (cleaned.includes('bicep')) {
    resolved = { muscle: 'Biceps' };
  } else if (cleaned.includes('tricep')) {
    resolved = { muscle: 'Triceps' };
  } else if (cleaned.includes('avant') || cleaned.includes('bras') || cleaned.includes('radial')) {
    resolved = { muscle: 'Avant-bras' };
  } else if (cleaned.includes('quadri') || cleaned.includes('femoral')) {
    resolved = { muscle: 'Quadriceps' };
  } else if (cleaned.includes('fessier') || cleaned.includes('glute')) {
    resolved = { muscle: 'Grand Fessier' };
  } else if (cleaned.includes('adduct')) {
    resolved = { muscle: 'Adducteurs' };
  } else if (cleaned.includes('soleaire') || cleaned.includes('soléaire')) {
    resolved = { muscle: 'Mollets (Soléaire)' };
  } else if (cleaned.includes('mollet') || cleaned.includes('gastroc')) {
    resolved = { muscle: 'Mollets (Gastrocnémiens)' };
  } else if (cleaned.includes('lomb') || cleaned.includes('rachis')) {
    resolved = { muscle: 'Lombaires' };
  } else if (cleaned.includes('oblique')) {
    resolved = { muscle: 'Obliques' };
  } else if (cleaned.includes('abdo') || cleaned.includes('droit') || cleaned.includes('ventre') || cleaned.includes('core')) {
    resolved = { muscle: 'Abdominaux' };
  }

  if (resolved) {
    return resolved;
  }

  // 5. Fallback ultime neutre sans avertissement console
  if (cleaned.includes('dos') || cleaned.includes('back')) {
    return { muscle: 'Grand Dorsal' };
  }
  return { muscle: 'Pectoraux' };
}

/**
 * Convertit un muscle (brut ou déjà objet) en MuscleTarget standardisé
 */
export function toMuscleTarget(
  target: string | MuscleTarget,
  role: 'primary' | 'secondary' = 'primary',
  fraction?: number
): MuscleTarget {
  if (typeof target === 'object' && target !== null && 'muscle' in target) {
    const norm = normalizeMuscle(target.muscle);
    return {
      muscle: norm.muscle,
      subRegion: target.subRegion || norm.subRegion,
      role: target.role || role,
      fraction: target.fraction ?? (target.role === 'secondary' || role === 'secondary' ? 0.5 : 1.0),
    };
  }

  const { muscle, subRegion } = normalizeMuscle(String(target));
  return {
    muscle,
    subRegion,
    role,
    fraction: fraction ?? (role === 'primary' ? 1.0 : 0.5),
  };
}
