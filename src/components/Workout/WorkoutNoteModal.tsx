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
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import {
  X,
  FileText,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Info,
  Target,
  Plus,
  ShieldAlert,
} from 'lucide-react-native';
import {
  SessionNote,
  NoteType,
  NOTE_TYPES_CONFIG,
  PAIN_SEVERITY_LEVELS,
} from '../../types';

interface WorkoutNoteModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialNote?: string;
  onSave?: (note: string) => void;
  sessionNotes?: SessionNote[];
  onAddSessionNote?: (note: Omit<SessionNote, 'id' | 'createdAt'>) => void;
  onRemoveSessionNote?: (noteId: string) => void;
  placeholder?: string;
}

export const WorkoutNoteModal: React.FC<WorkoutNoteModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  initialNote = '',
  onSave,
  sessionNotes,
  onAddSessionNote,
  onRemoveSessionNote,
  placeholder = 'Ajoutez vos remarques, consignes, charges à cibler, sensations...',
}) => {
  const { theme } = useTheme();

  // Mode à onglets uniquement si on gère des sessionNotes
  const hasSessionNotesMode = Boolean(onAddSessionNote);
  const [activeTab, setActiveTab] = useState<'session' | 'static'>(
    hasSessionNotesMode ? 'session' : 'static'
  );

  // État note statique (consigne technique)
  const [staticNoteText, setStaticNoteText] = useState(initialNote);

  // État nouvelle observation ponctuelle
  const [newNoteType, setNewNoteType] = useState<NoteType>('contexte');
  const [newNoteSeverity, setNewNoteSeverity] = useState<1 | 2 | 3>(2);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (visible) {
      setStaticNoteText(initialNote || '');
      setNewNoteText('');
      setNewNoteType('contexte');
      setNewNoteSeverity(2);
      if (hasSessionNotesMode) {
        setActiveTab('session');
      } else {
        setActiveTab('static');
      }
    }
  }, [visible, initialNote, hasSessionNotesMode]);

  const handleSaveStatic = () => {
    if (onSave) {
      onSave(staticNoteText.trim());
    }
    onClose();
  };

  const handleAddSessionNote = () => {
    if (!newNoteText.trim() || !onAddSessionNote) return;

    onAddSessionNote({
      text: newNoteText.trim(),
      type: newNoteType,
      severity: newNoteType === 'douleur' ? newNoteSeverity : undefined,
    });

    setNewNoteText('');
  };

  const getDynamicPlaceholder = () => {
    switch (newNoteType) {
      case 'douleur':
        return "Précisez la zone, la sensation et l'impact sur la série...";
      case 'performance':
        return 'Sensation de force, aisance sur la charge, montée rapide...';
      case 'contexte':
        return 'Échauffement écourté, fatigue générale, manque de sommeil...';
      case 'technique':
        return 'Ajustement de trajectoire, prise, tempo, réglage machine...';
      default:
        return 'Observation sur cette séance...';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
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

            {/* Onglets si mode combiné */}
            {hasSessionNotesMode && (
              <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.tabItem,
                    activeTab === 'session' && [
                      styles.activeTabItem,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                    ],
                  ]}
                  onPress={() => setActiveTab('session')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === 'session' ? theme.text : theme.textMuted,
                        fontWeight: activeTab === 'session' ? '800' : '600',
                      },
                    ]}
                  >
                    Observations {sessionNotes && sessionNotes.length > 0 ? `(${sessionNotes.length})` : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.tabItem,
                    activeTab === 'static' && [
                      styles.activeTabItem,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                    ],
                  ]}
                  onPress={() => setActiveTab('static')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: activeTab === 'static' ? theme.text : theme.textMuted,
                        fontWeight: activeTab === 'static' ? '800' : '600',
                      },
                    ]}
                  >
                    Consigne technique
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* ONGLET OBSERVATIONS DE LA SÉANCE */}
              {hasSessionNotesMode && activeTab === 'session' && (
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                    Type d'observation :
                  </Text>

                  {/* Chips Sélecteur de type */}
                  <View style={styles.typesChipGrid}>
                    {(Object.keys(NOTE_TYPES_CONFIG) as NoteType[]).map((tKey) => {
                      const cfg = NOTE_TYPES_CONFIG[tKey];
                      const isSelected = newNoteType === tKey;
                      return (
                        <TouchableOpacity
                          key={tKey}
                          activeOpacity={0.7}
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: isSelected ? `${cfg.color}25` : theme.surface,
                              borderColor: isSelected ? cfg.color : theme.border,
                            },
                          ]}
                          onPress={() => setNewNoteType(tKey)}
                        >
                          <View
                            style={[
                              styles.typeChipDot,
                              { backgroundColor: cfg.color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.typeChipText,
                              {
                                color: isSelected ? cfg.color : theme.text,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Sévérité spécifique si DOULEUR */}
                  {newNoteType === 'douleur' && (
                    <View style={[styles.painSeverityCard, { backgroundColor: `${theme.danger}10`, borderColor: `${theme.danger}35` }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <ShieldAlert size={15} color={theme.danger} style={{ marginRight: 6 }} />
                        <Text style={[styles.painCardTitle, { color: theme.danger }]}>
                          Niveau de gravité :
                        </Text>
                      </View>

                      <View style={styles.severityRow}>
                        {PAIN_SEVERITY_LEVELS.map((s) => {
                          const isSelected = newNoteSeverity === s.level;
                          return (
                            <TouchableOpacity
                              key={s.level}
                              activeOpacity={0.7}
                              style={[
                                styles.severityChip,
                                {
                                  backgroundColor: isSelected ? s.badgeColor : theme.surface,
                                  borderColor: isSelected ? s.badgeColor : theme.border,
                                },
                              ]}
                              onPress={() => setNewNoteSeverity(s.level)}
                            >
                              <Text
                                style={[
                                  styles.severityChipText,
                                  { color: isSelected ? '#FFFFFF' : theme.text },
                                ]}
                              >
                                {s.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <Text style={[styles.severityDescText, { color: theme.textMuted }]}>
                        {PAIN_SEVERITY_LEVELS.find((s) => s.level === newNoteSeverity)?.description}
                      </Text>
                    </View>
                  )}

                  {/* Input pour la nouvelle note */}
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        minHeight: 70,
                      },
                    ]}
                    placeholder={getDynamicPlaceholder()}
                    placeholderTextColor={theme.textMuted}
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  {/* Bouton d'ajout d'observation */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.addNoteBtn,
                      {
                        backgroundColor: newNoteText.trim().length > 0 ? theme.accent : theme.surface,
                        borderColor: newNoteText.trim().length > 0 ? theme.accent : theme.border,
                        opacity: newNoteText.trim().length > 0 ? 1 : 0.6,
                      },
                    ]}
                    disabled={!newNoteText.trim()}
                    onPress={handleAddSessionNote}
                  >
                    <Plus size={16} color={newNoteText.trim().length > 0 ? '#FFFFFF' : theme.textMuted} style={{ marginRight: 6 }} />
                    <Text
                      style={[
                        styles.addNoteBtnText,
                        { color: newNoteText.trim().length > 0 ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      Ajouter cette observation
                    </Text>
                  </TouchableOpacity>

                  {/* Liste des observations déjà saisies */}
                  {sessionNotes && sessionNotes.length > 0 && (
                    <View style={styles.existingNotesSection}>
                      <Text style={[styles.existingNotesTitle, { color: theme.textMuted }]}>
                        Observations enregistrées sur cette séance :
                      </Text>
                      {sessionNotes.map((note) => {
                        const typeCfg = NOTE_TYPES_CONFIG[note.type] || NOTE_TYPES_CONFIG.autre;
                        return (
                          <View
                            key={note.id}
                            style={[
                              styles.sessionNoteItem,
                              { backgroundColor: theme.surface, borderColor: theme.border },
                            ]}
                          >
                            <View style={styles.sessionNoteHeader}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <View style={[styles.typeBadgePill, { backgroundColor: `${typeCfg.color}25`, borderColor: typeCfg.color }]}>
                                  <Text style={[styles.typeBadgeText, { color: typeCfg.color }]}>
                                    {typeCfg.label}
                                  </Text>
                                </View>

                                {note.type === 'douleur' && note.severity && (
                                  <View
                                    style={[
                                      styles.typeBadgePill,
                                      {
                                        backgroundColor:
                                          note.severity >= 2 ? '#EF4444' : '#F59E0B',
                                        borderColor:
                                          note.severity >= 2 ? '#EF4444' : '#F59E0B',
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.typeBadgeText, { color: '#FFFFFF' }]}>
                                      Niveau {note.severity}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {onRemoveSessionNote && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => onRemoveSessionNote(note.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Trash2 size={15} color={theme.danger} />
                                </TouchableOpacity>
                              )}
                            </View>

                            <Text style={[styles.sessionNoteContent, { color: theme.text }]}>
                              {note.text}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* ONGLET CONSIGNE PERMANENTE (STATIC NOTE) */}
              {(!hasSessionNotesMode || activeTab === 'static') && (
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                    Consigne technique permanente (conservée pour toutes les séances) :
                  </Text>
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
                    value={staticNoteText}
                    onChangeText={setStaticNoteText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoFocus={!hasSessionNotesMode}
                  />

                  {/* Actions consigne statique */}
                  <View style={styles.actionsRow}>
                    {staticNoteText.length > 0 && (
                      <TouchableOpacity
                        style={[styles.clearBtn, { borderColor: theme.border }]}
                        onPress={() => setStaticNoteText('')}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color={theme.danger} style={{ marginRight: 4 }} />
                        <Text style={[styles.clearBtnText, { color: theme.danger }]}>Effacer</Text>
                      </TouchableOpacity>
                    )}

                    <Button
                      title="Enregistrer la consigne"
                      variant="primary"
                      onPress={handleSaveStatic}
                      style={{ flex: 1, marginLeft: staticNoteText.length > 0 ? 8 : 0 }}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bouton Fermer en bas si mode session */}
            {hasSessionNotesMode && activeTab === 'session' && (
              <View style={{ marginTop: 12 }}>
                <Button title="Fermer" variant="outline" onPress={onClose} />
              </View>
            )}
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
    borderRadius: 20,
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
    marginBottom: 12,
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
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  activeTabItem: {
    borderWidth: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  typesChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  typeChipText: {
    fontSize: 12,
  },
  painSeverityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  painCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  severityChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  severityChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  severityDescText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  textInput: {
    minHeight: 90,
    maxHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  addNoteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  existingNotesSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  existingNotesTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sessionNoteItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  sessionNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sessionNoteContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
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
