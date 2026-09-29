import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { User, Scale, Flame, Pencil } from 'lucide-react-native';
import { formatWeight } from '../../utils/numberUtils';

interface ProfileHeaderCardProps {
  profile: UserProfile;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const { theme } = useTheme();
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [name, setName] = useState(profile.name);

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onUpdateProfile({ name: trimmed });
    }
    setShowEditNameModal(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowEditNameModal(true)}
        accessibilityLabel="Modifier le profil"
      >
        <Card>
          <View style={styles.container}>
            <View
              style={[
                styles.avatarBox,
                { backgroundColor: theme.surface, borderColor: theme.accent },
              ]}
            >
              <User size={30} color={theme.accent} />
            </View>

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {profile.name}
                </Text>
                <View
                  style={[
                    styles.pencilBadge,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Pencil size={12} color={theme.textMuted} />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Scale size={14} color={theme.textMuted} />
                  <Text style={[styles.statText, { color: theme.textMuted }]}>
                    {profile.currentWeightKg && profile.currentWeightKg > 0
                      ? `${formatWeight(profile.currentWeightKg)} kg`
                      : '-- kg'}
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
      </TouchableOpacity>

      {/* Modale d'édition rapide du Nom */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditNameModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Modifier le nom
            </Text>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
              Nom ou pseudo d'athlète
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Alexandre"
              placeholderTextColor={theme.textMuted}
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleSaveName}
              returnKeyType="done"
            />

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => {
                  setName(profile.name);
                  setShowEditNameModal(false);
                }}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Enregistrer"
                variant="primary"
                onPress={handleSaveName}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },
  pencilBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
});
