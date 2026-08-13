# PLAN_ARCHITECTURE.md : FIT-TRACKER (WARRIORFIT) - EXPO SDK 54

Ce document définit l'architecture technique, fonctionnelle et l'organisation du projet **WarriorFit** développé sous **Expo SDK 54**.

---

## 1. RÉSUMÉ DES RECHERCHES EPILOG (`epilog.fit`)

L'étude ergonomique effectuée par `@Subagent-Research` met en avant les principes clés d'Epilog :
- **Prise en main en direct** : Interface épurée permettant de saisir rapidement les performances en cours de séance.
- **Typage fin des séries** :
  - `Normale (N)` : Série de travail classique comptabilisée dans le volume.
  - `Échauffement (W)` : Séries préparatoires exclues du calcul des *hard sets*.
  - `Drop Set (D)` : Séries dégressives sans temps de repos.
  - `AMRAP (A)` : Reps maximales réalisables.
  - `Échec (F)` : Séries poussées jusqu'à l'échec mécanique.
- **RIR & RPE** : Intégration de la notion de *Reps In Reserve* (0 à 5+) sur chaque série.
- **Minuteurs de repos dynamiques** : Calcul du décompte basé sur horodatage cible (`targetTimestamp`), autorisant la mise en arrière-plan de l'application sans perte du chronomètre.
- **Supersets** : Groupement visuel (bordures et tags d'identification `A1`, `A2`) pour exécuter des enchaînements sans repos.
- **1RM Estimé & Volume** : Formule d'Epley ($1RM = Poids \times (1 + Reps / 30)$) pour estimer la charge maximale théorique.

---

## 2. CHARTE GRAPHIQUE (DARK & LIGHT THEMES)

### Dark Mode (Par défaut)
- **Accent principal / Validation** : `#9CB080`
- **Secondaire / Éléments actifs** : `#618764`
- **Surface des cartes & conteneurs** : `#2B5748`
- **Arrière-plan principal (Background)** : `#273338`

### Light Mode
- **Texte principal & Titres** : `#2E2910`
- **Cartes & Bordures** : `#2C5745`
- **Arrière-plan principal** : `#EBE3A7`
- **Accent / Boutons d'action** : `#EB7D00`

---

## 3. MODÉLISATION TYPESCRIPT DES DONNÉES

```typescript
export type SetType = 'normal' | 'warmup' | 'drop' | 'amrap' | 'failure';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rir: number; // 0 à 5+
  previous?: string; // ex: "100kg x 8"
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscles: string[];
  notes?: string;
  restSeconds: number;
  supersetGroup?: string; // ex: "A1", "A2"
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  templateId?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  totalSetsCount: number;
  exercises: WorkoutExercise[];
  status: 'in_progress' | 'completed';
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  description: string;
  targetMuscles: string[];
  exercises: WorkoutExercise[];
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  thighCm?: number;
  bicepsCm?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  currentWeightKg: number;
  totalWorkouts: number;
}

export interface FitTrackerData {
  profile: UserProfile;
  templates: WorkoutTemplate[];
  history: WorkoutSession[];
  measurements: BodyMeasurement[];
  currentWorkout?: WorkoutSession | null;
}
```

---

## 4. ARBORESCENCE DU PROJET

```text
WarriorFit/
├── PROMPT_ANTIGRAVITY.md
├── PLAN_ARCHITECTURE.md
├── app/
│   ├── _layout.tsx               # Layout racine avec Providers
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Barre d'onglets (Bottom Tab Navigation Bar)
│   │   ├── index.tsx             # ONGLET 1 : Entraînement
│   │   ├── history.tsx           # ONGLET 2 : Historique & Calendrier
│   │   └── profile.tsx           # ONGLET 3 : Performances & Profil
│   ├── live-workout.tsx          # ÉCRAN : Séance en Direct
│   └── template-editor.tsx       # ÉCRAN : Éditeur de programme
├── src/
│   ├── constants/
│   │   └── colors.ts             # Constantes de couleurs Hex
│   ├── types/
│   │   └── index.ts              # Typage TypeScript
│   ├── services/
│   │   ├── storage.ts            # Stockage local Offline-First
│   │   └── jsonExport.ts         # Export / Import JSON (expo-sharing, expo-clipboard)
│   ├── context/
│   │   ├── ThemeContext.tsx      # Gestionnaire de Thème Dark/Light
│   │   └── WorkoutContext.tsx    # State central des entraînements
│   └── components/
│       ├── UI/
│       │   ├── Card.tsx
│       │   ├── Button.tsx
│       │   └── Badge.tsx
│       ├── Workout/
│       │   ├── LiveWorkoutHeader.tsx
│       │   ├── ExerciseCard.tsx
│       │   ├── SetTableRow.tsx
│       │   └── RestTimerBar.tsx
│       ├── History/
│       │   ├── CalendarView.tsx
│       │   └── ActivitySummaryCard.tsx
│       └── Profile/
│           ├── ProfileHeaderCard.tsx
│           ├── OneRMChartCard.tsx
│           ├── BodyMeasurementsCard.tsx
│           └── JsonActionsCard.tsx
```

---

## 5. CALENDRIER DES COMMITS GIT (`@Subagent-Git`)

1. `chore(sys): init project with expo sdk 54`
2. `feat(data): add typescript interfaces and local storage service`
3. `feat(ui): implement dark/light theme and tab navigation`
4. `feat(workout): add live workout tracker with RIR and supersets`
5. `feat(json): implement export to clipboard and file sharing`
