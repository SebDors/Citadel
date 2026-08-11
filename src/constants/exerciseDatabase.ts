export interface SharedExercise {
  id: string;
  name: string;
  primaryMuscle: string;
  targetMuscles: string[];
  defaultRestSeconds: number;
  category: 'Pectoraux' | 'Dos' | 'Épaules' | 'Bras' | 'Jambes' | 'Abdos';
}

export const EXERCISE_DATABASE: SharedExercise[] = [
  // Pectoraux
  { id: 'dips', name: 'Dips', primaryMuscle: 'Pectoraux & Triceps', targetMuscles: ['Pectoraux (Bas)', 'Triceps', 'Deltoïde antérieur'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'low_cable_fly', name: 'Low Cable Fly', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux (Haut & Médian)'], defaultRestSeconds: 75, category: 'Pectoraux' },
  { id: 'bench_press', name: 'Développé Couché Haltères', primaryMuscle: 'Pectoraux', targetMuscles: ['Pectoraux', 'Triceps', 'Deltoïde antérieur'], defaultRestSeconds: 90, category: 'Pectoraux' },
  { id: 'incline_dumbbells', name: 'Développé Incliné Haltères', primaryMuscle: 'Pectoraux (Haut)', targetMuscles: ['Pectoraux (Haut)', 'Épaules'], defaultRestSeconds: 90, category: 'Pectoraux' },

  // Dos
  { id: 'tirage_horiz_unilat', name: 'Tirage Horizontal Unilatéral', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Trapèzes moyens', 'Biceps'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'tirage_vertical_neutre', name: 'Tirage Vertical Prise Neutre', primaryMuscle: 'Grand Dorsal', targetMuscles: ['Grand Dorsal', 'Grand Rond'], defaultRestSeconds: 90, category: 'Dos' },
  { id: 'rowing_planche', name: 'Rowing Planche', primaryMuscle: 'Dos & Gainage', targetMuscles: ['Trapèzes', 'Grand Dorsal', 'Lombaires'], defaultRestSeconds: 75, category: 'Dos' },

  // Épaules
  { id: 'oiseau_poulie_unilat', name: 'Oiseau à la Poulie Unilatéral', primaryMuscle: 'Deltoïde Postérieur', targetMuscles: ['Deltoïde postérieur', 'Rhomboïdes'], defaultRestSeconds: 60, category: 'Épaules' },
  { id: 'elevations_lat_poulie', name: 'Élévations Latérales Poulie', primaryMuscle: 'Deltoïde Latéral', targetMuscles: ['Deltoïde latéral'], defaultRestSeconds: 60, category: 'Épaules' },

  // Bras
  { id: 'overhead_triceps', name: 'Overhead Extension Triceps', primaryMuscle: 'Triceps (Chef long)', targetMuscles: ['Triceps (Chef long)'], defaultRestSeconds: 75, category: 'Bras' },
  { id: 'curl_pupitre_halteres', name: 'Curl Pupitre Haltères', primaryMuscle: 'Biceps', targetMuscles: ['Biceps brachial', 'Brachial'], defaultRestSeconds: 90, category: 'Bras' },

  // Abdos / Circuit
  { id: 'crunch', name: 'Crunch', primaryMuscle: 'Grand droit de l\'abdomen', targetMuscles: ['Grand droit'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'crunch_inverse', name: 'Crunch Inversé', primaryMuscle: 'Grand droit (Bas)', targetMuscles: ['Bas des abdos'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'foot_to_foot', name: 'Foot to Foot', primaryMuscle: 'Obliques', targetMuscles: ['Obliques'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'releve_jambes_bassin', name: 'Relevé de Jambes et de Bassin', primaryMuscle: 'Bas des abdos', targetMuscles: ['Bas des abdos', 'Fléchisseurs'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'releve_genoux_suspendu', name: 'Relevé de Genoux Suspendu', primaryMuscle: 'Bas des abdos', targetMuscles: ['Abdos bas'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'russian_twist', name: 'Russian Twist', primaryMuscle: 'Obliques & Sangle', targetMuscles: ['Obliques', 'Sangle abdominale'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'planche_lat_dyn', name: 'Planches Latérales Dynamiques', primaryMuscle: 'Obliques', targetMuscles: ['Obliques', 'Gainage'], defaultRestSeconds: 0, category: 'Abdos' },
  { id: 'planche_statique', name: 'Planche Statique', primaryMuscle: 'Transverse / Gainage', targetMuscles: ['Transverse', 'Lombaires'], defaultRestSeconds: 105, category: 'Abdos' },
  { id: 'gainage_commando', name: 'Gainage Commando', primaryMuscle: 'Gainage Dynamique', targetMuscles: ['Transverse', 'Triceps'], defaultRestSeconds: 0, category: 'Abdos' },
];
