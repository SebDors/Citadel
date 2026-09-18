import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { CalendarView } from "../../src/components/History/CalendarView";
import { ActivitySummaryCard } from "../../src/components/History/ActivitySummaryCard";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { LogPastWorkoutModal } from "../../src/components/History/LogPastWorkoutModal";
import { PastSessionDetailModal } from "../../src/components/History/PastSessionDetailModal";
import { FinTechBalance, FinTechPill } from "../../src/components/FinTech/FinTechUI";
import { FINTECH_COLORS } from "../../src/constants/fintechTheme";
import { WorkoutSession } from "../../src/types";
import {
  Plus,
  Dumbbell,
  ChevronRight,
  Calendar as CalendarIcon,
  Activity,
  Flame,
} from "lucide-react-native";

type HistoryViewMode = "statement" | "calendar";

const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Aujourd'hui à ${timeStr}`;
  if (isYesterday) return `Hier à ${timeStr}`;
  return `${date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} à ${timeStr}`;
};

interface PeriodGroup {
  title: string;
  sessions: WorkoutSession[];
}

export default function HistoryTab() {
  const { data, deleteWorkoutSession } = useWorkout();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<HistoryViewMode>("statement");
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    null
  );

  const historyList = useMemo(() => data?.history || [], [data?.history]);

  // Calcul du volume total historique et séries
  const totalVolume = useMemo(() => {
    return historyList.reduce(
      (acc, s) => acc + Math.round(s.totalVolumeKg || 0),
      0
    );
  }, [historyList]);

  // Groupement des séances par périodes (Relevé bancaire)
  const groupedPeriods = useMemo((): PeriodGroup[] => {
    if (historyList.length === 0) return [];

    const sorted = [...historyList].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    const now = new Date();
    const startOfThisWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diffToMonday =
      now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfThisWeek.setDate(diffToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeek: WorkoutSession[] = [];
    const lastWeek: WorkoutSession[] = [];
    const monthGroups: Record<string, WorkoutSession[]> = {};

    for (const s of sorted) {
      const sDate = new Date(s.startTime);
      if (sDate >= startOfThisWeek) {
        thisWeek.push(s);
      } else if (sDate >= startOfLastWeek) {
        lastWeek.push(s);
      } else {
        const monthYear = sDate
          .toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })
          .toUpperCase();
        if (!monthGroups[monthYear]) {
          monthGroups[monthYear] = [];
        }
        monthGroups[monthYear].push(s);
      }
    }

    const groups: PeriodGroup[] = [];
    if (thisWeek.length > 0)
      groups.push({ title: "CETTE SEMAINE", sessions: thisWeek });
    if (lastWeek.length > 0)
      groups.push({ title: "SEMAINE DERNIÈRE", sessions: lastWeek });
    for (const [mTitle, mSessions] of Object.entries(monthGroups)) {
      groups.push({ title: mTitle, sessions: mSessions });
    }

    return groups;
  }, [historyList]);

  const handleDeleteSessionConfirm = (session: WorkoutSession) => {
    Alert.alert(
      "Supprimer la séance",
      `Êtes-vous sûr de vouloir supprimer "${session.title}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (deleteWorkoutSession) {
              await deleteWorkoutSession(session.id);
            }
          },
        },
      ]
    );
  };

  return (
    <TabSwipeWrapper tabIndex={1}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: FINTECH_COLORS.black }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Compact FinTech */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerCategory}>RELEVÉ D'ACTIVITÉ</Text>
              <Text style={styles.headerTitle}>Historique</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLogModalVisible(true)}
              style={styles.addPastBtn}
            >
              <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addPastBtnText}>Séance</Text>
            </TouchableOpacity>
          </View>

          {/* Solde de Volume Monumental (Trade Republic Style) */}
          <FinTechBalance
            label="VOLUME TOTAL CUMULÉ"
            value={totalVolume}
            unit="KG"
            trendText={`${historyList.length} transaction${historyList.length > 1 ? "s" : ""} validée${historyList.length > 1 ? "s" : ""}`}
            isPositive={true}
          />

          {/* Sélecteur de Vue : Relevé / Calendrier */}
          <View style={styles.filterPillsRow}>
            <FinTechPill
              label="Relevé"
              active={viewMode === "statement"}
              onPress={() => setViewMode("statement")}
            />
            <FinTechPill
              label="Calendrier"
              active={viewMode === "calendar"}
              onPress={() => setViewMode("calendar")}
            />
          </View>

          {/* Vue 1 : Relevé Bancaire d'Activité */}
          {viewMode === "statement" && (
            <View style={styles.statementContainer}>
              {groupedPeriods.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Activity size={24} color={FINTECH_COLORS.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucune transaction d'effort</Text>
                  <Text style={styles.emptySub}>
                    Terminez une séance pour alimenter votre relevé sportif.
                  </Text>
                </View>
              ) : (
                groupedPeriods.map((group) => (
                  <View key={group.title} style={styles.periodGroup}>
                    {/* Header de Période (Mois / Semaine) */}
                    <Text style={styles.periodHeaderTitle}>{group.title}</Text>

                    {/* Liste des transactions de la période */}
                    <View style={styles.transactionsCard}>
                      {group.sessions.map((session, sIdx) => {
                        const isLast = sIdx === group.sessions.length - 1;
                        const durationMin = Math.floor(
                          (session.durationSeconds || 0) / 60
                        );
                        return (
                          <TouchableOpacity
                            key={session.id}
                            activeOpacity={0.7}
                            onPress={() => setSelectedSession(session)}
                            onLongPress={() =>
                              handleDeleteSessionConfirm(session)
                            }
                            style={[
                              styles.transactionRow,
                              !isLast && styles.transactionBorder,
                            ]}
                          >
                            {/* Cercle Icône Relevé */}
                            <View style={styles.transactionIconCircle}>
                              <Dumbbell size={16} color="#FFFFFF" />
                            </View>

                            {/* Titre & Horodatage */}
                            <View style={styles.transactionCenter}>
                              <Text
                                style={styles.transactionTitle}
                                numberOfLines={1}
                              >
                                {session.title}
                              </Text>
                              <Text
                                style={styles.transactionMeta}
                                numberOfLines={1}
                              >
                                {formatRelativeDate(session.startTime)} •{" "}
                                {durationMin} min •{" "}
                                {session.completedSetsCount || 0} séries
                              </Text>
                            </View>

                            {/* Montant / Volume en Vert Néon */}
                            <View style={styles.transactionRight}>
                              <Text style={styles.transactionVolume}>
                                +{" "}
                                {Math.round(
                                  session.totalVolumeKg || 0
                                ).toLocaleString("fr-FR")}{" "}
                                <Text style={styles.transactionUnit}>KG</Text>
                              </Text>
                              <ChevronRight
                                size={13}
                                color={FINTECH_COLORS.textMuted}
                                style={{
                                  alignSelf: "flex-end",
                                  marginTop: 3,
                                }}
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Vue 2 : Calendrier d'Assiduité & Synthèse */}
          {viewMode === "calendar" && (
            <View style={styles.calendarContainer}>
              <CalendarView history={historyList} />
              <View style={{ marginTop: 12 }}>
                <ActivitySummaryCard history={historyList} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modale d'ajout d'une séance passée */}
        <LogPastWorkoutModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
        />

        {/* Modale Relevé Détaillé de la séance */}
        <PastSessionDetailModal
          visible={selectedSession !== null}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: "800",
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  addPastBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderColor: FINTECH_COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  addPastBtnText: {
    color: FINTECH_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  filterPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 14,
  },
  statementContainer: {
    marginTop: 6,
  },
  periodGroup: {
    marginBottom: 20,
  },
  periodHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: FINTECH_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  transactionsCard: {
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FINTECH_COLORS.borderSubtle,
    overflow: "hidden",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  transactionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: FINTECH_COLORS.borderSubtle,
  },
  transactionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FINTECH_COLORS.surfaceActive,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionCenter: {
    flex: 1,
    marginRight: 8,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: FINTECH_COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  transactionMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: FINTECH_COLORS.textMuted,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionVolume: {
    fontSize: 14,
    fontWeight: "800",
    color: FINTECH_COLORS.green,
    letterSpacing: -0.3,
  },
  transactionUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: FINTECH_COLORS.green,
  },
  calendarContainer: {
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: FINTECH_COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: FINTECH_COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: "500",
    color: FINTECH_COLORS.textMuted,
    textAlign: "center",
  },
});
