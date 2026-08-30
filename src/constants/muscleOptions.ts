export const MUSCLE_OPTIONS_PER_CATEGORY: Record<
  'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos',
  { primary: string[]; secondary: string[] }
> = {
  Pectoraux: {
    primary: ['Pectoraux', 'Pectoraux (Haut)', 'Pectoraux (Bas)', 'Pectoraux (Médian)', 'Pectoraux & Triceps'],
    secondary: ['Pectoraux (Haut)', 'Pectoraux (Médian)', 'Pectoraux (Bas)', 'Triceps', 'Deltoïde antérieur', 'Gainage'],
  },
  Dos: {
    primary: ['Grand Dorsal', 'Grand Dorsal & Biceps', 'Dos & Trapèzes', 'Épaisseur du Dos', 'Dos & Gainage', 'Chaîne Postérieure'],
    secondary: ['Grand Dorsal', 'Grand Rond', 'Biceps', 'Biceps brachial', 'Trapèzes', 'Trapèzes moyens', 'Rhomboïdes', 'Lombaires', 'Fessiers', 'Ischio-jambiers'],
  },
  Épaules: {
    primary: ['Deltoïde Antérieur', 'Deltoïde Latéral', 'Deltoïde Postérieur', 'Trapèzes Supérieurs'],
    secondary: ['Deltoïde antérieur', 'Deltoïde latéral', 'Deltoïde postérieur', 'Rhomboïdes', 'Rotateurs', 'Trapèzes', 'Trapèzes supérieurs', 'Triceps'],
  },
  Bras: {
    primary: ['Biceps', 'Biceps (Chef long)', 'Brachioradial & Biceps', 'Triceps', 'Triceps (Chef long)'],
    secondary: ['Biceps brachial', 'Brachial antérieur', 'Brachioradial', 'Biceps chef long', 'Triceps (Chef latéral et médial)', 'Triceps (Chef long)', 'Triceps (Chef latéral)', 'Pectoraux', 'Épaules'],
  },
  Jambes: {
    primary: ['Quadriceps', 'Quadriceps & Fessiers', 'Ischio-jambiers', 'Ischio-jambiers & Fessiers', 'Mollets'],
    secondary: ['Quadriceps', 'Grand fessier', 'Fessiers', 'Adducteurs', 'Ischio-jambiers', 'Lombaires', 'Gastrocnémiens', 'Soléaire', 'Sangle abdominale'],
  },
  Abdos: {
    primary: ["Grand droit de l'abdomen", 'Grand droit (Bas)', 'Obliques', 'Bas des abdos', 'Transverse / Gainage'],
    secondary: ['Grand droit', 'Bas des abdos', 'Obliques', 'Fléchisseurs', 'Transverse', 'Lombaires'],
  },
};
