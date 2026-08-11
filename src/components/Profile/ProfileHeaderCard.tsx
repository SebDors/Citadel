import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { User, Scale, Flame } from 'lucide-react-native';

interface ProfileHeaderCardProps {
  profile: UserProfile;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile }) => {
  const { theme } = useTheme();

  return (
    <Card>
      <View style={styles.container}>
        <View style={[styles.avatarBox, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
          <User size={32} color={theme.accent} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Scale size={14} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {profile.currentWeightKg} kg
              </Text>
            </View>

            <View style={[styles.statItem, { marginLeft: 16 }]}>
              <Flame size={14} color={theme.accent} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {profile.totalWorkouts} séances
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});
