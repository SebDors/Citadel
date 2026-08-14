import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import { Clock, Dumbbell, CheckCircle, RotateCw, Timer } from 'lucide-react-native';

export interface CircuitInfo {
  isCircuit: boolean;
  isAmrap: boolean;
  currentRound: number;
  totalRounds: number;
  amrapSecondsLeft?: number;
  amrapDurationMinutes?: number;
}

interface LiveWorkoutHeaderProps {
  session: WorkoutSession;
  onFinish: () => void;
  onCancel: () => void;
  circuitInfo?: CircuitInfo;
}

export const LiveWorkoutHeader: React.FC<LiveWorkoutHeaderProps> = ({
  session,
  onFinish,
  onCancel,
  circuitInfo,
}) => {
  const { theme } = useTheme();

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formatMinutesSeconds = (totalSeconds: number = 0): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderSubtitle = () => {
    if (circuitInfo?.isCircuit) {
      if (circuitInfo.isAmrap) {
        const amrapMins = circuitInfo.amrapDurationMinutes ?? 12;
        return `Circuit AMRAP (${amrapMins} min)`;
      }
      return `Circuit (${circuitInfo.totalRounds} tours)`;
    }
    if (session.isCircuit) {
      return `Circuit (${session.circuitRounds ?? 0} tours)`;
    }
    return 'Séance en cours';
  };

  const renderThirdStatBox = () => {
    if (circuitInfo?.isCircuit) {
      if (circuitInfo.isAmrap) {
        return (
          <View style={styles.statBox}>
            <Timer size={16} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatMinutesSeconds(circuitInfo.amrapSecondsLeft ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Temps restant</Text>
          </View>
        );
      }
      return (
        <View style={styles.statBox}>
          <RotateCw size={16} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {circuitInfo.currentRound} / {circuitInfo.totalRounds}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Tours</Text>
        </View>
      );
    }

    return (
      <View style={styles.statBox}>
        <CheckCircle size={16} color={theme.primary} />
        <Text style={[styles.statValue, { color: theme.text }]}>
          {session.completedSetsCount} / {session.totalSetsCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>Séries</Text>
      </View>
    );
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
            {session.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {renderSubtitle()}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {/* Timer */}
        <View style={styles.statBox}>
          <Clock size={16} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatDuration(session.durationSeconds)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Temps</Text>
        </View>

        {/* Volume */}
        <View style={styles.statBox}>
          <Dumbbell size={16} color={theme.secondary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{session.totalVolumeKg} kg</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Volume</Text>
        </View>

        {/* 3ème stat: Tours / Temps restant / Séries */}
        {renderThirdStatBox()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  btnSmall: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
