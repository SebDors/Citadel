import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { TrendingUp, Dumbbell } from 'lucide-react-native';

export const OneRMChartCard: React.FC = () => {
  const { theme } = useTheme();

  // Exemples d'estimations 1RM calculées sur la meilleure performance (Upper B)
  // Formule Epley: 1RM = Weight * (1 + Reps/30)
  // Dips 10kg x 10 @ 78.5kg = (78.5 + 10) * (1 + 10/30) = 88.5 * 1.333 = 118kg
  const exercises1RM = [
    { name: 'Dips (+Lest)', bestSet: '+10kg x 10 reps', est1RM: '118 kg', delta: '+4%' },
    { name: 'Tirage Horizontal', bestSet: '40kg x 9 reps', est1RM: '52 kg', delta: '+2.5%' },
    { name: 'Low Cable Fly', bestSet: '15kg x 10 reps', est1RM: '20 kg', delta: '+5%' },
  ];

  return (
    <Card>
      <View style={styles.header}>
        <TrendingUp size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Progression 1RM Estimé</Text>
      </View>

      {exercises1RM.map((item, idx) => (
        <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
          <View style={styles.itemLeft}>
            <Dumbbell size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
            <View>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted }]}>{item.bestSet}</Text>
            </View>
          </View>

          <View style={styles.itemRight}>
            <Text style={[styles.rmValue, { color: theme.accent }]}>{item.est1RM}</Text>
            <Text style={[styles.delta, { color: theme.primary }]}>{item.delta}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  rmValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  delta: {
    fontSize: 11,
    fontWeight: '700',
  },
});
