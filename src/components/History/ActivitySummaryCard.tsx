import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Award, Dumbbell, Clock } from 'lucide-react-native';

interface ActivitySummaryCardProps {
  history: WorkoutSession[];
}

export const ActivitySummaryCard: React.FC<ActivitySummaryCardProps> = ({ history }) => {
  const { theme } = useTheme();

  const totalVolume = history.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalSeconds = history.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Activité Récente</Text>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Award size={18} color={theme.accent} />
          <Text style={[styles.value, { color: theme.text }]}>{history.length}</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Séances</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Dumbbell size={18} color={theme.secondary} />
          <Text style={[styles.value, { color: theme.text }]}>{totalVolume} kg</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Volume Total</Text>
        </View>

        <View style={[styles.metricBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Clock size={18} color={theme.primary} />
          <Text style={[styles.value, { color: theme.text }]}>{totalHours}h</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Temps Cumulé</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
