import { create } from 'zustand';
import { UserProfile, OneRMFormula } from '../types';

export interface UserPreferencesState {
  enableRir: boolean;
  dropSetReductionPercent: number;
  userWeightKg: number;
  restTimerSeconds: number;
  restTimerSoundEnabled: boolean;
  oneRmFormula: OneRMFormula;
  syncFromProfile: (profile?: UserProfile | null) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>((set) => ({
  enableRir: true,
  dropSetReductionPercent: 20,
  userWeightKg: 75,
  restTimerSeconds: 90,
  restTimerSoundEnabled: true,
  oneRmFormula: 'epley',

  syncFromProfile: (profile) => {
    if (!profile) return;
    set({
      enableRir: profile.enableRir !== false,
      dropSetReductionPercent: profile.dropSetReductionPercent ?? 20,
      userWeightKg: (profile as any).weightKg ?? profile.currentWeightKg ?? 75,
      restTimerSeconds: (profile as any).restTimerSeconds ?? 90,
      restTimerSoundEnabled: (profile as any).restTimerSoundEnabled !== false,
      oneRmFormula: profile.oneRmFormula || 'epley',
    });
  },
}));
