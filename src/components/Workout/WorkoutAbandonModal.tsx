import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface WorkoutAbandonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmAbandon: () => void;
}

export const WorkoutAbandonModal: React.FC<WorkoutAbandonModalProps> = ({
  visible,
  onClose,
  onConfirmAbandon,
}) => {
  const { theme } = useTheme();

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
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.danger}20` },
            ]}
          >
            <AlertTriangle size={36} color={theme.danger} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Abandonner la séance ?
          </Text>

          <Text style={[styles.desc, { color: theme.textMuted }]}>
            Toute votre progression actuelle sera perdue et cette séance ne sera pas enregistrée dans votre historique.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.keepBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.keepBtnText}>Continuer la séance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onConfirmAbandon}
              style={styles.confirmBtn}
            >
              <Text style={[styles.confirmBtnText, { color: theme.danger }]}>
                Abandonner définitivement
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  keepBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
