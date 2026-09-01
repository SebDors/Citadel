import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { TrendingUp, Dumbbell } from 'lucide-react-native';

export const OneRMChartCard: React.FC = () => {
  const { theme } = useTheme();
  const { data } = useWorkout();

  const history = data?.history || [];

  // Calcul dynamique des estimations 1RM depuis l'historique réel
  const exercises1RM = React.useMemo(() => {
    if (history.length === 0) return [];

    const map = new Map<string, { name: string; bestWeight: number; bestReps: number; est1RM: number }>();

    history.forEach((session) => {
      const sessExercises = session.exercises || [];
      sessExercises.forEach((ex) => {
        const name = ex.exerciseName;
        (ex.sets || []).forEach((set) => {
          if (set.completed && set.weightKg && set.weightKg > 0 && set.reps && set.reps > 0) {
            // Formule d'Epley : 1RM = Poids * (1 + Reps/30)
            const e1RM = Math.round(set.weightKg * (1 + set.reps / 30));
            const existing = map.get(name);
            if (!existing || e1RM > existing.est1RM) {
              map.set(name, {
                name,
                bestWeight: set.weightKg,
                bestReps: set.reps,
                est1RM: e1RM,
              });
            }
          }
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.est1RM - a.est1RM)
      .slice(0, 5);
  }, [history]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TrendingUp size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Progression 1RM Estimé</Text>
      </View>

      {exercises1RM.length > 0 ? (
        exercises1RM.map((item, idx) => (
          <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
            <View style={styles.itemLeft}>
              <Dumbbell size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
              <View>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>
                  Meilleure série : {item.bestWeight}kg × {item.bestReps} reps
                </Text>
              </View>
            </View>

            <View style={styles.itemRight}>
              <Text style={[styles.rmValue, { color: theme.accent }]}>{item.est1RM} kg</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noDataBox}>
          <Text style={[styles.noDataText, { color: theme.textMuted }]}>
            Aucune performance 1RM enregistrée. Complétez vos premières séances pour suivre vos progrès !
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rmValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  noDataBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
