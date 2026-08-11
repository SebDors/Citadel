import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useWorkout } from '../src/context/WorkoutContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Star, ChevronRight, Award } from 'lucide-react-native';

export default function WorkoutAnalyticsScreen() {
  const { theme } = useTheme();
  const { data } = useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();

  const templateId = (params.id as string) || 'tpl_upper_b';
  const template = data?.templates.find((t) => t.id === templateId) || data?.templates[0];

  const [activeMetricTab, setActiveMetricTab] = useState<'volume' | 'duree' | 'reps'>('volume');
  const [activeTimeFilter, setActiveTimeFilter] = useState<'30J' | '3M' | '6M' | '1A'>('30J');

  const historySessions = (data?.history || []).filter((s) => s.title === template?.title || s.templateId === template?.id);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Navigation */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.titleBox}>
          <Text style={[styles.topTitle, { color: theme.text }]}>{template?.title || 'Upper B'}</Text>
          <Text style={[styles.topSub, { color: theme.textMuted }]}>
            {historySessions.length} entraînement · 0,2×/sem
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Metric Callout (Volume / Dernier) */}
        <View style={styles.metricCallout}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {activeMetricTab.toUpperCase()} · DERNIER
          </Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {activeMetricTab === 'volume' ? '2,8k kg' : activeMetricTab === 'duree' ? '1 h 21' : '142 reps'}
          </Text>
        </View>

        {/* Metric Selector Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'volume' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('volume')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'volume' && { fontWeight: '900' }]}>
              Volume
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'duree' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('duree')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'duree' && { fontWeight: '900' }]}>
              Durée
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeMetricTab === 'reps' && { backgroundColor: theme.cardBg }]}
            onPress={() => setActiveMetricTab('reps')}
          >
            <Text style={[styles.tabText, { color: theme.text }, activeMetricTab === 'reps' && { fontWeight: '900' }]}>
              Reps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Canvas Card */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.chartArea}>
            <View style={styles.chartLineMock}>
              <View style={[styles.chartPoint, { backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.chartY, { color: theme.textMuted }]}>3081.7</Text>
            <Text style={[styles.chartYMid, { color: theme.textMuted }]}>1540.8</Text>
            <Text style={[styles.chartYZero, { color: theme.textMuted }]}>0.0</Text>
          </View>

          {/* Time Filter Controls (30J / 3M / 6M / 1A) */}
          <View style={styles.filtersRow}>
            {(['30J', '3M', '6M', '1A'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterBtn,
                  { borderColor: theme.border, backgroundColor: activeTimeFilter === filter ? theme.surface : 'transparent' },
                ]}
                onPress={() => setActiveTimeFilter(filter)}
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
            <Award size={18} color="#8B5CF6" />
            <Text style={[styles.prSummaryText, { color: theme.text }]}>
              7 records battus dans {template?.title || 'Upper B'}
            </Text>
          </View>

          {template?.exercises.map((ex, idx) => (
            <View key={idx} style={[styles.prRow, { borderTopColor: theme.border }]}>
              <View style={styles.prLeft}>
                <View style={styles.starCircle}>
                  <Star size={12} color="#8B5CF6" fill="#8B5CF6" />
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={[styles.prExName, { color: theme.text }]}>{ex.exerciseName}</Text>
                  <Text style={[styles.prExDate, { color: theme.textMuted }]}>7 AOÛT</Text>
                </View>
              </View>
              <View style={styles.prRight}>
                <Text style={[styles.prValue, { color: theme.text }]}>14 kg e1RM</Text>
                <Text style={[styles.prSub, { color: theme.textMuted }]}>10 kg × 10</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Exercices de la Séance Section */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          EXERCICES DE LA SÉANCE
        </Text>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {template?.exercises.map((ex, idx) => (
            <TouchableOpacity key={idx} style={[styles.exLinkRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.exLinkName, { color: theme.text }]}>{ex.exerciseName}</Text>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Historique Passé */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 18, marginBottom: 8 }]}>
          HISTORIQUE
        </Text>

        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.border, marginBottom: 30 }]}>
          <TouchableOpacity style={styles.historyLinkRow}>
            <Text style={[styles.historyDate, { color: theme.text }]}>ven. 7 août</Text>
            <View style={styles.historyRight}>
              <Text style={[styles.historyVol, { color: theme.text }]}>2 802 kg</Text>
              <Text style={[styles.historyDur, { color: theme.textMuted, marginLeft: 10 }]}>1 h 21</Text>
              <ChevronRight size={16} color={theme.textMuted} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  topSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  metricCallout: {
    marginTop: 8,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  chartArea: {
    height: 140,
    position: 'relative',
    justifyContent: 'space-between',
  },
  chartLineMock: {
    position: 'absolute',
    left: 40,
    top: 30,
    width: 10,
    height: 10,
  },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartY: {
    fontSize: 10,
  },
  chartYMid: {
    fontSize: 10,
  },
  chartYZero: {
    fontSize: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recordsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  prSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prSummaryText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prExName: {
    fontSize: 14,
    fontWeight: '700',
  },
  prExDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  prRight: {
    alignItems: 'flex-end',
  },
  prValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  prSub: {
    fontSize: 11,
  },
  exLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  exLinkName: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyVol: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyDur: {
    fontSize: 12,
  },
});
