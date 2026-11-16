import { create } from 'zustand';
import { WorkoutSession } from '../types';

export interface ActiveWorkoutState {
  activeSession: WorkoutSession | null;
  restTimerSecondsLeft: number;
  restTimerInitialSeconds: number;
  isRestTimerRunning: boolean;
  setActiveSession: (session: WorkoutSession | null) => void;
  setRestTimerState: (secondsLeft: number, initialSeconds: number, isRunning: boolean) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  activeSession: null,
  restTimerSecondsLeft: 0,
  restTimerInitialSeconds: 90,
  isRestTimerRunning: false,

  setActiveSession: (activeSession) => set({ activeSession }),
  setRestTimerState: (restTimerSecondsLeft, restTimerInitialSeconds, isRestTimerRunning) =>
    set({ restTimerSecondsLeft, restTimerInitialSeconds, isRestTimerRunning }),
}));
