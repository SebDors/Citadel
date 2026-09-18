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
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { LogPastWorkoutModal } from "../../src/components/History/LogPastWorkoutModal";
import { PastSessionDetailModal } from "../../src/components/History/PastSessionDetailModal";
import {
  WorkoutSession,
  WorkoutBlock,
  WorkoutSet,
  getSessionBlocks,
  formatCircuitSummary,
} from "../../src/types";
import { Plus } from "lucide-react-native";

const formatDurationShort = (seconds: number = 0): string => {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} MIN`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}H${remMins > 0 ? ` ${remMins}M` : ""}`;
};

export default function HistoryTab() {
  const { data, deleteWorkoutSession } = useWorkout();
  const { theme } = useTheme();
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    null,
  );

  const historyList = useMemo(() => data?.history || [], [data?.history]);

  // Dual Telemetry Calculations (Semaine vs Mois)
  const { weekVolume, monthVolume, monthCount } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Lundi = 0
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let wVol = 0;
    let mVol = 0;
    let mCount = 0;

    historyList.forEach((s) => {
      const sDate = new Date(s.startTime);
      const vol = s.totalVolumeKg || 0;
      if (sDate >= startOfWeek) {
        wVol += vol;
      }
      if (sDate >= startOfMonth) {
        mVol += vol;
        mCount += 1;
      }
    });

    return {
      weekVolume: Math.round(wVol),
      monthVolume: Math.round(mVol),
      monthCount: mCount,
    };
  }, [historyList]);

  const handleDeleteSession = (sessionId: string, sessionTitle: string) => {
    Alert.alert(
      "CONFIRMER LA SUPPRESSION",
      `Supprimer définitivement "${sessionTitle}" du journal ?`,
      [
        { text: "ANNULER", style: "cancel" },
        {
          text: "SUPPRIMER",
          style: "destructive",
          onPress: () => deleteWorkoutSession(sessionId),
        },
      ],
    );
  };

  return (
    <TabSwipeWrapper tabIndex={1}>
      <SafeAreaView
        edges={["left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Éditorial */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.kicker}>ARCHIVES // SÉANCES</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  JOURNAL
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.actionTrigger, { borderColor: theme.border }]}
                onPress={() => setLogModalVisible(true)}
              >
                <Plus size={14} color="#FF2A2A" style={{ marginRight: 6 }} />
                <Text style={[styles.actionTriggerText, { color: theme.text }]}>
                  ÉMARGER
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bandeau Télémétrique Dual (Volume Semaine & Mois) */}
          <View
            style={[
              styles.telemetryBanner,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            <View style={styles.telemetryCol}>
              <Text style={styles.telemetryLabel}>SEMAINE // TONNAGE</Text>
              <Text style={[styles.telemetryValue, { color: theme.text }]}>
                {weekVolume.toLocaleString("fr-FR")}
                <Text style={styles.telemetryUnit}> KG</Text>
              </Text>
            </View>

            <View
              style={[styles.telemetryDivider, { backgroundColor: theme.border }]}
            />

            <View style={styles.telemetryCol}>
              <Text style={styles.telemetryLabel}>MOIS // TONNAGE</Text>
              <Text style={[styles.telemetryValue, { color: theme.text }]}>
                {monthVolume.toLocaleString("fr-FR")}
                <Text style={styles.telemetryUnit}> KG</Text>
              </Text>
            </View>
          </View>

          {/* Section Journal Chronologique Continu */}
          <View style={styles.ribbonSection}>
            <View
              style={[
                styles.ribbonHeaderRow,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={styles.ribbonSectionLabel}>
                FRISE CHRONOLOGIQUE ({historyList.length})
              </Text>
              <Text style={styles.ribbonSectionMeta}>
                {monthCount} SÉANCES CE MOIS
              </Text>
            </View>

            {historyList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  AUCUNE SÉANCE ENREGISTRÉE DANS LE JOURNAL
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setLogModalVisible(true)}
                  style={{ marginTop: 12 }}
                >
                  <Text style={styles.emptyActionText}>
                    [ + ÉMARGER UNE SÉANCE PASSÉE ]
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              historyList.map((session, idx) => {
                const sDate = new Date(session.startTime);
                const dayStr = sDate.getDate().toString().padStart(2, "0");
                const monthStr = sDate
                  .toLocaleDateString("fr-FR", { month: "short" })
                  .replace(".", "")
                  .toUpperCase();
                const timeStr = sDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const blocks = getSessionBlocks(session);
                const blockSummaries: string[] = [];
                blocks.forEach((b: WorkoutBlock) => {
                  if (b.type === "single" && b.exercise.exerciseName) {
                    const setCount = (b.exercise.sets || []).filter(
                      (st: WorkoutSet) => st.completed,
                    ).length;
                    blockSummaries.push(
                      `${b.exercise.exerciseName.toUpperCase()}${setCount > 0 ? ` (${setCount})` : ""}`,
                    );
                  } else if (b.type === "circuit") {
                    blockSummaries.push(formatCircuitSummary(b).toUpperCase());
                  }
                });

                return (
                  <View
                    key={session.id || idx}
                    style={[
                      styles.journalRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    {/* Colonne Date Monumentale Asymétrique */}
                    <View style={styles.dateColumn}>
                      <Text
                        style={[styles.dateMonumental, { color: theme.text }]}
                      >
                        {dayStr}
                      </Text>
                      <Text style={styles.dateMonth}>{monthStr}</Text>
                      <Text style={styles.dateTime}>{timeStr}</Text>
                    </View>

                    {/* Colonne Contenu & Télémétrie */}
                    <View style={styles.contentColumn}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.sessionTitleText,
                            { color: theme.text },
                          ]}
                          numberOfLines={1}
                        >
                          {session.title?.toUpperCase() || "SÉANCE LIBRE"}
                        </Text>
                      </View>

                      {/* Métriques clés en ligne */}
                      <View style={styles.metricsRow}>
                        <Text style={styles.metricMono}>
                          {formatDurationShort(session.durationSeconds)}
                        </Text>
                        <Text style={styles.metricSep}>//</Text>
                        <Text style={styles.metricMono}>
                          {Math.round(
                            session.totalVolumeKg || 0,
                          ).toLocaleString("fr-FR")}{" "}
                          KG
                        </Text>
                        <Text style={styles.metricSep}>//</Text>
                        <Text style={styles.metricMono}>
                          {blocks.length} EXOS
                        </Text>
                      </View>

                      {/* Sommaire des exercices */}
                      {blockSummaries.length > 0 && (
                        <Text
                          style={styles.exSummaryText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {blockSummaries.join(" · ")}
                        </Text>
                      )}

                      {/* Liens d'actions discrets */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setSelectedSession(session)}
                          style={styles.actionBtn}
                        >
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: theme.text },
                            ]}
                          >
                            DÉTAIL //
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            handleDeleteSession(session.id, session.title)
                          }
                          style={[styles.actionBtn, { marginLeft: 16 }]}
                        >
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: "#FF2A2A" },
                            ]}
                          >
                            SUPPRIMER
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Modale d'émargement manuel d'une séance passée */}
        <LogPastWorkoutModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
        />

        {/* Modale d'inspection de détail de séance */}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  kicker: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "700",
    color: "#737373",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontFamily: "monospace",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  actionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionTriggerText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  telemetryBanner: {
    flexDirection: "row",
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  telemetryCol: {
    flex: 1,
  },
  telemetryLabel: {
    fontFamily: "monospace",
    fontSize: 9,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 4,
  },
  telemetryValue: {
    fontFamily: "monospace",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  telemetryUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF2A2A",
  },
  telemetryDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  ribbonSection: {
    marginBottom: 20,
  },
  ribbonHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  ribbonSectionLabel: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "800",
    color: "#737373",
    letterSpacing: 1.5,
  },
  ribbonSectionMeta: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "700",
    color: "#FF2A2A",
    letterSpacing: 0.5,
  },
  journalRow: {
    flexDirection: "row",
    paddingVertical: 18,
    borderBottomWidth: 0.5,
  },
  dateColumn: {
    width: 64,
    paddingRight: 12,
    borderRightWidth: 0.5,
    borderRightColor: "#262626",
    marginRight: 16,
    alignItems: "flex-start",
  },
  dateMonumental: {
    fontFamily: "monospace",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
    letterSpacing: -1,
  },
  dateMonth: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    color: "#FF2A2A",
    letterSpacing: 1,
    marginTop: 2,
  },
  dateTime: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#737373",
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sessionTitleText: {
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metricMono: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "700",
    color: "#737373",
  },
  metricSep: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#404040",
    marginHorizontal: 6,
  },
  exSummaryText: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#737373",
    lineHeight: 14,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionBtnText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#737373",
    letterSpacing: 1,
    textAlign: "center",
  },
  emptyActionText: {
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "800",
    color: "#FF2A2A",
    letterSpacing: 1,
  },
});
