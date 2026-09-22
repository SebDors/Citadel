import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { CalendarView } from "../../src/components/History/CalendarView";
import { ActivitySummaryCard } from "../../src/components/History/ActivitySummaryCard";
import { WeeklyMuscleVolumeCard } from "../../src/components/Analytics/WeeklyMuscleVolumeCard";
import { Calendar, Plus, Clock, ChevronDown, ChevronUp } from "lucide-react-native";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { LogPastWorkoutModal } from "../../src/components/History/LogPastWorkoutModal";
import { TouchableOpacity } from "react-native";
import { StorageService } from "../../src/services/storage";

export default function HistoryTab() {
  const { data, deleteWorkoutSession } = useWorkout();
  const { theme } = useTheme();
  const [logModalVisible, setLogModalVisible] = React.useState(false);
  const [isLastSessionsCollapsed, setIsLastSessionsCollapsed] = React.useState(false);

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
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.headerBtn, { backgroundColor: theme.accent }]}
                onPress={() => setLogModalVisible(true)}
              >
                <Plus size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={[styles.headerBtnText, { color: "#FFFFFF" }]}>
                  Séance passée
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Calendrier d'assiduité et séances passées
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
              {isLastSessionsCollapsed && historyList.length > 0 && (
                <View style={[styles.collapsedBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.collapsedBadgeText, { color: theme.textMuted }]}>
                    {historyList.length}
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

          {!isLastSessionsCollapsed && (
            historyList.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Aucune séance terminée pour le moment.
              </Text>
            ) : (
              historyList.slice(0, 7).map((session) => (
                <ActivitySummaryCard
                  key={session.id}
                  session={session}
                  onDeleteSession={deleteWorkoutSession}
                />
              ))
            )
          )}
        </ScrollView>

        <LogPastWorkoutModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
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
    marginBottom: 4,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  title: {
    fontSize: 28,
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
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
});
