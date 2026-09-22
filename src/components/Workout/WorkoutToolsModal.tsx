import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { X, Dumbbell, Calculator, Scale, ChevronRight, Info } from 'lucide-react-native';

interface WorkoutToolsModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
}

type ToolTab = 'plates' | 'oneRM';

interface BarOption {
  label: string;
  weight: number;
}

const BAR_OPTIONS: BarOption[] = [
  { label: 'Olympique (20 kg)', weight: 20 },
  { label: 'Féminine (15 kg)', weight: 15 },
  { label: 'EZ / Courte (10 kg)', weight: 10 },
  { label: 'Smith Guidée (7 kg)', weight: 7 },
  { label: 'Sans barre (0 kg)', weight: 0 },
];

const AVAILABLE_PLATES = [0.5, 1.25, 2.5, 5, 10, 15, 20, 25];

const PLATE_COLORS: Record<number, { bg: string; text: string; height: number }> = {
  25: { bg: '#D32F2F', text: '#FFFFFF', height: 68 },
  20: { bg: '#1976D2', text: '#FFFFFF', height: 64 },
  15: { bg: '#FBC02D', text: '#212121', height: 56 },
  10: { bg: '#388E3C', text: '#FFFFFF', height: 48 },
  5:  { bg: '#E0E0E0', text: '#212121', height: 40 },
  2.5: { bg: '#424242', text: '#FFFFFF', height: 32 },
  1.25: { bg: '#90A4AE', text: '#212121', height: 26 },
  0.5:  { bg: '#CFD8DC', text: '#212121', height: 22 },
};

