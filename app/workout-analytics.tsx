import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import { useWorkout } from "../src/context/WorkoutContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Star,
  ChevronRight,
  Award,
  Repeat,
  Play,
  Edit3,
} from "lucide-react-native";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, G } from "react-native-svg";
import {
  getTemplateBlocks,
  formatCircuitSummary,
  calculateEstimatedWorkoutMinutes,
  getSessionBlocks,
  WorkoutBlock,
  WorkoutExercise,
  WorkoutSession,
} from "../src/types";
import ExerciseDetailModal from "../src/components/Analytics/ExerciseDetailModal";
import { PastSessionDetailModal } from "../src/components/History/PastSessionDetailModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function WorkoutAnalyticsScreen() {
  const { theme } = useTheme();
  const { data, startWorkout } = useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const templateId = (params.id as string) || "tpl_upper_b";
  const template =
    data?.templates.find((t) => t.id === templateId) || data?.templates[0];

  const [activeMetricTab, setActiveMetricTab] = useState<"volume" | "duree" | "reps">("volume");
  const [activeTimeFilter, setActiveTimeFilter] = useState<"30J" | "3M" | "6M" | "1A">("30J");

  // Modals state
  const [selectedExercise, setSelectedExercise] = useState<{ name: string; primaryMuscle?: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [activeDataPointIndex, setActiveDataPointIndex] = useState<number | null>(null);

  // 1. Extraction des Blocs & Exercices d'un Template
  const blocks: WorkoutBlock[] = useMemo(() => {
    return template ? getTemplateBlocks(template) : [];
  }, [template]);

  // Récupération de l'historique associé à ce template (trié par date décroissante)
  const allHistorySessions: WorkoutSession[] = useMemo(() => {
    if (!data?.history || !template) return [];
    return data.history
      .filter(
        (s) =>
          s.status === "completed" &&
          (s.templateId === template.id ||
            s.title.trim().toLowerCase() === template.title.trim().toLowerCase()),
      )
      .sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
  }, [data?.history, template]);

  const lastCompletedSession = allHistorySessions[0] || null;

  // Filtrage temporel pour le graphique (tri chronologique pour le SVG)
  const chartSessions = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (activeTimeFilter === "30J") cutoff.setDate(now.getDate() - 30);
    else if (activeTimeFilter === "3M") cutoff.setMonth(now.getMonth() - 3);
    else if (activeTimeFilter === "6M") cutoff.setMonth(now.getMonth() - 6);
    else if (activeTimeFilter === "1A") cutoff.setFullYear(now.getFullYear() - 1);

    const filtered = allHistorySessions.filter(s => new Date(s.startTime) >= cutoff);
    return filtered.reverse(); // Plus ancien au plus récent
  }, [allHistorySessions, activeTimeFilter]);

  const chartData = useMemo(() => {
    return chartSessions.map(session => {
      let val = 0;
      if (activeMetricTab === "volume") {
        val = session.totalVolumeKg || 0;
        if (val === 0 && session.exercises) {
          session.exercises.forEach(ex => {
            (ex.sets || []).forEach(set => {
              if (set.completed) val += (set.weightKg || 0) * (set.reps || 0);
            });
          });
        }
      } else if (activeMetricTab === "duree") {
        val = (session.durationSeconds || 0) / 60; // en minutes
      } else if (activeMetricTab === "reps") {
        if (session.exercises) {
          session.exercises.forEach(ex => {
            (ex.sets || []).forEach(set => {
              if (set.completed) val += set.reps || 0;
            });
          });
        }
      }
      return { val, date: new Date(session.startTime) };
    });
  }, [chartSessions, activeMetricTab]);

  const chartLayout = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const yAxisWidth = 45;
    const paddingLeft = 15;
    const paddingRight = 15;
    const cardPadding = 32; // 16 left + 16 right
    const containerPadding = 32; // 16 left + 16 right
    
    const svgWidth = SCREEN_WIDTH - containerPadding - cardPadding - yAxisWidth;
    const drawableWidth = Math.max(10, svgWidth - paddingLeft - paddingRight);

    const height = 130;
    const topPadding = 15;
    const bottomPadding = 15;
    const drawableHeight = height - topPadding - bottomPadding;

    const maxVal = Math.max(...chartData.map((d) => d.val), 1);
    const minVal = Math.min(...chartData.map((d) => d.val), 0);
    const range = maxVal - minVal || 1;

    const points = chartData.map((d, i) => {
      const x =
        chartData.length > 1
          ? paddingLeft + (i / (chartData.length - 1)) * drawableWidth
          : svgWidth / 2;
      const y =
        topPadding + (1 - (d.val - minVal) / range) * drawableHeight;
      return { x, y, val: d.val, date: d.date };
    });

    const pathData = points.reduce((acc, pt, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
    }, '');

    const areaPath = `${pathData} L ${points[points.length - 1]?.x.toFixed(1)} ${height - bottomPadding} L ${points[0]?.x.toFixed(1)} ${height - bottomPadding} Z`;

    return { points, pathData, areaPath, maxVal, minVal, width: svgWidth, height, yAxisWidth };
  }, [chartData]);


  // Calculs Dynamiques des Métriques ("Metric Callout")
  const { actualVolume, actualDurationSec, actualReps } = useMemo(() => {
    if (lastCompletedSession) {
      let vol = lastCompletedSession.totalVolumeKg || 0;
      if (vol === 0 && lastCompletedSession.exercises) {
        lastCompletedSession.exercises.forEach((ex) => {
          (ex.sets || []).forEach((set) => {
            if (set.completed) {
              vol += (set.weightKg || 0) * (set.reps || 0);
            }
          });
        });
      }

      const dur = lastCompletedSession.durationSeconds || 0;

      let reps = 0;
      if (lastCompletedSession.exercises && lastCompletedSession.exercises.length > 0) {
        lastCompletedSession.exercises.forEach((ex) => {
          (ex.sets || []).forEach((set) => {
            if (set.completed) reps += set.reps || 0;
          });
        });
      } else {
        const sessBlocks = getSessionBlocks(lastCompletedSession);
        sessBlocks.forEach((b) => {
          if (b.type === "single") {
            (b.exercise.sets || []).forEach((set) => {
              if (set.completed) reps += set.reps || 0;
            });
          } else if (b.type === "circuit") {
            const rounds = b.rounds || 1;
            b.exercises.forEach((item) => {
              if (item.targetType === "reps") reps += (item.targetValue || 0) * rounds;
            });
          }
        });
      }

      return { actualVolume: vol, actualDurationSec: dur, actualReps: reps };
    } else {
      let vol = 0;
      let reps = 0;

      blocks.forEach((b) => {
        if (b.type === "single") {
          (b.exercise.sets || []).forEach((set) => {
            vol += (set.weightKg || 0) * (set.reps || 0);
            reps += set.reps || 0;
          });
        } else if (b.type === "circuit") {
          const rounds = b.rounds || 1;
          b.exercises.forEach((item) => {
            if (item.targetType === "reps") reps += (item.targetValue || 0) * rounds;
          });
        }
      });

      const estMins = calculateEstimatedWorkoutMinutes(blocks);
      return { actualVolume: vol, actualDurationSec: estMins * 60, actualReps: reps };
    }
  }, [lastCompletedSession, blocks]);

  const metricCalloutValue = useMemo(() => {
    if (activeMetricTab === "volume") {
      return actualVolume >= 1000 ? `${(actualVolume / 1000).toFixed(1).replace(".", ",")}k kg` : `${actualVolume} kg`;
    }
    if (activeMetricTab === "duree") {
      const hours = Math.floor(actualDurationSec / 3600);
      const mins = Math.round((actualDurationSec % 3600) / 60);
      return hours > 0 ? `${hours} h ${mins < 10 ? "0" : ""}${mins}` : `${mins} min`;
    }
    return `${actualReps} reps`;
  }, [activeMetricTab, actualVolume, actualDurationSec, actualReps]);

  // Extraction de l'ensemble des exercices pour les PRs
  const allExercises = useMemo(() => {
    const list: Array<{
      id: string;
      exerciseName: string;
      primaryMuscle?: string;
      isCircuit: boolean;
      targetText?: string;
      singleExercise?: WorkoutExercise;
    }> = [];

    blocks.forEach((b) => {
      if (b.type === "single") {
        list.push({
          id: b.exercise.id || b.exercise.exerciseId,
          exerciseName: b.exercise.exerciseName,
          primaryMuscle: b.exercise.primaryMuscle,
          isCircuit: false,
          singleExercise: b.exercise,
        });
      } else if (b.type === "circuit") {
        b.exercises.forEach((item) => {
          list.push({
            id: item.id,
            exerciseName: item.exerciseName,
            primaryMuscle: item.primaryMuscle,
            isCircuit: true,
            targetText: `${item.targetValue} ${item.targetType === "time" ? "s" : "reps"}`,
          });
        });
      }
    });
    return list;
  }, [blocks]);

  const exercisePRs = useMemo(() => {
    return allExercises.map((exItem) => {
      let bestWeight = 0;
      let bestReps = 0;
      let lastDateFormatted = "";

      if (allHistorySessions.length > 0) {
        for (const session of allHistorySessions) {
          const sessExercises = session.exercises || [];
          const matchEx = sessExercises.find(
            (e) => e.exerciseName.trim().toLowerCase() === exItem.exerciseName.trim().toLowerCase(),
          );
          if (matchEx) {
            for (const s of matchEx.sets || []) {
              if (s.completed) {
                const w = s.weightKg || 0;
                const r = s.reps || 0;
                if (w > bestWeight || (w === bestWeight && r > bestReps)) {
                  bestWeight = w;
                  bestReps = r;
                  lastDateFormatted = new Date(session.startTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase();
                }
              }
            }
          }
        }
      }

      if (bestWeight > 0 || bestReps > 0) {
        const e1RM = Math.round(bestWeight * (1 + bestReps / 30));
        return {
          name: exItem.exerciseName,
          dateText: lastDateFormatted || "RÉCENT",
          valueText: bestWeight > 0 ? `${e1RM} kg e1RM` : `${bestReps} reps`,
          subText: bestWeight > 0 ? `${bestWeight} kg × ${bestReps}` : "Poids de corps",
        };
      }

      if (exItem.singleExercise && exItem.singleExercise.sets?.length > 0) {
        const firstSet = exItem.singleExercise.sets[0];
        const w = firstSet.weightKg || 0;
        const r = firstSet.reps || 10;
        if (w > 0) {
          const e1RM = Math.round(w * (1 + r / 30));
          return { name: exItem.exerciseName, dateText: "OBJECTIF", valueText: `${e1RM} kg e1RM`, subText: `${w} kg × ${r}` };
        }
        return { name: exItem.exerciseName, dateText: "OBJECTIF", valueText: `${r} reps`, subText: "Poids de corps" };
      }

      return { name: exItem.exerciseName, dateText: "OBJECTIF", valueText: exItem.targetText || "Circuit", subText: "Objectif circuit" };
    });
  }, [allExercises, allHistorySessions]);

  const handleStartWorkout = () => {
    if (template) {
      startWorkout(template);
    }
    router.push('/live-workout');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Navigation */}
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top, Platform.OS === "android" ? RNStatusBar.currentHeight || 24 : 16) + 8,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.titleBox}>
          <Text style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
            {template?.title || "Séance"}
          </Text>
          <Text style={[styles.topSub, { color: theme.textMuted }]}>
            {allHistorySessions.length} entraînement{allHistorySessions.length > 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerActionBtn, { backgroundColor: theme.surface }]}
            onPress={() => router.push({ pathname: '/template-editor', params: { id: template?.id } })}
          >
            <Edit3 size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerActionBtn, { backgroundColor: theme.accent }]}
            onPress={handleStartWorkout}
          >
            <Play size={18} color="#fff" fill="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Metric Callout */}
        <View style={styles.metricCallout}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {activeMetricTab.toUpperCase()} · {lastCompletedSession ? "DERNIER" : "ESTIMÉ"}
          </Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {metricCalloutValue}
          </Text>
        </View>

        {/* Metric Selector Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(["volume", "duree", "reps"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeMetricTab === tab && { backgroundColor: theme.cardBg }]}
              onPress={() => {
                setActiveMetricTab(tab);
                setActiveDataPointIndex(null);
              }}
            >
              <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === tab && { fontWeight: "900" }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Canvas Card */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border, overflow: 'hidden' }]}>
          <View style={styles.chartArea}>
            {chartLayout ? (
              <>
                <View style={[styles.chartYLabels, { width: chartLayout.yAxisWidth }]}>
                  <Text style={[styles.chartYText, { color: theme.textMuted }]}>{chartLayout.maxVal.toFixed(1)}</Text>
                  <Text style={[styles.chartYText, { color: theme.textMuted }]}>{((chartLayout.maxVal + chartLayout.minVal)/2).toFixed(1)}</Text>
                  <Text style={[styles.chartYText, { color: theme.textMuted }]}>{chartLayout.minVal.toFixed(1)}</Text>
                </View>
                
                <View style={{ width: chartLayout.width, height: chartLayout.height, marginLeft: chartLayout.yAxisWidth, position: 'relative' }}>
                  <Svg width={chartLayout.width} height={chartLayout.height}>
                    <Defs>
                      <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={theme.accent} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    
                    <Path d={chartLayout.areaPath} fill="url(#gradient)" />
                    <Path d={chartLayout.pathData} fill="none" stroke={theme.accent} strokeWidth="3" strokeLinejoin="round" />
                    
                    {chartLayout.points.map((pt, i) => (
                      <G key={i}>
                        {activeDataPointIndex === i && (
                          <Circle
                            cx={pt.x}
                            cy={pt.y}
                            r={10}
                            fill={theme.primary + '33'}
                          />
                        )}
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r={activeDataPointIndex === i ? 6 : 4}
                          fill={activeDataPointIndex === i ? theme.primary : theme.accent}
                          stroke={theme.cardBg}
                          strokeWidth={activeDataPointIndex === i ? 3 : 2}
                        />
                      </G>
                    ))}
                  </Svg>

                  {/* Overlay React Native d'interactivité 100% Cliquable */}
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                    {chartLayout.points.map((pt, i) => (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.7}
                        style={{
                          position: 'absolute',
                          left: pt.x - 22,
                          top: pt.y - 22,
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          zIndex: 20,
                        }}
                        onPress={() => setActiveDataPointIndex(i)}
                      />
                    ))}
                  </View>

                  {/* Tooltip */}
                  {activeDataPointIndex !== null && chartLayout.points[activeDataPointIndex] && (
                    <View 
                      pointerEvents="none"
                      style={[
                        styles.tooltip, 
                        { 
                          backgroundColor: theme.text,
                          left: Math.min(Math.max(chartLayout.points[activeDataPointIndex].x - 40, 0), chartLayout.width - 80),
                          top: Math.max(chartLayout.points[activeDataPointIndex].y - 45, -10),
                          zIndex: 30,
                        }
                      ]}
                    >
                      <Text style={[styles.tooltipVal, { color: theme.background }]}>
                        {chartLayout.points[activeDataPointIndex].val.toFixed(1)}
                      </Text>
                      <Text style={[styles.tooltipDate, { color: theme.background }]}>
                        {chartLayout.points[activeDataPointIndex].date.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' })}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={{ color: theme.textMuted }}>Pas assez de données</Text>
              </View>
            )}
          </View>

          {/* Time Filter Controls */}
          <View style={styles.filtersRow}>
            {(["30J", "3M", "6M", "1A"] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: activeTimeFilter === filter ? theme.surface : "transparent",
                  },
                ]}
                onPress={() => {
                  setActiveTimeFilter(filter);
                  setActiveDataPointIndex(null);
                }}
              >
                <Text style={[styles.filterText, { color: theme.text }]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Records / PRs Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>PRs DANS CETTE SÉANCE</Text>
          <Text style={[styles.recordsBadgeText, { color: theme.accent }]}>Records</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.prSummaryRow}>
            <Award size={18} color={theme.accent} />
            <Text style={[styles.prSummaryText, { color: theme.text }]}>
              {allExercises.length} record{allExercises.length > 1 ? "s" : ""} dans {template?.title || "la séance"}
            </Text>
          </View>

          {exercisePRs.map((pr, idx) => (
            <View key={idx} style={[styles.prRow, { borderTopColor: theme.border }]}>
              <View style={styles.prLeft}>
                <View style={[styles.starCircle, { backgroundColor: theme.surface }]}>
                  <Star size={12} color={theme.accent} fill={theme.accent} />
                </View>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={[styles.prExName, { color: theme.text }]} numberOfLines={1}>{pr.name}</Text>
                  <Text style={[styles.prExDate, { color: theme.textMuted }]}>{pr.dateText}</Text>
                </View>
              </View>
              <View style={styles.prRight}>
                <Text style={[styles.prValue, { color: theme.text }]}>{pr.valueText}</Text>
                <Text style={[styles.prSub, { color: theme.textMuted }]}>{pr.subText}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Exercices de la Séance Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          EXERCICES DE LA SÉANCE
        </Text>

        <View style={styles.blocksContainer}>
          {blocks.map((block, idx) => {
            if (block.type === "single") {
              return (
                <TouchableOpacity
                  key={block.id || idx}
                  style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 10 }]}
                  onPress={() => setSelectedExercise({ name: block.exercise.exerciseName, primaryMuscle: block.exercise.primaryMuscle })}
                >
                  <View style={styles.exLinkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exLinkName, { color: theme.text }]}>{block.exercise.exerciseName}</Text>
                      {block.exercise.primaryMuscle ? (
                        <Text style={[styles.exSubText, { color: theme.textMuted }]}>{block.exercise.primaryMuscle}</Text>
                      ) : null}
                    </View>
                    <ChevronRight size={18} color={theme.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            } else if (block.type === "circuit") {
              return (
                <View key={block.id || idx} style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 10, paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }]}>
                  <View style={[styles.circuitHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={styles.circuitBadge}>
                      <Repeat size={14} color={theme.accent} style={{ marginRight: 6 }} />
                      <Text style={[styles.circuitBadgeText, { color: theme.accent }]}>{formatCircuitSummary(block)}</Text>
                    </View>
                  </View>
                  {block.exercises.map((item, itemIdx) => (
                    <TouchableOpacity
                      key={item.id || itemIdx}
                      style={[styles.circuitItemRow, itemIdx > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                      onPress={() => setSelectedExercise({ name: item.exerciseName, primaryMuscle: item.primaryMuscle })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.circuitItemName, { color: theme.text }]}>{item.exerciseName}</Text>
                        {item.primaryMuscle ? (
                          <Text style={[styles.circuitItemMuscle, { color: theme.textMuted }]}>{item.primaryMuscle}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.targetBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.targetText, { color: theme.accent }]}>
                          {item.targetValue} {item.targetType === "time" ? "s" : "reps"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            }
            return null;
          })}
        </View>

        {/* Historique Passé */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          HISTORIQUE DES SÉANCES
        </Text>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 30 }]}>
          {allHistorySessions.length > 0 ? (
            allHistorySessions.map((sess, idx) => {
              const formattedDate = new Date(sess.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
              const hours = Math.floor((sess.durationSeconds || 0) / 3600);
              const mins = Math.round(((sess.durationSeconds || 0) % 3600) / 60);
              const durStr = hours > 0 ? `${hours} h ${mins < 10 ? "0" : ""}${mins}` : `${mins} min`;

              return (
                <TouchableOpacity
                  key={sess.id || idx}
                  style={[styles.historyLinkRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                  onPress={() => setSelectedSession(sess)}
                >
                  <Text style={[styles.historyDate, { color: theme.text }]}>{formattedDate}</Text>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyVol, { color: theme.text }]}>
                      {sess.totalVolumeKg ? `${sess.totalVolumeKg} kg` : durStr}
                    </Text>
                    <Text style={[styles.historyDur, { color: theme.textMuted, marginLeft: 10 }]}>{durStr}</Text>
                    <ChevronRight size={16} color={theme.textMuted} style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: "center" }}>
                Aucune séance historique enregistrée
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {selectedExercise && (
        <ExerciseDetailModal
          visible={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          exerciseName={selectedExercise.name}
          primaryMuscle={selectedExercise.primaryMuscle}
          history={allHistorySessions}
        />
      )}

      {selectedSession && (
        <PastSessionDetailModal
          visible={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  backButton: { padding: 8, marginRight: 8 },
  titleBox: { flex: 1 },
  topTitle: { fontSize: 18, fontWeight: "900" },
  topSub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16 },
  metricCallout: { marginTop: 8, marginBottom: 12 },
  metricLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  metricValue: { fontSize: 34, fontWeight: "900", marginTop: 2 },
  tabsRow: { flexDirection: "row", padding: 3, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9 },
  tabText: { fontSize: 13, fontWeight: "600" },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  chartArea: { height: 140, flexDirection: 'row', position: 'relative' },
  chartYLabels: { justifyContent: 'space-between', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  chartYText: { fontSize: 10 },
  emptyChart: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tooltip: { position: 'absolute', padding: 6, borderRadius: 6, alignItems: 'center', zIndex: 10 },
  tooltipVal: { fontSize: 12, fontWeight: 'bold' },
  tooltipDate: { fontSize: 10, marginTop: 2 },
  filtersRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginHorizontal: 4 },
  filterText: { fontSize: 11, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  recordsBadgeText: { fontSize: 12, fontWeight: "700" },
  cardBox: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  blocksContainer: { marginBottom: 8 },
  circuitHeader: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1 },
  circuitBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  circuitBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  circuitItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14 },
  circuitItemName: { fontSize: 14, fontWeight: "700" },
  circuitItemMuscle: { fontSize: 11, marginTop: 2 },
  targetBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  targetText: { fontSize: 12, fontWeight: "800" },
  prSummaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  prSummaryText: { fontSize: 14, fontWeight: "700", marginLeft: 8 },
  prRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1 },
  prLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  starCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  prExName: { fontSize: 14, fontWeight: "700" },
  prExDate: { fontSize: 10, fontWeight: "600" },
  prRight: { alignItems: "flex-end", marginLeft: 8 },
  prValue: { fontSize: 13, fontWeight: "800" },
  prSub: { fontSize: 11 },
  exLinkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  exLinkName: { fontSize: 14, fontWeight: "700" },
  exSubText: { fontSize: 11, marginTop: 2 },
  historyLinkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  historyDate: { fontSize: 14, fontWeight: "700" },
  historyRight: { flexDirection: "row", alignItems: "center" },
  historyVol: { fontSize: 13, fontWeight: "800" },
  historyDur: { fontSize: 12 },
});
