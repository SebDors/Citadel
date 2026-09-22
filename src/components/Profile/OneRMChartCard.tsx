import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Card } from '../UI/Card';
import { Trophy, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getSessionBlocks } from '../../types';
import { formatWeight } from '../../utils/numberUtils';
import { calculateE1RM } from '../../services/analyticsService';
import { StorageService } from '../../services/storage';

export const OneRMChartCard: React.FC = () => {
  const { theme } = useTheme();
  const { data } = useWorkout();

  const [isCardCollapsed, setIsCardCollapsed] = useState(false);

  useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['profile_one_rm'] === 'boolean') {
        setIsCardCollapsed(saved['profile_one_rm']);
      }
    });
  }, []);

  const toggleCardCollapsed = async () => {
    const nextVal = !isCardCollapsed;
    setIsCardCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, profile_one_rm: nextVal });
  };

  const history = data?.history || [];

  // Calcul des Records Personnels (PR) obtenus par exercice
  const latestPRs = useMemo(() => {
    if (history.length === 0) return [];

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const prMap = new Map<
      string,
      { name: string; weightKg: number; reps: number; e1RM: number; date: string }
    >();

    sortedHistory.forEach((session) => {
      const sessionDate = session.startTime;
      const blocks = getSessionBlocks(session);

      blocks.forEach((block) => {
        if (block.type === 'single') {
          (block.exercise.sets || []).forEach((set) => {
            if (set.completed && set.weightKg && set.weightKg > 0 && set.reps && set.reps > 0) {
              const currentE1RM = calculateE1RM(set.weightKg, set.reps);
              const existing = prMap.get(block.exercise.exerciseName);

              if (!existing || currentE1RM > existing.e1RM) {
                prMap.set(block.exercise.exerciseName, {
                  name: block.exercise.exerciseName,
                  weightKg: set.weightKg,
                  reps: set.reps,
                  e1RM: currentE1RM,
                  date: sessionDate,
                });
              }
            }
          });
        }
      });
    });

    return Array.from(prMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [history]);

  return (
    <Card style={styles.card}>
      {/* Header */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleCardCollapsed}
        style={[styles.header, isCardCollapsed && { marginBottom: 0 }]}
      >
        <View style={styles.titleRow}>
          <Trophy size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Records Personnels (PR)</Text>
          {isCardCollapsed && latestPRs.length > 0 && (
            <View style={[styles.collapsedBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.collapsedBadgeText, { color: theme.textMuted }]}>
                {latestPRs.length}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {isCardCollapsed ? (
            <ChevronDown size={18} color={theme.textMuted} />
          ) : (
            <ChevronUp size={18} color={theme.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {!isCardCollapsed && (
        latestPRs.length > 0 ? (
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
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.textMuted }]}>{formattedDate}</Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <Text style={[styles.prValue, { color: theme.accent }]}>
                    {formatWeight(item.weightKg)} kg
                  </Text>
                  <Text style={[styles.prSub, { color: theme.textMuted }]}>
                    {item.reps} rep{item.reps > 1 ? 's' : ''} · 1RM ~{Math.round(item.e1RM)} kg
                  </Text>
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
        )
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  collapsedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
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
  },
  prValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  prSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
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
