import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';

interface CalendarViewProps {
  history: WorkoutSession[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ history }) => {
  const { theme } = useTheme();

  // Obtenir les dates où une séance a eu lieu (format YYYY-MM-DD)
  const workoutDates = history.map((s) => s.startTime.split('T')[0]);

  // Mois courant : Août 2026 (ou mois courant dynamique)
  const daysInMonth = 31; // Août
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Août 2026</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {workoutDates.length} séances réalisées
        </Text>
      </View>

      <View style={styles.daysHeader}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
          <Text key={idx} style={[styles.dayName, { color: theme.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((d) => {
          const dateStr = `2026-08-${d < 10 ? '0' : ''}${d}`;
          const hasWorkout = workoutDates.includes(dateStr);

          return (
            <View key={d} style={styles.dayCell}>
              <Text
                style={[
                  styles.dayNum,
                  { color: theme.text },
                  hasWorkout ? { fontWeight: '900', color: theme.accent } : null,
                ]}
              >
                {d}
              </Text>

              {/* Puce de présence sous la date */}
              {hasWorkout && (
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayName: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '500',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});
