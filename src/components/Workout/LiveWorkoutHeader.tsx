import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { WorkoutSession } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { Timer, RotateCw, Pause, Play } from "lucide-react-native";

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

const formatDuration = (seconds: number = 0): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

export const LiveWorkoutHeader: React.FC<LiveWorkoutHeaderProps> = ({
  session,
  onTogglePause,
  circuitInfo,
}) => {
  const { theme } = useTheme();

  const [elapsed, setElapsed] = useState<number>(() => {
    if (!session.hasStarted || !session.startTime) return 0;
    if (session.isPaused) return session.durationSeconds || 0;
    return Math.max(0, Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000));
  });

  useEffect(() => {
    if (!session.hasStarted || session.isPaused || !session.startTime) {
      if (session.isPaused) setElapsed(session.durationSeconds || 0);
      return;
    }
    const tick = () => {
      const start = new Date(session.startTime).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.startTime, session.hasStarted, session.isPaused, session.durationSeconds]);

  return (
    <View style={[styles.headerContainer, { backgroundColor: '#141416', borderColor: '#1F1F23' }]}>
      {/* Ligne 1: Télémétrie FinTech (Volume à Gauche, Chrono au Centre, Séries à Droite) */}
      <View style={styles.telemetryRow}>
        {/* Gauche: Volume direct */}
        <View style={styles.colLeft}>
          <Text style={styles.subLabel}>VOLUME DIRECT</Text>
          <Text style={styles.volumeValue}>
            {Math.round(session.totalVolumeKg || 0).toLocaleString('fr-FR')}
            <Text style={styles.unitText}> KG</Text>
          </Text>
        </View>

        {/* Centre: Chrono discret avec pause cliquable */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onTogglePause}
          style={styles.chronoCenter}
        >
          <View style={styles.chronoPill}>
            {session.isPaused ? (
              <Play size={12} color="#FF9500" fill="#FF9500" style={{ marginRight: 4 }} />
            ) : (
              <View style={styles.liveDot} />
            )}
            <Text style={[styles.chronoText, session.isPaused && { color: '#FF9500' }]}>
              {formatDuration(elapsed)}
            </Text>
          </View>
          <Text style={styles.chronoSub}>
            {session.isPaused ? "EN PAUSE" : "CHRONO"}
          </Text>
        </TouchableOpacity>

        {/* Droite: Ratio séries / tours */}
        <View style={styles.colRight}>
          <Text style={styles.subLabel}>SÉRIES</Text>
          <View style={styles.setsPill}>
            <Text style={styles.setsValue}>
              {circuitInfo?.isCircuit
                ? `${circuitInfo.currentRound}/${circuitInfo.totalRounds} trs`
                : `${session.completedSetsCount || 0} / ${session.totalSetsCount || 0}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  chronoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  colRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00C805',
  },
  chronoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C805',
    marginRight: 6,
  },
  chronoText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chronoSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  setsPill: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  setsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
