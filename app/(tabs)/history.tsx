import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { CalendarView } from "../../src/components/History/CalendarView";
import { ActivitySummaryCard } from "../../src/components/History/ActivitySummaryCard";
import { CardioSessionCard } from "../../src/components/History/CardioSessionCard";
import { WeeklyMuscleVolumeCard } from "../../src/components/Analytics/WeeklyMuscleVolumeCard";
import { Calendar, Plus, ChevronDown, ChevronUp, Flame } from "lucide-react-native";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { LogPastWorkoutModal } from "../../src/components/History/LogPastWorkoutModal";
import { LogCardioModal } from "../../src/components/History/LogCardioModal";
import { StorageService } from "../../src/services/storage";
import { WorkoutSession, CardioSession } from "../../src/types";

type CombinedHistoryItem =
  | { type: 'workout'; id: string; date: Date; session: WorkoutSession }
  | { type: 'cardio'; id: string; date: Date; session: CardioSession };

export default function HistoryTab() {
  const { data, deleteWorkoutSession, deleteCardioSession } = useWorkout();
  const { theme } = useTheme();
  const [logModalVisible, setLogModalVisible] = React.useState(false);
  const [cardioModalVisible, setCardioModalVisible] = React.useState(false);
  const [isLastSessionsCollapsed, setIsLastSessionsCollapsed] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'all' | 'workout' | 'cardio'>('all');

  React.useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['history_last_sessions'] === 'boolean') {
        setIsLastSessionsCollapsed(saved['history_last_sessions']);
      }
    });
  }, []);

  const toggleLastSessionsCollapsed = async () => {
    const nextVal = !isLastSessionsCollapsed;
    setIsLastSessionsCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, history_last_sessions: nextVal });
  };

  const historyList = data?.history || [];
  const cardioList = data?.cardioSessions || [];

  const combinedList = React.useMemo<CombinedHistoryItem[]>(() => {
    const workouts: CombinedHistoryItem[] = historyList.map((s) => ({
      type: 'workout',
      id: s.id,
      date: new Date(s.startTime),
      session: s,
    }));
    const cardios: CombinedHistoryItem[] = cardioList.map((c) => ({
      type: 'cardio',
      id: c.id,
      date: new Date(c.date),
      session: c,
    }));
    return [...workouts, ...cardios].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [historyList, cardioList]);

  const displayList = React.useMemo(() => {
    if (filterType === 'workout') {
      return combinedList.filter((item) => item.type === 'workout');
    }
    if (filterType === 'cardio') {
      return combinedList.filter((item) => item.type === 'cardio');
    }
    return combinedList;
  }, [combinedList, filterType]);

  return (
    <TabSwipeWrapper tabIndex={1}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Page Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={[styles.title, { color: theme.text }]}>
                Historique
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.headerBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => setCardioModalVisible(true)}
                >
                  <Flame size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.headerBtnText, { color: "#FFFFFF" }]}>
                    Cardio / Boxe
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.headerBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setLogModalVisible(true)}
                >
                  <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.headerBtnText, { color: "#FFFFFF" }]}>
                    Séance passée
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Calendrier d'assiduité, séances musculation et cardio
            </Text>
          </View>

          {/* 1. Calendrier d'assiduité avec modale interactive des jours (Haut de page) */}
          <CalendarView history={historyList} />

          {/* 2. Bloc de Statistiques Hebdomadaires (Milieu de page) */}
          <ActivitySummaryCard history={historyList} />

          {/* 3. Répartition Scientifique du Volume Musculaire (MEV / MAV) */}
          <WeeklyMuscleVolumeCard />

          {/* 4. Liste Chronologique Compacte des Derniers Entraînements (Bas de page) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.listSectionHeader}
            onPress={toggleLastSessionsCollapsed}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Calendar
                size={18}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.listTitle, { color: theme.text }]}>
                Dernières Séances Effectuées
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isLastSessionsCollapsed && combinedList.length > 0 && (
                <View style={[styles.collapsedBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.collapsedBadgeText, { color: theme.textMuted }]}>
                    {combinedList.length}
                  </Text>
                </View>
              )}
              {isLastSessionsCollapsed ? (
                <ChevronDown size={18} color={theme.textMuted} />
              ) : (
                <ChevronUp size={18} color={theme.textMuted} />
              )}
            </View>
          </TouchableOpacity>

          {/* Filtres de vue (Tous / Musculation / Cardio) si au moins une séance cardio existe */}
          {!isLastSessionsCollapsed && (cardioList.length > 0 || historyList.length > 0) && (
            <View style={styles.filterBar}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  filterType === 'all'
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setFilterType('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterType === 'all' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'all' ? '800' : '600' },
                  ]}
                >
                  Toutes ({combinedList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  filterType === 'workout'
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setFilterType('workout')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterType === 'workout' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'workout' ? '800' : '600' },
                  ]}
                >
                  Muscu ({historyList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  filterType === 'cardio'
                    ? { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setFilterType('cardio')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterType === 'cardio' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'cardio' ? '800' : '600' },
                  ]}
                >
                  Cardio ({cardioList.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLastSessionsCollapsed && (
            displayList.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {filterType === 'cardio'
                  ? 'Aucune séance cardio enregistrée.'
                  : filterType === 'workout'
                  ? 'Aucune séance de musculation enregistrée.'
                  : 'Aucune séance terminée pour le moment.'}
              </Text>
            ) : (
              displayList.slice(0, 10).map((item) => {
                if (item.type === 'workout') {
                  return (
                    <ActivitySummaryCard
                      key={`workout_${item.id}`}
                      session={item.session}
                      onDeleteSession={deleteWorkoutSession}
                    />
                  );
                }
                return (
                  <CardioSessionCard
                    key={`cardio_${item.id}`}
                    session={item.session}
                    onDelete={deleteCardioSession}
                  />
                );
              })
            )
          )}
        </ScrollView>

        <LogPastWorkoutModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
        />

        <LogCardioModal
          visible={cardioModalVisible}
          onClose={() => setCardioModalVisible(false)}
        />
      </SafeAreaView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 2,
    paddingBottom: 20,
  },
  header: {
    marginTop: 2,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  collapsedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  collapsedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
});
