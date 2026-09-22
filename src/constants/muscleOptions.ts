export const MUSCLE_OPTIONS_PER_CATEGORY: Record<
  'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos',
  { primary: string[]; secondary: string[] }
> = {
  Pectoraux: {
    primary: [
      'Pectoraux (Chef claviculaire - Haut)',
      'Pectoraux (Chef sterno-costal - Médian)',
      'Pectoraux (Chef abdominal - Bas)',
      'Pectoraux (Global)',
    ],
    secondary: [
      'Triceps (Chef latéral)',
      'Triceps (Chef médial)',
      'Triceps (Chef long)',
      'Deltoïde antérieur',
      'Dentelé antérieur',
    ],
  },
  Dos: {
    primary: [
      'Grand Dorsal',
      'Trapèzes (Moyens)',
      'Trapèzes (Inférieurs)',
      'Trapèzes (Supérieurs)',
      'Rhomboïdes',
      'Grand Rond',
      'Lombaires (Érecteurs du rachis)',
    ],
    secondary: [
      'Biceps (Chef court)',
      'Biceps (Chef long)',
      'Brachial',
      'Deltoïde postérieur',
      'Avant-bras',
    ],
  },
  Épaules: {
    primary: [
      'Deltoïde Antérieur',
      'Deltoïde Latéral',
      'Deltoïde Postérieur',
      'Trapèzes Supérieurs',
      'Coiffe des rotateurs',
    ],
    secondary: [
      'Triceps (Chef latéral)',
      'Trapèzes (Moyens)',
      'Dentelé antérieur',
      'Grand pectoral (Haut)',
    ],
  },
  Bras: {
    primary: [
      'Biceps (Chef court)',
      'Biceps (Chef long)',
      'Brachial',
      'Brachioradial',
      'Triceps (Chef long)',
      'Triceps (Chef latéral)',
      'Triceps (Chef médial)',
      'Triceps (Global)',
    ],
    secondary: [
      'Avant-bras (Fléchisseurs)',
      'Avant-bras (Extenseurs)',
      'Deltoïde antérieur',
    ],
  },
  Jambes: {
    primary: [
      'Quadriceps',
      'Ischio-jambiers',
      'Grand Fessier',
      'Moyen Fessier',
      'Adducteurs',
      'Mollets (Gastrocnémiens)',
      'Mollets (Soléaire)',
      'Tibial antérieur',
    ],
    secondary: [
      'Lombaires (Érecteurs du rachis)',
      'Sangle abdominale',
      'Abducteurs',
    ],
  },
  Abdos: {
    primary: [
      'Grand Droit (Partie haute)',
      'Grand Droit (Partie basse)',
      'Grand Droit',
      'Obliques',
      'Transverse',
    ],
    secondary: [
      'Lombaires (Érecteurs du rachis)',
      'Fléchisseurs de la hanche',
      'Dentelé antérieur',
    ],
  },
};

