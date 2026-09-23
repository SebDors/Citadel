import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import { X, FileText, Trash2 } from 'lucide-react-native';

interface WorkoutNoteModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialNote?: string;
  onSave: (note: string) => void;
  placeholder?: string;
}

export const WorkoutNoteModal: React.FC<WorkoutNoteModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  initialNote = '',
  onSave,
  placeholder = 'Ajoutez vos remarques, consignes, charges à cibler, sensations...',
}) => {
  const { theme } = useTheme();
  const [noteText, setNoteText] = useState(initialNote);

  useEffect(() => {
    if (visible) {
      setNoteText(initialNote || '');
    }
  }, [visible, initialNote]);

  const handleSave = () => {
    onSave(noteText.trim());
    onClose();
  };

  const handleClear = () => {
    setNoteText('');
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.content,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.accent}20` }]}>
                  <FileText size={16} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={[styles.modalSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeBtn}
              >
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Note Input */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus={visible}
            />

            {/* Actions */}
            <View style={styles.actionsRow}>
              {noteText.length > 0 ? (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: theme.border }]}
                  onPress={handleClear}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color={theme.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.clearBtnText, { color: theme.danger }]}>Effacer</Text>
                </TouchableOpacity>
              ) : (
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: 8 }}
                />
              )}

              <Button
                title="Enregistrer"
                variant="primary"
                onPress={handleSave}
                style={{ flex: noteText.length > 0 ? 1 : 1, marginLeft: noteText.length > 0 ? 8 : 0 }}
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  textInput: {
    minHeight: 110,
    maxHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
