import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import { Clock, Dumbbell, CheckCircle } from 'lucide-react-native';

interface LiveWorkoutHeaderProps {
  session: WorkoutSession;
  onFinish: () => void;
  onCancel: () => void;
}

export const LiveWorkoutHeader: React.FC<LiveWorkoutHeaderProps> = ({
  session,
  onFinish,
  onCancel,
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

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{session.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {session.isCircuit ? `Circuit (${session.circuitRounds} tours)` : 'Séance en cours'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title="Annuler" variant="outline" onPress={onCancel} style={styles.btnSmall} />
          <Button title="Terminer" variant="primary" onPress={onFinish} style={styles.btnSmall} />
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

        {/* Sets Completed */}
        <View style={styles.statBox}>
          <CheckCircle size={16} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {session.completedSetsCount} / {session.totalSetsCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Séries</Text>
        </View>
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
    paddingHorizontal: 12,
    marginLeft: 6,
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
