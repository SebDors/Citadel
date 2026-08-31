import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WorkoutSession } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { CheckCircle, RotateCw, Timer } from "lucide-react-native";

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
}) => {
  const { theme } = useTheme();

  const formatMinutesSeconds = (totalSeconds: number = 0): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderSetsBadge = () => {
    if (circuitInfo?.isCircuit) {
      if (circuitInfo.isAmrap) {
        return (
          <View
            style={[
              styles.setsPillBadge,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Timer size={13} color={theme.accent} />
            <Text style={[styles.setsPillText, { color: theme.text }]}>
              {formatMinutesSeconds(circuitInfo.amrapSecondsLeft ?? 0)}
            </Text>
          </View>
        );
      }
      return (
        <View
          style={[
            styles.setsPillBadge,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <RotateCw size={13} color={theme.accent} />
          <Text style={[styles.setsPillText, { color: theme.text }]}>
            {circuitInfo.currentRound}/{circuitInfo.totalRounds} tours
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.setsPillBadge,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <CheckCircle size={13} color={theme.accent} />
        <Text style={[styles.setsPillText, { color: theme.text }]}>
          {session.completedSetsCount || 0}/{session.totalSetsCount || 0} séries
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
      <View style={styles.singleRow}>
        {/* Titre de la séance à Gauche */}
        <View style={styles.titleBox}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {session.title}
          </Text>
        </View>

        {/* Badge pilule des séries avec mention 'séries' à Droite */}
        <View style={styles.rightGroup}>
          {renderSetsBadge()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 0,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  singleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBox: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    textAlign: "left",
  },
  rightGroup: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  setsPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  setsPillText: {
    fontSize: 11.5,
    fontWeight: "800",
  },
});
