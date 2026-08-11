import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { User, Scale, Flame, Settings } from 'lucide-react-native';

interface ProfileHeaderCardProps {
  profile: UserProfile;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile, onUpdateProfile }) => {
  const { theme } = useTheme();

  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(profile.name);
  const [weight, setWeight] = useState(String(profile.currentWeightKg));

  const handleSave = () => {
    onUpdateProfile({
      name,
      currentWeightKg: parseFloat(weight) || profile.currentWeightKg,
    });
    setShowEditModal(false);
  };

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

        {/* Roue crantée Réglages Profil (Demande utilisateur!) */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowEditModal(true)} style={styles.settingsBtn}>
          <Settings size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Modal Édition du Profil */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Modifier le Profil</Text>

            <Text style={[styles.inputLabel, { color: theme.text }]}>Nom ou Pseudo</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: theme.text }]}>Poids actuel (kg)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <Button title="Annuler" variant="outline" onPress={() => setShowEditModal(false)} style={{ flex: 1, marginRight: 6 }} />
              <Button title="Enregistrer" variant="primary" onPress={handleSave} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 19,
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
  settingsBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
});
