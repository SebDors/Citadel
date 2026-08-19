import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WorkoutSession } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import {
  Clock,
  Dumbbell,
  CheckCircle,
  RotateCw,
  Timer,
} from "lucide-react-native";

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
  onFinish: () => void;
  onCancel: () => void;
  circuitInfo?: CircuitInfo;
}

export const LiveWorkoutHeader: React.FC<LiveWorkoutHeaderProps> = ({
  session,
  circuitInfo,
}) => {
  const { theme } = useTheme();

  const progressPercent = useMemo(() => {
    if (circuitInfo?.isCircuit) {
      if (circuitInfo.isAmrap) {
        const totalSecs = (circuitInfo.amrapDurationMinutes || 12) * 60;
        const elapsed = totalSecs - (circuitInfo.amrapSecondsLeft || 0);
        return Math.min(
          100,
          Math.max(0, Math.round((elapsed / totalSecs) * 100)),
        );
      }
      return Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (circuitInfo.currentRound / Math.max(1, circuitInfo.totalRounds)) *
              100,
          ),
        ),
      );
    }
    const total = session.totalSetsCount || 1;
    const completed = session.completedSetsCount || 0;
    return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  }, [session, circuitInfo]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formatMinutesSeconds = (totalSeconds: number = 0): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderThirdStatBox = () => {
    if (circuitInfo?.isCircuit) {
      if (circuitInfo.isAmrap) {
        return (
          <View style={styles.statBox}>
            <Timer size={14} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatMinutesSeconds(circuitInfo.amrapSecondsLeft ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Temps restant
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.statBox}>
          <RotateCw size={14} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {circuitInfo.currentRound} / {circuitInfo.totalRounds}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Tours
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statBox}>
        <CheckCircle size={14} color={theme.accent} />
        <Text style={[styles.statValue, { color: theme.text }]}>
          {session.completedSetsCount} / {session.totalSetsCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>
          Séries
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.headerContainer,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBox}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {session.title}
          </Text>
        </View>

        {/* Badge de Progression % dynamique dans le coin supérieur droit */}
        <View
          style={[
            styles.progressBadge,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.progressPercentText, { color: theme.accent }]}>
            {progressPercent}%
          </Text>
          <View style={[styles.miniTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.miniFill,
                {
                  backgroundColor: theme.accent,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {/* Timer */}
        <View style={styles.statBox}>
          <Clock size={14} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatDuration(session.durationSeconds)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Temps
          </Text>
        </View>

        {/* Volume */}
        <View style={styles.statBox}>
          <Dumbbell size={14} color={theme.secondary} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {session.totalVolumeKg} kg
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Volume
          </Text>
        </View>

        {/* 3ème stat: Tours / Temps restant / Séries */}
        {renderThirdStatBox()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 54,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 2,
  },
  miniTrack: {
    width: 44,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniFill: {
    height: "100%",
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});