export const WorkoutToolsModal: React.FC<WorkoutToolsModalProps> = ({
  visible,
  onClose,
  initialWeight = 80,
}) => {
  const { theme, isDark } = useTheme();
  const { data } = useWorkout();
  const [activeTab, setActiveTab] = useState<ToolTab>('plates');

  // État Calculateur de Disques
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [selectedBar, setSelectedBar] = useState<number>(20);
  const [plateMode, setPlateMode] = useState<'all' | 'small'>('all');

  // Disques disponibles configurés par l'utilisateur dans les paramètres de la salle
  const activeAvailablePlates = useMemo(() => {
    const gymPlates = data?.profile?.availablePlates || AVAILABLE_PLATES;
    let list = AVAILABLE_PLATES.filter((p) => gymPlates.includes(p));
    if (plateMode === 'small') {
      list = list.filter((p) => p <= 10);
    }
    return list.sort((a, b) => b - a);
  }, [data?.profile?.availablePlates, plateMode]);

  // État Calculateur 1RM
  const [rmWeight, setRmWeight] = useState<number>(80);
  const [rmReps, setRmReps] = useState<number>(5);

  // ---------------- Calcul des Disques ----------------
  const plateCalculation = useMemo(() => {
    if (targetWeight <= selectedBar) {
      return {
        perSideWeight: 0,
        plates: [] as { weight: number; count: number }[],
        visualPlates: [] as number[],
        totalLoaded: selectedBar,
        error: targetWeight < selectedBar ? 'Poids inférieur au poids de la barre' : null,
      };
    }

    const weightNeededPerSide = (targetWeight - selectedBar) / 2;
    let remaining = weightNeededPerSide;
    const platesMap: { weight: number; count: number }[] = [];
    const visualPlates: number[] = [];

    for (const plate of activeAvailablePlates) {
      if (remaining >= plate) {
        const count = Math.floor(remaining / plate);
        if (count > 0) {
          platesMap.push({ weight: plate, count });
          for (let i = 0; i < count; i++) {
            visualPlates.push(plate);
          }
          remaining = Math.round((remaining - count * plate) * 100) / 100;
        }
      }
    }

    const loadedPerSide = weightNeededPerSide - remaining;
    const totalLoaded = selectedBar + loadedPerSide * 2;

    return {
      perSideWeight: weightNeededPerSide,
      plates: platesMap,
      visualPlates,
      totalLoaded,
      remainder: remaining > 0 ? remaining : 0,
      error: null,
    };
  }, [targetWeight, selectedBar, activeAvailablePlates]);

  // ---------------- Calcul 1RM & Pourcentages ----------------
  const oneRMCalculations = useMemo(() => {
    if (rmWeight <= 0 || rmReps <= 0) {
      return { e1RM: 0, percentages: [] };
    }

    // Formule Epley : Poids * (1 + Reps / 30)
    const epley = rmReps === 1 ? rmWeight : rmWeight * (1 + rmReps / 30);
    // Formule Brzycki : Poids * (36 / (37 - Reps))
    const brzycki = rmReps === 1 ? rmWeight : rmReps < 37 ? rmWeight * (36 / (37 - rmReps)) : epley;

    const e1RM = Math.round((epley + brzycki) / 2);

    const percentages = [
      { pct: 100, reps: '1 rep', weight: e1RM },
      { pct: 95, reps: '~2 reps', weight: Math.round(e1RM * 0.95 * 2) / 2 },
      { pct: 90, reps: '~3-4 reps', weight: Math.round(e1RM * 0.90 * 2) / 2 },
      { pct: 85, reps: '~5-6 reps', weight: Math.round(e1RM * 0.85 * 2) / 2 },
      { pct: 80, reps: '~7-8 reps', weight: Math.round(e1RM * 0.80 * 2) / 2 },
      { pct: 75, reps: '~9-10 reps', weight: Math.round(e1RM * 0.75 * 2) / 2 },
      { pct: 70, reps: '~11-12 reps', weight: Math.round(e1RM * 0.70 * 2) / 2 },
      { pct: 65, reps: '~15 reps', weight: Math.round(e1RM * 0.65 * 2) / 2 },
      { pct: 60, reps: '~20 reps', weight: Math.round(e1RM * 0.60 * 2) / 2 },
    ];

    return { e1RM, percentages };
  }, [rmWeight, rmReps]);

  const adjustTargetWeight = (delta: number) => {
    setTargetWeight((prev) => Math.max(0, Math.round((prev + delta) * 2) / 2));
  };

  const adjustRmWeight = (delta: number) => {
    setRmWeight((prev) => Math.max(0, Math.round((prev + delta) * 2) / 2));
  };

  const adjustRmReps = (delta: number) => {
    setRmReps((prev) => Math.max(1, prev + delta));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.modalContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${theme.accent}20` },
                ]}
              >
                <Calculator size={20} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                Outils d'entraînement
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Onglets sélecteurs */}
          <View
            style={[
              styles.tabSelector,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'plates' && { backgroundColor: theme.accent },
              ]}
              onPress={() => setActiveTab('plates')}
            >
              <Dumbbell
                size={15}
                color={activeTab === 'plates' ? '#FFFFFF' : theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'plates' ? '#FFFFFF' : theme.textMuted },
                ]}
              >
                Disques & Barre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'oneRM' && { backgroundColor: theme.accent },
              ]}
              onPress={() => setActiveTab('oneRM')}
            >
              <Scale
                size={15}
                color={activeTab === 'oneRM' ? '#FFFFFF' : theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'oneRM' ? '#FFFFFF' : theme.textMuted },
                ]}
              >
                Calculateur 1RM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenu Déroulant */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'plates' ? (
              /* ================== CALCULATEUR DE DISQUES ================== */
              <View>
                {/* Sélecteur de barre */}
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  TYPE DE BARRE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.barsRow}
                >
                  {BAR_OPTIONS.map((b) => (
                    <TouchableOpacity
                      key={b.label}
                      activeOpacity={0.7}
                      onPress={() => setSelectedBar(b.weight)}
                      style={[
                        styles.barChip,
                        {
                          backgroundColor: selectedBar === b.weight ? `${theme.accent}25` : theme.surface,
                          borderColor: selectedBar === b.weight ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.barChipText,
                          {
                            color: selectedBar === b.weight ? theme.accent : theme.text,
                            fontWeight: selectedBar === b.weight ? '800' : '600',
                          },
                        ]}
                      >
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Saisie Poids Cible */}
                <View
                  style={[
                    styles.weightBox,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.targetLabel, { color: theme.textMuted }]}>
                    POIDS TOTAL CIBLE
                  </Text>
                  <View style={styles.weightNumberRow}>
                    <Text style={[styles.weightBigNumber, { color: theme.text }]}>
                      {targetWeight}
                    </Text>
                    <Text style={[styles.weightUnit, { color: theme.accent }]}>kg</Text>
                  </View>

                  {/* Boutons steppers rapides */}
                  <View style={styles.steppersRow}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { borderColor: theme.border }]}
                      onPress={() => adjustTargetWeight(-10)}
                    >
                      <Text style={[styles.stepperText, { color: theme.text }]}>-10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { borderColor: theme.border }]}
                      onPress={() => adjustTargetWeight(-2.5)}
                    >
                      <Text style={[styles.stepperText, { color: theme.text }]}>-2.5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { borderColor: theme.border }]}
                      onPress={() => adjustTargetWeight(2.5)}
                    >
                      <Text style={[styles.stepperText, { color: theme.accent }]}>+2.5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { borderColor: theme.border }]}
                      onPress={() => adjustTargetWeight(10)}
                    >
                      <Text style={[styles.stepperText, { color: theme.accent }]}>+10</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sélecteur Gros disques vs Petits disques */}
                <View style={[styles.plateModeContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setPlateMode('all')}
                    style={[
                      styles.plateModeButton,
                      plateMode === 'all' && { backgroundColor: theme.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.plateModeButtonText,
                        { color: plateMode === 'all' ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      Gros disques (standard)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setPlateMode('small')}
                    style={[
                      styles.plateModeButton,
                      plateMode === 'small' && { backgroundColor: theme.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.plateModeButtonText,
                        { color: plateMode === 'small' ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      Petits disques (≤ 10 kg)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Affichage Visuel de la Barre chargée */}
                <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 14 }]}>
                  CHARGEMENT PAR CÔTÉ ({plateCalculation.perSideWeight} KG)
                </Text>

                <View
                  style={[
                    styles.barbellVisualCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {/* Manchon de la barre */}
                  <View style={styles.barbellStage}>
                    {/* Butée de la barre */}
                    <View
                      style={[
                        styles.barbellCollar,
                        { backgroundColor: isDark ? '#4B5563' : '#9CA3AF' },
                      ]}
                    />
                    {/* Disques enfilés */}
                    <View style={styles.platesContainer}>
                      {plateCalculation.visualPlates.map((w, idx) => {
                        const styleInfo = PLATE_COLORS[w] || { bg: '#888', text: '#FFF', height: 40 };
                        return (
                          <View
                            key={`plate-${idx}`}
                            style={[
                              styles.plateVisual,
                              {
                                height: styleInfo.height,
                                backgroundColor: styleInfo.bg,
                              },
                            ]}
                          >
                            <Text style={[styles.plateVisualText, { color: styleInfo.text }]}>
                              {w}
                            </Text>
                          </View>
                        );
                      })}
                      {/* Manchon nu visible à droite */}
                      <View
                        style={[
                          styles.barbellSleeve,
                          { backgroundColor: isDark ? '#374151' : '#CBD5E1' },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Résumé textuel par côté */}
                  <View style={styles.plateSummaryBox}>
                    {plateCalculation.error ? (
                      <Text style={[styles.plateSummaryError, { color: theme.danger }]}>
                        {plateCalculation.error}
                      </Text>
                    ) : plateCalculation.plates.length === 0 ? (
                      <Text style={[styles.plateSummaryText, { color: theme.textMuted }]}>
                        Barre à vide ({selectedBar} kg)
                      </Text>
                    ) : (
                      <Text style={[styles.plateSummaryText, { color: theme.text }]}>
                        Mettre par côté :{' '}
                        {plateCalculation.plates
                          .map((p) => `${p.count}× ${p.weight} kg`)
                          .join('  +  ')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              /* ================== CALCULATEUR 1RM ================== */
              <View>
                {/* Saisie Poids & Reps */}
                <View style={styles.rmInputsRow}>
                  {/* Poids */}
                  <View
                    style={[
                      styles.rmInputCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.rmInputLabel, { color: theme.textMuted }]}>
                      CHARGE (KG)
                    </Text>
                    <Text style={[styles.rmInputValue, { color: theme.text }]}>
                      {rmWeight} kg
                    </Text>
                    <View style={styles.rmSteppers}>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmWeight(-10)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.text }]}>-10</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmWeight(-2.5)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.text }]}>-2.5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmWeight(2.5)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.accent }]}>+2.5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmWeight(10)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.accent }]}>+10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Répétitions */}
                  <View
                    style={[
                      styles.rmInputCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.rmInputLabel, { color: theme.textMuted }]}>
                      RÉPÉTITIONS
                    </Text>
                    <Text style={[styles.rmInputValue, { color: theme.text }]}>
                      {rmReps} reps
                    </Text>
                    <View style={styles.rmSteppers}>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmReps(-5)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.text }]}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmReps(-1)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.text }]}>-1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmReps(1)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.accent }]}>+1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stepperBtnSmall, { borderColor: theme.border }]}
                        onPress={() => adjustRmReps(5)}
                      >
                        <Text style={[styles.stepperTextSmall, { color: theme.accent }]}>+5</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Résultat 1RM Estimé */}
                <View
                  style={[
                    styles.oneRmResultCard,
                    {
                      backgroundColor: `${theme.accent}15`,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <Text style={[styles.oneRmResultTitle, { color: theme.accent }]}>
                    1RM ESTIMÉ
                  </Text>
                  <View style={styles.oneRmNumberRow}>
                    <Text style={[styles.oneRmBigNumber, { color: theme.text }]}>
                      {oneRMCalculations.e1RM}
                    </Text>
                    <Text style={[styles.oneRmUnit, { color: theme.accent }]}>kg</Text>
                  </View>
                  <Text style={[styles.oneRmFormulaDesc, { color: theme.textMuted }]}>
                    Moyenne Epley & Brzycki pour {rmWeight} kg × {rmReps} reps
                  </Text>
                </View>

                {/* Tableau des pourcentages d'entraînement */}
                <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 14 }]}>
                  TABLEAU DES POURCENTAGES
                </Text>

                <View
                  style={[
                    styles.pctTable,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {oneRMCalculations.percentages.map((item, idx) => (
                    <View
                      key={item.pct}
                      style={[
                        styles.pctRow,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                        item.pct === 100 && { backgroundColor: `${theme.accent}12` },
                      ]}
                    >
                      <View style={styles.pctBadge}>
                        <Text
                          style={[
                            styles.pctText,
                            {
                              color: item.pct === 100 ? theme.accent : theme.text,
                              fontWeight: item.pct === 100 ? '900' : '700',
                            },
                          ]}
                        >
                          {item.pct}%
                        </Text>
                      </View>

                      <Text style={[styles.pctReps, { color: theme.textMuted }]}>
                        {item.reps}
                      </Text>

                      <Text
                        style={[
                          styles.pctWeight,
                          {
                            color: item.pct === 100 ? theme.accent : theme.text,
                            fontWeight: item.pct === 100 ? '900' : '700',
                          },
                        ]}
                      >
                        {item.weight} kg
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '96%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  barsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  barChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  barChipText: {
    fontSize: 12,
  },
  weightBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weightNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 4,
  },
  weightBigNumber: {
    fontSize: 38,
    fontWeight: '900',
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '800',
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  stepperBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '700',
  },
  barbellVisualCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  barbellStage: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    marginVertical: 4,
  },
  barbellCollar: {
    width: 14,
    height: 52,
    borderRadius: 3,
    marginRight: 3,
  },
  platesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  plateVisual: {
    width: 22,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateVisualText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  barbellSleeve: {
    width: 60,
    height: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginLeft: 2,
  },
  plateSummaryBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    width: '100%',
    alignItems: 'center',
  },
  plateSummaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  plateSummaryError: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  plateModeContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  plateModeButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateModeButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rmInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rmInputCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  rmInputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  rmInputValue: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  rmSteppers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  stepperBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  stepperTextSmall: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  oneRmResultCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  oneRmResultTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  oneRmNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  oneRmBigNumber: {
    fontSize: 42,
    fontWeight: '900',
  },
  oneRmUnit: {
    fontSize: 20,
    fontWeight: '800',
  },
  oneRmFormulaDesc: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  pctTable: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pctBadge: {
    width: 50,
  },
  pctText: {
    fontSize: 13,
  },
  pctReps: {
    fontSize: 12,
    fontWeight: '600',
  },
  pctWeight: {
    fontSize: 13.5,
    textAlign: 'right',
  },
});
