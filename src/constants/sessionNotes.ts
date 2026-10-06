export type NoteType = 'performance' | 'douleur' | 'contexte' | 'technique' | 'autre';

export interface NoteTypeConfig {
  type: NoteType;
  label: string;
  color: string;
  description: string;
}

export const NOTE_TYPES_CONFIG: Record<NoteType, NoteTypeConfig> = {
  performance: {
    type: 'performance',
    label: 'Performance',
    color: '#10B981',
    description: 'Sensations de force, aisance, nouvelle charge',
  },
  douleur: {
    type: 'douleur',
    label: 'Douleur',
    color: '#EF4444',
    description: 'Tension articulaire, gêne musculaire ou douleur',
  },
  contexte: {
    type: 'contexte',
    label: 'Contexte',
    color: '#3B82F6',
    description: 'Manque de sommeil, échauffement écourté, fatigue générale',
  },
  technique: {
    type: 'technique',
    label: 'Technique',
    color: '#8B5CF6',
    description: 'Trajectoire, tempo, réglage machine, prise',
  },
  autre: {
    type: 'autre',
    label: 'Autre',
    color: '#64748B',
    description: 'Observation diverse',
  },
};

export const PAIN_SEVERITY_LEVELS: {
  level: 1 | 2 | 3;
  label: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
}[] = [
  {
    level: 1,
    label: 'Niveau 1 · Anecdotique',
    shortLabel: 'Niv. 1',
    description: 'Léger tiraillement sans gêne mécanique',
    badgeColor: '#F59E0B',
  },
  {
    level: 2,
    label: 'Niveau 2 · À surveiller',
    shortLabel: 'Niv. 2',
    description: 'Gêne limitant légèrement l\'effort',
    badgeColor: '#EA580C',
  },
  {
    level: 3,
    label: 'Niveau 3 · Important',
    shortLabel: 'Niv. 3',
    description: 'Douleur nette nécessitant arrêt ou adaptation',
    badgeColor: '#DC2626',
  },
];

export type SessionExceptionReason =
  | 'contrainte_materiel'
  | 'contrainte_partenaire'
  | 'voyage'
  | 'blessure_temporaire'
  | 'autre';

export interface ExceptionReasonConfig {
  reason: SessionExceptionReason;
  label: string;
  shortLabel: string;
  description: string;
}

export const EXCEPTION_REASONS_CONFIG: Record<SessionExceptionReason, ExceptionReasonConfig> = {
  contrainte_materiel: {
    reason: 'contrainte_materiel',
    label: 'Contrainte matériel',
    shortLabel: 'Matériel',
    description: 'Appareil indisponible, salle saturée, matériel alternatif',
  },
  contrainte_partenaire: {
    reason: 'contrainte_partenaire',
    label: 'Séance partagée / partenaire',
    shortLabel: 'Partenaire',
    description: 'Adaptation aux exercices ou charges d\'un partenaire',
  },
  voyage: {
    reason: 'voyage',
    label: 'Déplacement / voyage',
    shortLabel: 'Déplacement',
    description: 'Séance en hôtel, salle externe ou contexte nomade',
  },
  blessure_temporaire: {
    reason: 'blessure_temporaire',
    label: 'Gêne / blessure temporaire',
    shortLabel: 'Blessure',
    description: 'Adaptation passagère suite à une douleur ou fatigue',
  },
  autre: {
    reason: 'autre',
    label: 'Autre contrainte',
    shortLabel: 'Autre',
    description: 'Circonstance inhabituelle ponctuelle',
  },
};
