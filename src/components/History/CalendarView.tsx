import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WorkoutSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarViewProps {
  history: WorkoutSession[];
}

const MONTHS_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const CalendarView: React.FC<CalendarViewProps> = ({ history }) => {
  const { theme } = useTheme();

  const [currentMonthIndex, setCurrentMonthIndex] = useState(7); // Août = index 7
  const [currentYear, setCurrentYear] = useState(2026);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const workoutDates = history.map((s) => s.startTime.split('T')[0]);

  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthStr = (currentMonthIndex + 1).toString().padStart(2, '0');

  return (
    <Card>
      {/* Month Selector Navigation (< Mois Année >) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: theme.text }]}>
            {MONTHS_NAMES[currentMonthIndex]} {currentYear}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {workoutDates.length} séances réalisées
          </Text>
        </View>

        <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
          <ChevronRight size={20} color={theme.text} />
        </TouchableOpacity>
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
          const dateStr = `${currentYear}-${monthStr}-${d < 10 ? '0' : ''}${d}`;
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

              {hasWorkout && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
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
  navBtn: {
    padding: 6,
  },
  titleBox: {
    alignItems: 'center',
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
