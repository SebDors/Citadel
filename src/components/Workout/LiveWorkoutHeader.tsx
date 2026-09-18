import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { WorkoutSession } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { Pause, Play } from "lucide-react-native";
import {
  SWISS_COLORS,
  SWISS_TYPOGRAPHY,
  SWISS_GRID,
} from "../../constants/swissTheme";
import { SwissDivider } from "../Swiss";

export interface CircuitInfo {
  isCircuit: boolean;
  isAmrap: boolean;
  currentRound: number;
  totalRounds: number;
  amrapSecondsLeft?: number;
  amrapDurationMinutes?: number;
}

interface LiveWorkoutHeaderProps {
  session: WorkoutSession;
  onFinish?: () => void;
  onCancel?: () => void;
  onTogglePause?: () => void;
  circuitInfo?: CircuitInfo;
}

export const LiveWorkoutHeader: React.FC<LiveWorkoutHeaderProps> = ({
  session,
  circuitInfo,
  onTogglePause,
}) => {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  const [elapsed, setElapsed] = useState<number>(() => {
    if (!session.hasStarted || !session.startTime) return 0;
    if (session.isPaused) return session.durationSeconds || 0;
    return Math.max(0, Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000));
  });

  useEffect(() => {
    if (!session.hasStarted || session.isPaused) {
      setElapsed(session.durationSeconds || 0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(session.startTime).getTime();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.hasStarted, session.startTime, session.isPaused, session.durationSeconds]);

  const formatTimer = (totalSecs: number = 0): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const volumeStr = session.totalVolumeKg
    ? session.totalVolumeKg.toLocaleString('fr-FR')
    : '0';

  const completedSets = session.completedSetsCount || 0;
  const totalSets = session.totalSetsCount || 0;

  return (
    <View style={styles.container}>
      {/* 1. LIGNE SUPÉRIEURE DE TITRE // STATUT */}
      <View style={styles.topStatusRow}>
        <Text style={[styles.sessionTitle, { color: palette.text }]}>
          {session.title.toUpperCase()}
        </Text>
        {session.isPaused ? (
          <View style={styles.pauseIndicator}>
            <Text style={[styles.pauseText, { color: palette.accent }]}>
              EN PAUSE
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. CHRONOMÈTRE MONUMENTAL (48px - 56px) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onTogglePause}
        style={styles.timerRow}
      >
        <Text
          style={[
            styles.monumentalTimer,
            { color: palette.text, fontFamily: SWISS_TYPOGRAPHY.fonts.sans },
          ]}
        >
          {formatTimer(elapsed)}
        </Text>
        <View style={styles.pauseIconBox}>
          {session.isPaused ? (
            <Play size={18} color={palette.accent} />
          ) : (
            <Pause size={18} color={palette.textDimmed} />
          )}
        </View>
      </TouchableOpacity>

      <SwissDivider subtle style={{ marginVertical: 10 }} />

      {/* 3. TÉLÉMÉTRIE DUAL (VOLUME & SÉRIES) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: palette.textMuted }]}>
            VOLUME CUMULÉ
          </Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>
            {volumeStr}
            <Text style={[styles.metricUnit, { color: palette.accent }]}> KG</Text>
          </Text>
        </View>

        <SwissDivider vertical subtle style={{ height: 28 }} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: palette.textMuted }]}>
            {circuitInfo?.isCircuit ? 'TOURS EXÉCUTÉS' : 'PROGRESSION SÉRIES'}
          </Text>
          <Text style={[styles.metricValue, { color: palette.text }]}>
            {circuitInfo?.isCircuit
              ? `${circuitInfo.currentRound} / ${circuitInfo.totalRounds}`
              : `${completedSets} / ${totalSets}`}
          </Text>
        </View>
      </View>

      <SwissDivider subtle style={{ marginTop: 10 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 4,
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: SWISS_TYPOGRAPHY.label,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pauseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  monumentalTimer: {
    fontSize: SWISS_TYPOGRAPHY.display,
    fontWeight: '900',
    letterSpacing: SWISS_TYPOGRAPHY.letterSpacingDisplay,
    lineHeight: 62,
  },
  pauseIconBox: {
    paddingBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '800',
  },
});
