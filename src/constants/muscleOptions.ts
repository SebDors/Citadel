export const MUSCLE_OPTIONS_PER_CATEGORY: Record<
  'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos',
  { primary: string[]; secondary: string[] }
> = {
  Pectoraux: {
    primary: ['Pectoraux', 'Pectoraux (Haut)', 'Pectoraux (Bas)', 'Pectoraux (Médian)', 'Pectoraux & Triceps', 'Pectoraux & Grand Dorsal'],
    secondary: ['Pectoraux (Haut)', 'Pectoraux (Médian)', 'Pectoraux (Bas)', 'Triceps', 'Deltoïde antérieur', 'Gainage', 'Grand Dorsal'],
  },
  Dos: {
    primary: ['Grand Dorsal', 'Grand Dorsal & Biceps', 'Dos & Trapèzes', 'Épaisseur du Dos', 'Dos & Gainage', 'Chaîne Postérieure', 'Dos & Lombaires', 'Lombaires & Fessiers'],
    secondary: ['Grand Dorsal', 'Grand Rond', 'Biceps', 'Biceps brachial', 'Trapèzes', 'Trapèzes moyens', 'Rhomboïdes', 'Lombaires', 'Fessiers', 'Grand fessier', 'Ischio-jambiers'],
  },
  Épaules: {
    primary: ['Deltoïde Antérieur', 'Deltoïde Latéral', 'Deltoïde Postérieur', 'Trapèzes Supérieurs', 'Deltoïde Antérieur & Latéral', 'Deltoïde Latéral & Trapèzes'],
    secondary: ['Deltoïde antérieur', 'Deltoïde latéral', 'Deltoïde postérieur', 'Rhomboïdes', 'Rotateurs', 'Trapèzes', 'Trapèzes supérieurs', 'Triceps'],
  },
  Bras: {
    primary: ['Biceps', 'Biceps (Chef long)', 'Brachioradial & Biceps', 'Triceps', 'Triceps (Chef long)'],
    secondary: ['Biceps brachial', 'Brachial antérieur', 'Brachioradial', 'Biceps chef long', 'Triceps (Chef latéral et médial)', 'Triceps (Chef long)', 'Triceps (Chef latéral)', 'Pectoraux', 'Épaules', 'Deltoïde antérieur'],
  },
  Jambes: {
    primary: ['Quadriceps', 'Quadriceps & Fessiers', 'Ischio-jambiers', 'Ischio-jambiers & Fessiers', 'Adducteurs', 'Moyen Fessier', 'Grand Fessier', 'Mollets', 'Mollets (Soléaire)'],
    secondary: ['Quadriceps', 'Grand fessier', 'Moyen fessier', 'Fessiers', 'Adducteurs', 'Cuisses', 'Ischio-jambiers', 'Lombaires', 'Gastrocnémiens', 'Soléaire', 'Sangle abdominale', 'Gainage'],
  },
  Abdos: {
    primary: ["Grand droit de l'abdomen", 'Grand droit (Bas)', 'Obliques', 'Bas des abdos', 'Transverse / Gainage', 'Grand droit & Transverse', 'Sangle Abdominale'],
    secondary: ['Grand droit', 'Bas des abdos', 'Obliques', 'Fléchisseurs', 'Transverse', 'Lombaires', 'Gainage'],
  },
};
