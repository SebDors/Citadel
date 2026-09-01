import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Trophy, Dumbbell } from 'lucide-react-native';

export const OneRMChartCard: React.FC = () => {
  const { theme } = useTheme();
  const { data } = useWorkout();

  const history = data?.history || [];

  // Calcul des derniers Records Personnels (PR) obtenus par exercice
  const latestPRs = React.useMemo(() => {
    if (history.length === 0) return [];

    // Chronologie croissante (de la séance la plus ancienne à la plus récente)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const prMap = new Map<
      string,
      { name: string; weightKg: number; reps: number; date: string }
    >();

    sortedHistory.forEach((session) => {
      const sessExercises = session.exercises || [];
      sessExercises.forEach((ex) => {
        const name = ex.exerciseName;
        (ex.sets || []).forEach((set) => {
          if (set.completed && set.weightKg && set.weightKg > 0) {
            const currentPR = prMap.get(name);
            if (!currentPR || set.weightKg > currentPR.weightKg) {
              prMap.set(name, {
                name,
                weightKg: set.weightKg,
                reps: set.reps || 0,
                date: session.startTime,
              });
            }
          }
        });
      });
    });

    // Tri par date d'obtention du PR (du plus récent au plus ancien)
    return Array.from(prMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [history]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Trophy size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Derniers PR (Records Personnels)</Text>
      </View>

      {latestPRs.length > 0 ? (
        latestPRs.map((item, idx) => {
          const formattedDate = new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
              <View style={styles.itemLeft}>
                <Dumbbell size={15} color={theme.accent} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.itemDate, { color: theme.textMuted }]}>{formattedDate}</Text>
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={[styles.prValue, { color: theme.accent }]}>{item.weightKg.toFixed(1)} kg</Text>
                {item.reps > 0 && (
                  <Text style={[styles.prSub, { color: theme.textMuted }]}>
                    {item.reps} rep{item.reps > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.noDataBox}>
          <Text style={[styles.noDataText, { color: theme.textMuted }]}>
            Aucun record personnel enregistré pour le moment. Complétez vos premières séances pour afficher vos PR !
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
    paddingVertical: 10,
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
  itemDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  prValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  prSub: {
    fontSize: 11,
    fontWeight: '500',
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
