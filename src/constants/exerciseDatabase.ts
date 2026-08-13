export interface SharedExercise {
  id: string;
  name: string;
  primaryMuscle: string;
  targetMuscles: string[];
  defaultRestSeconds: number;
  category: 'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos';
}

export const EXERCISE_DATABASE: SharedExercise[] = [
  // ---------------- PECTORAUX (9) ----------------
  { id: 'bench_press', name: 'Développé Couché Barre', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux (Médian)', 'Triceps', 'Deltoïde antérieur'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'incline_bench_press', name: 'Développé Incliné Barre', primaryMuscle: 'Pectoraux (Haut)', targetMuscles: ['Pectoraux (Haut)', 'Deltoïde antérieur', 'Triceps'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'incline_dumbbells', name: 'Développé Incliné Haltères', primaryMuscle: 'Pectoraux (Haut)', targetMuscles: ['Pectoraux (Haut)', 'Épaules', 'Triceps'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'decline_bench_press', name: 'Développé Décliné Barre', primaryMuscle: 'Pectoraux (Bas)', targetMuscles: ['Pectoraux (Bas)', 'Triceps'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'dips', name: 'Dips (Pectoraux & Triceps)', primaryMuscle: 'Pectoraux & Triceps', targetMuscles: ['Pectoraux (Bas)', 'Triceps', 'Deltoïde antérieur'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'low_cable_fly', name: 'Low Cable Fly (Poulie Basse)', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux (Haut & Médian)'], defaultRestSeconds: 75, category: 'Pectoraux' },
  { id: 'high_cable_fly', name: 'High Cable Fly (Poulie Haute)', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux (Bas & Médian)'], defaultRestSeconds: 75, category: 'Pectoraux' },
  { id: 'pec_deck', name: 'Pec Deck / Écarté Machine', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux (Médian)'], defaultRestSeconds: 75, category: 'Pectoraux' },
  { id: 'pushups', name: 'Pompes (Push-ups)', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux', 'Triceps', 'Gainage'], defaultRestSeconds: 60, category: 'Pectoraux' },

  // ---------------- DOS (10) ----------------
  { id: 'pullups', name: 'Tractions Prise Pronation', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Grand Rond', 'Biceps'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'chinups', name: 'Tractions Prise Supination', primaryMuscle: 'Grand Dorsal & Biceps', targetMuscles: ['Grand Dorsal', 'Biceps brachial'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'lat_pulldown', name: 'Tirage Vertical Poulie Haute', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Grand Rond', 'Biceps'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'tirage_vertical_neutre', name: 'Tirage Vertical Prise Neutre', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Grand Rond'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'barbell_row', name: 'Rowing Barre Penché', primaryMuscle: 'Dos & Trapèzes', targetMuscles: ['Grand Dorsal', 'Trapèzes', 'Rhomboïdes', 'Lombaires'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'dumbbell_row', name: 'Rowing Unilatéral Haltère', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Trapèzes moyens', 'Biceps'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'tirage_horiz_unilat', name: 'Tirage Horizontal Unilatéral', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Trapèzes moyens', 'Biceps'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 't_bar_row', name: 'Rowing T-Bar', primaryMuscle: 'Épaisseur du Dos', targetMuscles: ['Trapèzes', 'Rhomboïdes', 'Grand Dorsal'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'rowing_planche', name: 'Rowing Planche / Chest-Supported', primaryMuscle: 'Dos & Gainage', targetMuscles: ['Trapèzes', 'Grand Dorsal', 'Lombaires'], defaultRestSeconds: 75, category: 'Dos' },
  { id: 'deadlift', name: 'Soulevé de Terre (Deadlift)', primaryMuscle: 'Chaîne Postérieure', targetMuscles: ['Lombaires', 'Fessiers', 'Ischio-jambiers', 'Trapèzes'], defaultRestSeconds: 120, category: 'Dos' },

  // ---------------- ÉPAULES (8) ----------------
  { id: 'overhead_press', name: 'Développé Militaire Barre (OHP)', primaryMuscle: 'Deltoïde Antérieur', targetMuscles: ['Deltoïde antérieur', 'Deltoïde latéral', 'Triceps'], defaultRestSeconds: 90, category: 'Épaules' },
  { id: 'dumbbell_shoulder_press', name: 'Développé Épaules Haltères', primaryMuscle: 'Deltoïde Antérieur', targetMuscles: ['Deltoïde antérieur', 'Deltoïde latéral'], defaultRestSeconds: 90, category: 'Épaules' },
  { id: 'elevations_lat_poulie', name: 'Élévations Latérales Poulie', primaryMuscle: 'Deltoïde Latéral', targetMuscles: ['Deltoïde latéral'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'dumbbell_lateral_raise', name: 'Élévations Latérales Haltères', primaryMuscle: 'Deltoïde Latéral', targetMuscles: ['Deltoïde latéral'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'front_raise', name: 'Élévations Frontales Haltères', primaryMuscle: 'Deltoïde Antérieur', targetMuscles: ['Deltoïde antérieur'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'oiseau_poulie_unilat', name: 'Oiseau à la Poulie Unilatéral', primaryMuscle: 'Deltoïde Postérieur', targetMuscles: ['Deltoïde postérieur', 'Rhomboïdes'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'face_pull', name: 'Face Pull Poulie', primaryMuscle: 'Deltoïde Postérieur', targetMuscles: ['Deltoïde postérieur', 'Rotateurs', 'Trapèzes'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'shrugs', name: 'Shrugs Haltères / Barre', primaryMuscle: 'Trapèzes Supérieurs', targetMuscles: ['Trapèzes supérieurs'], defaultRestSeconds: 60, category: 'Épaules' },

  // ---------------- BRAS (10) ----------------
  { id: 'barbell_curl', name: 'Curl Barre EZ', primaryMuscle: 'Biceps', targetMuscles: ['Biceps brachial', 'Brachial antérieur'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'dumbbell_curl', name: 'Curl Haltères Supination', primaryMuscle: 'Biceps', targetMuscles: ['Biceps brachial'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'hammer_curl', name: 'Curl Marteau (Hammer Curl)', primaryMuscle: 'Brachioradial & Biceps', targetMuscles: ['Brachioradial', 'Brachial antérieur'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'curl_pupitre_halteres', name: 'Curl Pupitre Haltères', primaryMuscle: 'Biceps', targetMuscles: ['Biceps brachial', 'Brachial'], defaultRestSeconds: 90, category: 'Bras' },
  { id: 'incline_dumbbell_curl', name: 'Curl Incliné Haltères', primaryMuscle: 'Biceps (Chef long)', targetMuscles: ['Biceps chef long'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'triceps_pushdown', name: 'Extension Triceps Poulie Haute', primaryMuscle: 'Triceps', targetMuscles: ['Triceps (Chef latéral et médial)'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'overhead_triceps', name: 'Overhead Extension Triceps Poulie', primaryMuscle: 'Triceps (Chef long)', targetMuscles: ['Triceps (Chef long)'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'skullcrusher', name: 'Barre au Front (Skullcrusher)', primaryMuscle: 'Triceps', targetMuscles: ['Triceps (Chef long et médial)'], defaultRestSeconds: 90, category: 'Bras' },
  { id: 'close_grip_bench_press', name: 'Développé Couché Prise Serrée', primaryMuscle: 'Triceps', targetMuscles: ['Triceps', 'Pectoraux', 'Épaules'], defaultRestSeconds: 90, category: 'Bras' },
  { id: 'triceps_kickback', name: 'Kickback Triceps Haltère', primaryMuscle: 'Triceps', targetMuscles: ['Triceps (Chef latéral)'], defaultRestSeconds: 60, category: 'Bras' },

  // ---------------- JAMBES (9) ----------------
  { id: 'squat', name: 'Squat Barre Arrière (Back Squat)', primaryMuscle: 'Quadriceps & Fessiers', targetMuscles: ['Quadriceps', 'Grand fessier', 'Adducteurs'], defaultRestSeconds: 120, category: 'Jambes' },
  { id: 'front_squat', name: 'Squat Barre Avant (Front Squat)', primaryMuscle: 'Quadriceps', targetMuscles: ['Quadriceps', 'Sangle abdominale'], defaultRestSeconds: 120, category: 'Jambes' },
  { id: 'leg_press', name: 'Presse à Cuisses', primaryMuscle: 'Quadriceps & Fessiers', targetMuscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'], defaultRestSeconds: 90, category: 'Jambes' },
  { id: 'romanian_deadlift', name: 'Soulevé de Terre Roumain (RDL)', primaryMuscle: 'Ischio-jambiers & Fessiers', targetMuscles: ['Ischio-jambiers', 'Grand fessier', 'Lombaires'], defaultRestSeconds: 90, category: 'Jambes' },
  { id: 'bulgarian_split_squat', name: 'Fentes Bulgares Haltères', primaryMuscle: 'Quadriceps & Fessiers', targetMuscles: ['Quadriceps', 'Grand fessier', 'Ischio-jambiers'], defaultRestSeconds: 90, category: 'Jambes' },
  { id: 'lunges', name: 'Fentes Marchées Haltères', primaryMuscle: 'Quadriceps & Fessiers', targetMuscles: ['Quadriceps', 'Fessiers'], defaultRestSeconds: 90, category: 'Jambes' },
  { id: 'leg_extension', name: 'Leg Extension Machine', primaryMuscle: 'Quadriceps', targetMuscles: ['Quadriceps (Droit fémoral & Vastes)'], defaultRestSeconds: 75, category: 'Jambes' },
  { id: 'leg_curl', name: 'Leg Curl Allongé / Assis', primaryMuscle: 'Ischio-jambiers', targetMuscles: ['Ischio-jambiers'], defaultRestSeconds: 75, category: 'Jambes' },
  { id: 'calf_raises', name: 'Mollets Debout à la Machine', primaryMuscle: 'Mollets', targetMuscles: ['Gastrocnémiens', 'Soléaire'], defaultRestSeconds: 60, category: 'Jambes' },

  // ---------------- ABDOS (6) ----------------
  { id: 'crunch', name: 'Crunch', primaryMuscle: 'Grand droit de l\'abdomen', targetMuscles: ['Grand droit'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'crunch_inverse', name: 'Crunch Inversé', primaryMuscle: 'Grand droit (Bas)', targetMuscles: ['Bas des abdos'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'foot_to_foot', name: 'Foot to Foot', primaryMuscle: 'Obliques', targetMuscles: ['Obliques'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'releve_jambes_bassin', name: 'Relevé de Jambes et de Bassin', primaryMuscle: 'Bas des abdos', targetMuscles: ['Bas des abdos', 'Fléchisseurs'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'releve_genoux_suspendu', name: 'Relevé de Genoux Suspendu', primaryMuscle: 'Bas des abdos', targetMuscles: ['Abdos bas'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'planche_statique', name: 'Planche Statique', primaryMuscle: 'Transverse / Gainage', targetMuscles: ['Transverse', 'Lombaires'], defaultRestSeconds: 105, category: 'Abdos' },
];

