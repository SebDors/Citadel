import {
  calculateE1RM,
  calculateMaxE1RM,
  calculateWorkoutTotalVolume,
  flagPossibleUnderRecovery,
  calculateWeeklyMuscleVolume,
} from '../analyticsService';
import { WorkoutBlock, WorkoutSession } from '../../types';

describe('analyticsService', () => {
  describe('calculateE1RM', () => {
    it('returns exact weight for 1 rep without Epley inflation', () => {
      expect(calculateE1RM(100, 1)).toBe(100);
    });

    it('computes Epley 1RM for multiple reps', () => {
      // 100 * (1 + 10/30) = 133.33 -> 133.3
      expect(calculateE1RM(100, 10)).toBe(133.3);
    });

    it('returns null for invalid inputs', () => {
      expect(calculateE1RM(0, 10)).toBeNull();
      expect(calculateE1RM(100, 0)).toBeNull();
    });

    it('adjusts estimated 1RM when RIR is provided (MO-13)', () => {
      // 100 kg * 5 reps @ RIR 2 => effectiveReps = 7 => 100 * (1 + 7/30) = 123.3
      expect(calculateE1RM(100, 5, 'epley', 2)).toBe(123.3);
      expect(calculateE1RM(100, 5, 'epley', 0)).toBe(116.7);
    });
  });

  describe('calculateMaxE1RM - Bodyweight & RIR (AM-05 / MO-13)', () => {
    it('detects bodyweight exercise PR using bodyweightUsedKg + added weight and RIR', () => {
      const history: WorkoutSession[] = [
        {
          id: 'sess_bw',
          title: 'Upper',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          durationSeconds: 1800,
          completedSetsCount: 1,
          totalSetsCount: 1,
          totalVolumeKg: 900,
          blocks: [
            {
              id: 'b1',
              type: 'single',
              exercise: {
                id: 'ex1',
                exerciseId: 'pullups',
                exerciseName: 'Tractions Prise Pronation',
                primaryMuscle: 'Grand Dorsal',
                targetMuscles: [],
                restSeconds: 90,
                sets: [
                  {
                    id: 's1',
                    setNumber: 1,
                    type: 'normal',
                    isBodyweight: true,
                    bodyweightUsedKg: 80,
                    weightKg: 10,
                    reps: 5,
                    rir: 2,
                    completed: true,
                  },
                ],
              },
            },
          ],
        },
      ];

      const pr = calculateMaxE1RM(history, 'Tractions Prise Pronation');
      expect(pr).not.toBeNull();
      expect(pr?.weightKg).toBe(90);
      expect(pr?.e1RM).toBe(111); // 90 * (1 + 7/30) = 111.0
    });
  });

  describe('calculateWorkoutTotalVolume - Bodyweight Factor (MO-05)', () => {
    it('applies biomechanical bodyweight factor (0.65 for pushups)', () => {
      const blocks: WorkoutBlock[] = [
        {
          id: 'b1',
          type: 'single',
          exercise: {
            id: 'ex1',
            exerciseId: 'pushups',
            exerciseName: 'Pompes (Push-ups)',
            primaryMuscle: 'Pectoraux',
            targetMuscles: [],
            restSeconds: 60,
            sets: [
              {
                id: 's1',
                setNumber: 1,
                type: 'normal',
                isBodyweight: true,
                bodyweightUsedKg: 80,
                weightKg: 0,
                reps: 10,
                completed: true,
              },
            ],
          },
        },
      ];

      // 80 kg * 0.65 * 10 reps = 520 kg (instead of 800 kg)
      const result = calculateWorkoutTotalVolume(undefined, blocks);
      expect(result.volume).toBe(520);
      expect(result.completedCount).toBe(1);
    });

    it('applies 1.0 bodyweight factor for pullups plus external added weight', () => {
      const blocks: WorkoutBlock[] = [
        {
          id: 'b1',
          type: 'single',
          exercise: {
            id: 'ex1',
            exerciseId: 'pullups',
            exerciseName: 'Tractions Prise Pronation',
            primaryMuscle: 'Grand Dorsal',
            targetMuscles: [],
            restSeconds: 90,
            sets: [
              {
                id: 's1',
                setNumber: 1,
                type: 'normal',
                isBodyweight: true,
                bodyweightUsedKg: 80,
                weightKg: 10,
                reps: 8,
                completed: true,
              },
            ],
          },
        },
      ];

      // (80 * 1.0 + 10) * 8 = 720 kg
      const result = calculateWorkoutTotalVolume(undefined, blocks);
      expect(result.volume).toBe(720);
    });

    it('subtracts negative assisted weight from bodyweight and clamps at 0', () => {
      const assistedBlocks: WorkoutBlock[] = [
        {
          id: 'b1',
          type: 'single',
          exercise: {
            id: 'ex1',
            exerciseId: 'pullups',
            exerciseName: 'Tractions Prise Pronation',
            primaryMuscle: 'Grand Dorsal',
            targetMuscles: [],
            restSeconds: 90,
            sets: [
              {
                id: 's1',
                setNumber: 1,
                type: 'normal',
                isBodyweight: true,
                bodyweightUsedKg: 80,
                weightKg: -15,
                reps: 8,
                completed: true,
              },
              {
                id: 's2',
                setNumber: 2,
                type: 'normal',
                isBodyweight: true,
                bodyweightUsedKg: 80,
                weightKg: -100,
                reps: 8,
                completed: true,
              },
            ],
          },
        },
      ];

      // (80 - 15) * 8 + max(0, 80 - 100) * 8 = 520 kg
      const result = calculateWorkoutTotalVolume(undefined, assistedBlocks);
      expect(result.volume).toBe(520);

      const history: WorkoutSession[] = [
        {
          id: 'sess_assisted',
          title: 'Pull Assisted',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          durationSeconds: 1200,
          completedSetsCount: 1,
          totalSetsCount: 1,
          totalVolumeKg: 520,
          blocks: [assistedBlocks[0]],
        },
      ];

      const pr = calculateMaxE1RM(history, 'Tractions Prise Pronation');
      expect(pr).not.toBeNull();
      expect(pr?.weightKg).toBe(65);
    });

    it('avoids floating-point noise when multiplying bodyweightFactor (e.g. 74.9 * 0.9 + 10 = 77.41)', () => {
      const history: WorkoutSession[] = [
        {
          id: 'sess_dips',
          title: 'Push',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          durationSeconds: 1200,
          completedSetsCount: 1,
          totalSetsCount: 1,
          totalVolumeKg: 774.1,
          blocks: [
            {
              id: 'b1',
              type: 'single',
              exercise: {
                id: 'ex_dips',
                exerciseId: 'dips',
                exerciseName: 'Dips',
                primaryMuscle: 'Pectoraux',
                targetMuscles: [],
                restSeconds: 90,
                sets: [
                  {
                    id: 's1',
                    setNumber: 1,
                    type: 'normal',
                    isBodyweight: true,
                    bodyweightUsedKg: 74.9,
                    weightKg: 10,
                    reps: 10,
                    completed: true,
                  },
                ],
              },
            },
          ],
        },
      ];

      const pr = calculateMaxE1RM(history, 'Dips');
      expect(pr).not.toBeNull();
      expect(pr?.weightKg).toBe(77.41);
    });
  });

  describe('flagPossibleUnderRecovery - Fatigue RIR Logic (MO-04)', () => {
    it('flags under-recovery when avgRir drops > 1 point below 4w rolling avg with stagnant/dropping weight', () => {
      const isFatigued = flagPossibleUnderRecovery(
        { avgRir: 1.0, avgRir4wRollingAvg: 2.5, bodyweightKg: 79.5 },
        80.0
      );
      expect(isFatigued).toBe(true);
    });

    it('does NOT flag under-recovery during deload when avgRir increases above rolling avg', () => {
      const isFatigued = flagPossibleUnderRecovery(
        { avgRir: 4.0, avgRir4wRollingAvg: 2.0, bodyweightKg: 79.5 },
        80.0
      );
      expect(isFatigued).toBe(false);
    });
  });

  describe('calculateWeeklyMuscleVolume - Secondary Muscles (AM-04)', () => {
    it('allocates 1.0 set to primary muscle and 0.5 set to secondary muscles', () => {
      const nowIso = new Date().toISOString();
      const history: WorkoutSession[] = [
        {
          id: 'sess_1',
          title: 'Push',
          startTime: nowIso,
          endTime: nowIso,
          status: 'completed',
          durationSeconds: 3600,
          completedSetsCount: 2,
          totalSetsCount: 3,
          totalVolumeKg: 1000,
          blocks: [
            {
              id: 'b1',
              type: 'single',
              exercise: {
                id: 'ex1',
                exerciseId: 'bench_press',
                exerciseName: 'Développé Couché Barre',
                primaryMuscle: 'Pectoraux',
                primaryMuscles: ['Pectoraux'],
                targetMuscles: ['Triceps', 'Deltoïde Antérieur'],
                restSeconds: 90,
                sets: [
                  { id: 's1', setNumber: 1, type: 'normal', weightKg: 80, reps: 10, completed: true },
                  { id: 's2', setNumber: 2, type: 'normal', weightKg: 80, reps: 10, completed: true },
                  { id: 's3', setNumber: 3, type: 'warmup', weightKg: 40, reps: 12, completed: true },
                ],
              },
            },
          ],
        },
      ];

      const volume = calculateWeeklyMuscleVolume(history);
      const pecs = volume.find((v) => v.muscle === 'Pectoraux');
      const triceps = volume.find((v) => v.muscle === 'Triceps');
      const frontDelt = volume.find((v) => v.muscle === 'Deltoïde Antérieur');

      expect(pecs?.effectiveSets).toBe(2); // 2 working sets (warmup excluded)
      expect(triceps?.effectiveSets).toBe(1); // 2 * 0.5 = 1.0 effective set
      expect(frontDelt?.effectiveSets).toBe(1); // 2 * 0.5 = 1.0 effective set
    });
  });
});
