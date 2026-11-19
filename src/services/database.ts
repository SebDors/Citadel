import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import {
  FitTrackerData,
  WorkoutSession,
  WorkoutTemplate,
  BodyMeasurement,
  WorkoutFolder,
  CardioSession,
  UserProfile,
  getSessionBlocks,
  SingleExerciseBlock,
} from '../types';
import { SharedExercise, getBodyweightFactor } from '../constants/exerciseDatabase';
import { calculateE1RM } from './analyticsService';

export interface ExerciseRecordEntry {
  exerciseKey: string;
  exerciseId?: string;
  exerciseName: string;
  maxWeightKg: number;
  maxE1RM: number;
  maxReps: number;
  bestSessionId: string;
  achievedAt: string;
}

const DB_NAME = 'citadel_v1.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Retourne l'instance SQLite ouverte (uniquement sur iOS/Android).
 */
export function getDatabase(): SQLite.SQLiteDatabase | null {
  if (Platform.OS === 'web') return null;
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initialise le schéma relationnel indexé SQLite (MO-02 & SU-09).
 */
export function initDatabaseSchema(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      current_weight_kg REAL NOT NULL DEFAULT 75,
      height_cm REAL,
      goal TEXT,
      weekly_goal_workouts INTEGER DEFAULT 4,
      enable_rir INTEGER DEFAULT 1,
      drop_set_reduction_percent REAL DEFAULT 20,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_seconds INTEGER,
      total_volume REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      is_exception INTEGER DEFAULT 0,
      exception_reason TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

    CREATE TABLE IF NOT EXISTS session_blocks (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      block_type TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      rounds INTEGER,
      title TEXT,
      circuit_type TEXT,
      amrap_duration_minutes INTEGER,
      rest_between_rounds_seconds INTEGER,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_session_id ON session_blocks(session_id);

    CREATE TABLE IF NOT EXISTS session_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      block_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      exercise_id TEXT,
      exercise_name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      sub_region TEXT,
      rest_seconds INTEGER DEFAULT 75,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_bodyweight INTEGER DEFAULT 0,
      raw_json TEXT,
      FOREIGN KEY (block_id) REFERENCES session_blocks(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_session_id ON session_exercises(session_id);
    CREATE INDEX IF NOT EXISTS idx_exercises_name ON session_exercises(exercise_name);

    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY NOT NULL,
      exercise_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'normal',
      weight_kg REAL,
      reps INTEGER,
      rir INTEGER,
      target_rir INTEGER,
      duration_seconds INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      is_bodyweight INTEGER DEFAULT 0,
      bodyweight_used_kg REAL,
      raw_json TEXT,
      FOREIGN KEY (exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON session_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_sets_session_id ON session_sets(session_id);

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      folder_id TEXT,
      order_index INTEGER DEFAULT 0,
      raw_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      is_collapsed INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      raw_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL,
      body_fat_percentage REAL,
      chest_cm REAL,
      waist_cm REAL,
      thigh_cm REAL,
      biceps_cm REAL
    );

    CREATE INDEX IF NOT EXISTS idx_measurements_date ON body_measurements(date ASC);

    CREATE TABLE IF NOT EXISTS cardio_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      activity TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      rpe INTEGER,
      notes TEXT,
      raw_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cardio_date ON cardio_sessions(date DESC);

    CREATE TABLE IF NOT EXISTS custom_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      category TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_exercise_records (
      exercise_key TEXT PRIMARY KEY NOT NULL,
      exercise_id TEXT,
      exercise_name TEXT NOT NULL,
      max_weight_kg REAL NOT NULL DEFAULT 0,
      max_e1rm REAL NOT NULL DEFAULT 0,
      max_reps INTEGER NOT NULL DEFAULT 0,
      best_session_id TEXT NOT NULL,
      achieved_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_records_e1rm ON user_exercise_records(max_e1rm DESC);
  `);
}

/**
 * Insère ou met à jour une séance (et ses tables relationnelles normalisées) dans une transaction SQLite.
 */
export function upsertSessionInDb(
  db: SQLite.SQLiteDatabase,
  session: WorkoutSession,
  isActive: boolean
): void {
  db.runSync(
    `INSERT OR REPLACE INTO sessions (
      id, template_id, title, start_time, end_time, duration_seconds,
      total_volume, status, is_exception, exception_reason, is_active, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.templateId || null,
      session.title,
      session.startTime,
      session.endTime || null,
      session.durationSeconds ?? null,
      session.totalVolumeKg ?? 0,
      session.status,
      session.isException ? 1 : 0,
      session.exceptionReason || null,
      isActive ? 1 : 0,
      JSON.stringify(session),
    ]
  );

  // Nettoyer les enfants existants explicitement et réinsérer proprement
  db.runSync('DELETE FROM session_sets WHERE session_id = ?', [session.id]);
  db.runSync('DELETE FROM session_exercises WHERE session_id = ?', [session.id]);
  db.runSync('DELETE FROM session_blocks WHERE session_id = ?', [session.id]);

  const blocks = getSessionBlocks(session);
  blocks.forEach((block, bIdx) => {
    const blockDbId = `${session.id}::b_${bIdx}::${block.id || 'blk'}`;
    db.runSync(
      `INSERT OR REPLACE INTO session_blocks (
        id, session_id, block_type, order_index, rounds, title,
        circuit_type, amrap_duration_minutes, rest_between_rounds_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blockDbId,
        session.id,
        block.type,
        bIdx,
        block.type === 'circuit' ? block.rounds : null,
        block.type === 'circuit' ? block.title : null,
        block.type === 'circuit' ? block.circuitType || 'rounds' : null,
        block.type === 'circuit' ? block.amrapDurationMinutes ?? null : null,
        block.type === 'circuit' ? block.restBetweenRoundsSeconds : null,
      ]
    );

    if (block.type === 'single') {
      const ex = (block as SingleExerciseBlock).exercise;
      const exDbId = `${blockDbId}::e_0::${ex.id || 'ex'}`;
      db.runSync(
        `INSERT OR REPLACE INTO session_exercises (
          id, block_id, session_id, exercise_id, exercise_name,
          primary_muscle, sub_region, rest_seconds, order_index, is_bodyweight, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exDbId,
          blockDbId,
          session.id,
          ex.exerciseId || null,
          ex.exerciseName,
          ex.primaryMuscle,
          ex.subRegion || null,
          ex.restSeconds ?? 75,
          0,
          ex.isBodyweight ? 1 : 0,
          JSON.stringify(ex),
        ]
      );

      (ex.sets || []).forEach((s, sIdx) => {
        const setDbId = `${exDbId}::s_${sIdx}::${s.id || 'set'}`;
        db.runSync(
          `INSERT OR REPLACE INTO session_sets (
            id, exercise_id, session_id, set_number, type, weight_kg, reps,
            rir, target_rir, duration_seconds, completed, completed_at,
            is_bodyweight, bodyweight_used_kg, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            setDbId,
            exDbId,
            session.id,
            s.setNumber,
            s.type,
            s.weightKg ?? null,
            s.reps ?? null,
            s.rir ?? null,
            s.targetRir ?? null,
            s.durationSeconds ?? null,
            s.completed ? 1 : 0,
            s.completedAt || null,
            s.isBodyweight ? 1 : 0,
            s.bodyweightUsedKg ?? null,
            JSON.stringify(s),
          ]
        );
      });
    } else if (block.type === 'circuit') {
      block.exercises.forEach((item, eIdx) => {
        const itemDbId = `${blockDbId}::ce_${eIdx}::${item.id || 'item'}`;
        db.runSync(
          `INSERT OR REPLACE INTO session_exercises (
            id, block_id, session_id, exercise_id, exercise_name,
            primary_muscle, sub_region, rest_seconds, order_index, is_bodyweight, raw_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemDbId,
            blockDbId,
            session.id,
            item.exerciseId || null,
            item.exerciseName,
            item.primaryMuscle,
            item.subRegion || null,
            block.restBetweenRoundsSeconds ?? 60,
            eIdx,
            0,
            JSON.stringify(item),
          ]
        );
      });
    }
  });
}

/**
 * Met à jour de façon incrémentale la table `user_exercise_records` pour une séance terminée (SU-09).
 * Évite le balayage linéaire O(N*M) sur tout l'historique.
 */
export function updateIncrementalRecordsForSession(
  db: SQLite.SQLiteDatabase,
  session: WorkoutSession
): void {
  if (session.status !== 'completed') return;
  const blocks = getSessionBlocks(session);

  blocks.forEach((block) => {
    if (block.type !== 'single') return;
    const ex = block.exercise;
    const exerciseKey = (ex.exerciseId || ex.exerciseName).toLowerCase().trim();
    const bwFactor = getBodyweightFactor(ex.exerciseId, ex.exerciseName);

    let sessionMaxWeight = 0;
    let sessionMaxE1RM = 0;
    let sessionMaxReps = 0;

    (ex.sets || []).forEach((s) => {
      if (!s.completed || s.type === 'warmup') return;
      const effWeight = Math.max(0, (s.isBodyweight ? (s.bodyweightUsedKg || 0) * bwFactor : 0) + (s.weightKg || 0));
      const reps = s.reps || 0;
      if (effWeight > sessionMaxWeight) sessionMaxWeight = effWeight;
      if (reps > sessionMaxReps) sessionMaxReps = reps;
      if (effWeight > 0 && reps > 0) {
        const e1rm = calculateE1RM(effWeight, reps, 'epley', s.rir) || 0;
        if (e1rm > sessionMaxE1RM) sessionMaxE1RM = e1rm;
      }
    });

    if (sessionMaxE1RM <= 0 && sessionMaxWeight <= 0) return;

    const existing = db.getFirstSync<{
      max_weight_kg: number;
      max_e1rm: number;
      max_reps: number;
      best_session_id: string;
      achieved_at: string;
    }>(
      'SELECT max_weight_kg, max_e1rm, max_reps, best_session_id, achieved_at FROM user_exercise_records WHERE exercise_key = ?',
      [exerciseKey]
    );

    if (!existing) {
      db.runSync(
        `INSERT INTO user_exercise_records (
          exercise_key, exercise_id, exercise_name, max_weight_kg, max_e1rm, max_reps, best_session_id, achieved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exerciseKey,
          ex.exerciseId || null,
          ex.exerciseName,
          Math.round(sessionMaxWeight * 10) / 10,
          Math.round(sessionMaxE1RM * 10) / 10,
          sessionMaxReps,
          session.id,
          session.endTime || session.startTime,
        ]
      );
    } else {
      const nextWeight = Math.max(existing.max_weight_kg, Math.round(sessionMaxWeight * 10) / 10);
      const nextE1RM = Math.max(existing.max_e1rm, Math.round(sessionMaxE1RM * 10) / 10);
      const nextReps = Math.max(existing.max_reps, sessionMaxReps);
      const isNewBestE1RM = sessionMaxE1RM > existing.max_e1rm;

      db.runSync(
        `UPDATE user_exercise_records
         SET max_weight_kg = ?, max_e1rm = ?, max_reps = ?, best_session_id = ?, achieved_at = ?
         WHERE exercise_key = ?`,
        [
          nextWeight,
          nextE1RM,
          nextReps,
          isNewBestE1RM ? session.id : existing.best_session_id,
          isNewBestE1RM ? (session.endTime || session.startTime) : existing.achieved_at,
          exerciseKey,
        ]
      );
    }
  });
}

/**
 * Reconstruit la table `user_exercise_records` après suppression ou modification d'une séance historique.
 */
export function rebuildAllExerciseRecordsInDb(
  db: SQLite.SQLiteDatabase,
  history: WorkoutSession[]
): void {
  db.runSync('DELETE FROM user_exercise_records');
  history.forEach((session) => {
    updateIncrementalRecordsForSession(db, session);
  });
}

/**
 * Lit l'ensemble des records PR pré-calculés en O(1) depuis SQLite.
 */
export function loadExerciseRecordsFromDb(
  db: SQLite.SQLiteDatabase
): Record<string, ExerciseRecordEntry> {
  const rows = db.getAllSync<{
    exercise_key: string;
    exercise_id: string | null;
    exercise_name: string;
    max_weight_kg: number;
    max_e1rm: number;
    max_reps: number;
    best_session_id: string;
    achieved_at: string;
  }>('SELECT * FROM user_exercise_records ORDER BY max_e1rm DESC');

  const map: Record<string, ExerciseRecordEntry> = {};
  rows.forEach((r) => {
    map[r.exercise_key] = {
      exerciseKey: r.exercise_key,
      exerciseId: r.exercise_id || undefined,
      exerciseName: r.exercise_name,
      maxWeightKg: r.max_weight_kg,
      maxE1RM: r.max_e1rm,
      maxReps: r.max_reps,
      bestSessionId: r.best_session_id,
      achievedAt: r.achieved_at,
    };
  });
  return map;
}

/**
 * Sauvegarde complète atomique de `FitTrackerData` dans SQLite.
 */
export function saveFullDataToDb(
  db: SQLite.SQLiteDatabase,
  data: FitTrackerData
): void {
  db.withTransactionSync(() => {
    // 1. Profile
    const p = data.profile;
    db.runSync(
      `INSERT OR REPLACE INTO user_profile (
        id, name, avatar_url, current_weight_kg, height_cm, goal,
        weekly_goal_workouts, enable_rir, drop_set_reduction_percent, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name,
        p.avatarUrl || null,
        p.currentWeightKg,
        null,
        null,
        4,
        p.enableRir !== false ? 1 : 0,
        p.dropSetReductionPercent ?? 20,
        JSON.stringify(p),
      ]
    );

    // 2. Templates
    db.runSync('DELETE FROM templates');
    (data.templates || []).forEach((t, idx) => {
      db.runSync(
        'INSERT OR REPLACE INTO templates (id, title, folder_id, order_index, raw_json) VALUES (?, ?, ?, ?, ?)',
        [t.id, t.title, null, idx, JSON.stringify(t)]
      );
    });

    // 3. Folders
    db.runSync('DELETE FROM folders');
    (data.folders || []).forEach((f, idx) => {
      db.runSync(
        'INSERT OR REPLACE INTO folders (id, name, is_collapsed, order_index, raw_json) VALUES (?, ?, ?, ?, ?)',
        [f.id, f.name, f.isCollapsed ? 1 : 0, idx, JSON.stringify(f)]
      );
    });

    // 4. Measurements
    db.runSync('DELETE FROM body_measurements');
    (data.measurements || []).forEach((m) => {
      db.runSync(
        `INSERT OR REPLACE INTO body_measurements (
          id, date, weight_kg, body_fat_percentage, chest_cm, waist_cm, thigh_cm, biceps_cm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.date,
          m.weightKg ?? null,
          m.bodyFatPercentage ?? null,
          m.chestCm ?? null,
          m.waistCm ?? null,
          m.thighCm ?? null,
          m.bicepsCm ?? null,
        ]
      );
    });

    // 5. Cardio Sessions
    db.runSync('DELETE FROM cardio_sessions');
    (data.cardioSessions || []).forEach((c) => {
      db.runSync(
        `INSERT OR REPLACE INTO cardio_sessions (
          id, date, activity, duration_minutes, rpe, notes, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.date,
          c.activity,
          c.durationMinutes,
          (c as any).rpe ?? null,
          c.notes || null,
          JSON.stringify(c),
        ]
      );
    });

    // 6. Custom Exercises
    db.runSync('DELETE FROM custom_exercises');
    (data.customExercises || []).forEach((ex) => {
      db.runSync(
        'INSERT OR REPLACE INTO custom_exercises (id, name, primary_muscle, category, raw_json) VALUES (?, ?, ?, ?, ?)',
        [ex.id, ex.name, ex.primaryMuscle, ex.category, JSON.stringify(ex)]
      );
    });

    // 7. History + Active Workout
    db.runSync('DELETE FROM session_sets');
    db.runSync('DELETE FROM session_exercises');
    db.runSync('DELETE FROM session_blocks');
    db.runSync('DELETE FROM sessions');
    (data.history || []).forEach((s) => {
      upsertSessionInDb(db, s, false);
    });

    if (data.currentWorkout) {
      upsertSessionInDb(db, data.currentWorkout, true);
    }

    // 8. Rebuild PR records
    rebuildAllExerciseRecordsInDb(db, data.history || []);

    // 9. Persist onboarding & walkthrough flags in app_meta
    db.runSync(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('has_completed_onboarding', ?)",
      [data.hasCompletedOnboarding ? 'true' : 'false']
    );
    db.runSync(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('has_created_first_session', ?)",
      [data.hasCreatedFirstSession ? 'true' : 'false']
    );
    db.runSync(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('has_completed_first_workout', ?)",
      [data.hasCompletedFirstWorkout ? 'true' : 'false']
    );
    if (data.weeklySchedule) {
      db.runSync(
        "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('weekly_schedule', ?)",
        [JSON.stringify(data.weeklySchedule)]
      );
    }
  });
}

/**
 * Reconstruit `FitTrackerData` complet depuis la base SQLite.
 */
export function loadFullDataFromDb(db: SQLite.SQLiteDatabase): FitTrackerData | null {
  const profileRow = db.getFirstSync<{ raw_json: string }>(
    'SELECT raw_json FROM user_profile LIMIT 1'
  );
  if (!profileRow) return null;

  const profile: UserProfile = JSON.parse(profileRow.raw_json);

  const templates: WorkoutTemplate[] = db
    .getAllSync<{ raw_json: string }>('SELECT raw_json FROM templates ORDER BY order_index ASC')
    .map((r) => JSON.parse(r.raw_json));

  const folders: WorkoutFolder[] = db
    .getAllSync<{ raw_json: string }>('SELECT raw_json FROM folders ORDER BY order_index ASC')
    .map((r) => JSON.parse(r.raw_json));

  const measurements: BodyMeasurement[] = db
    .getAllSync<{
      id: string;
      date: string;
      weight_kg: number | null;
      body_fat_percentage: number | null;
      chest_cm: number | null;
      waist_cm: number | null;
      thigh_cm: number | null;
      biceps_cm: number | null;
    }>('SELECT * FROM body_measurements ORDER BY date ASC')
    .map((r) => ({
      id: r.id,
      date: r.date,
      weightKg: r.weight_kg ?? undefined,
      bodyFatPercentage: r.body_fat_percentage ?? undefined,
      chestCm: r.chest_cm ?? undefined,
      waistCm: r.waist_cm ?? undefined,
      thighCm: r.thigh_cm ?? undefined,
      bicepsCm: r.biceps_cm ?? undefined,
    }));

  const cardioSessions: CardioSession[] = db
    .getAllSync<{ raw_json: string }>('SELECT raw_json FROM cardio_sessions ORDER BY date DESC')
    .map((r) => JSON.parse(r.raw_json));

  const customExercises: SharedExercise[] = db
    .getAllSync<{ raw_json: string }>('SELECT raw_json FROM custom_exercises')
    .map((r) => JSON.parse(r.raw_json));

  const history: WorkoutSession[] = db
    .getAllSync<{ raw_json: string }>(
      'SELECT raw_json FROM sessions WHERE is_active = 0 ORDER BY start_time DESC'
    )
    .map((r) => JSON.parse(r.raw_json));

  const activeRow = db.getFirstSync<{ raw_json: string }>(
    'SELECT raw_json FROM sessions WHERE is_active = 1 LIMIT 1'
  );
  const currentWorkout: WorkoutSession | null = activeRow
    ? JSON.parse(activeRow.raw_json)
    : null;

  const metaRows = db.getAllSync<{ key: string; value: string }>(
    "SELECT key, value FROM app_meta WHERE key IN ('has_completed_onboarding', 'has_created_first_session', 'has_completed_first_workout', 'weekly_schedule')"
  );
  const metaMap: Record<string, string> = {};
  metaRows.forEach((r) => { metaMap[r.key] = r.value; });

  return {
    profile,
    templates,
    folders,
    history,
    measurements,
    cardioSessions,
    customExercises,
    currentWorkout,
    hasCompletedOnboarding: metaMap['has_completed_onboarding'] === 'true',
    hasCreatedFirstSession: metaMap['has_created_first_session'] === 'true',
    hasCompletedFirstWorkout: metaMap['has_completed_first_workout'] === 'true',
    weeklySchedule: metaMap['weekly_schedule'] ? JSON.parse(metaMap['weekly_schedule']) : undefined,
  };
}

/**
 * Sauvegarde synchrone et atomique de la séance active (MO-09 : zéro debounce de 2s).
 */
export function saveActiveWorkoutSyncInDb(
  db: SQLite.SQLiteDatabase,
  session: WorkoutSession | null
): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM sessions WHERE is_active = 1');
    if (session) {
      upsertSessionInDb(db, session, true);
    }
  });
}

/**
 * Charge uniquement la séance active depuis SQLite.
 */
export function loadActiveWorkoutFromDb(
  db: SQLite.SQLiteDatabase
): WorkoutSession | null {
  const row = db.getFirstSync<{ raw_json: string }>(
    'SELECT raw_json FROM sessions WHERE is_active = 1 LIMIT 1'
  );
  return row ? JSON.parse(row.raw_json) : null;
}
