import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import {
  Dumbbell,
  Zap,
  TrendingUp,
  Flame,
  User,
  Scale,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (profileData: { name: string; currentWeightKg?: number }) => void;
  onSkip?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete, onSkip }) => {
  const { theme, isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Étape 2: Formulaire Profil
  const [name, setName] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const isSlide2Valid = name.trim().length > 0;
  const isNextDisabled = currentSlide === 1 && !isSlide2Valid;

  const handleNext = () => {
    if (currentSlide === 1 && !isSlide2Valid) return;

    if (currentSlide < 2) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    const weightNum = parseFloat(weightInput.replace(',', '.'));
    onComplete({
      name: name.trim() || 'Athlète',
      currentWeightKg: !isNaN(weightNum) && weightNum > 0 ? weightNum : undefined,
    });
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleFinish();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Barre Supérieure : Sauter / Indicateurs */}
        <View style={styles.topBar}>
          <Text style={[styles.stepBadge, { color: theme.accent, backgroundColor: theme.surface }]}>
            Étape {currentSlide + 1} / 3
          </Text>

          {currentSlide < 2 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSkip}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: theme.textMuted }]}>Passer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Zone de Contenu Principale des Diapositives */}
        <View style={styles.slideContentContainer}>
          {/* SLIDE 1 : Bienvenue & Présentation */}
          {currentSlide === 0 && (
            <ScrollView contentContainerStyle={styles.slideBox} showsVerticalScrollIndicator={false}>
              <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                <Dumbbell size={48} color={theme.accent} />
              </View>

              <Text style={[styles.welcomeTag, { color: theme.accent }]}>BIENVENUE SUR CITADEL</Text>
              <Text style={[styles.title, { color: theme.text }]}>Votre Forteresse de Progression</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Conçu pour vous accompagner dans vos entraînements quotidiens avec précision, clarté et élégance.
              </Text>

              {/* Cartes de fonctionnalités clés */}
              <View style={styles.featuresList}>
                <View style={[styles.featureCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.featureIconBox, { backgroundColor: theme.surface }]}>
                    <Flame size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Séances & Séries Précises</Text>
                    <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                      Suivez vos séries (Charge × Reps), types de séries (Warmup, Drop set, Échec) et minutage de repos.
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.featureIconBox, { backgroundColor: theme.surface }]}>
                    <Zap size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Circuits & AMRAP</Text>
                    <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                      Créez des blocs circuits complexes avec tours ou minutage AMRAP en direct.
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.featureIconBox, { backgroundColor: theme.surface }]}>
                    <TrendingUp size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Analytique & 1RM Estimé</Text>
                    <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                      Visualisez votre progression, vos records personnels (PR) et l'évolution de vos mensurations.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* SLIDE 2 : Configuration du Profil Initial */}
          {currentSlide === 1 && (
            <ScrollView contentContainerStyle={styles.slideBox} showsVerticalScrollIndicator={false}>
              <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                <User size={44} color={theme.accent} />
              </View>

              <Text style={[styles.welcomeTag, { color: theme.accent }]}>PROFIL INITIAL</Text>
              <Text style={[styles.title, { color: theme.text }]}>Faisons Connaissance</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Personnalisez votre identité pour adapter les suivis de poids et vos statistiques.
              </Text>

              <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Votre Prénom / Pseudo *</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: isSlide2Valid ? theme.border : theme.accent }]}>
                    <User size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Entrez votre prénom ou pseudo..."
                      placeholderTextColor={theme.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoFocus
                    />
                  </View>
                  {!isSlide2Valid && (
                    <View style={styles.validationHintRow}>
                      <AlertCircle size={12} color={theme.accent} />
                      <Text style={[styles.validationHintText, { color: theme.accent }]}>
                        Le prénom ou pseudo est requis pour continuer.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Poids Actuel (Optionnel)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Scale size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Ex: 75.0"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                      value={weightInput}
                      onChangeText={setWeightInput}
                    />
                    <Text style={[styles.unitText, { color: theme.textMuted }]}>kg</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* SLIDE 3 : Présentation des Onglets & Lancement */}
          {currentSlide === 2 && (
            <ScrollView contentContainerStyle={styles.slideBox} showsVerticalScrollIndicator={false}>
              <View style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                <Sparkles size={44} color={theme.accent} />
              </View>

              <Text style={[styles.welcomeTag, { color: theme.accent }]}>PRÊT POUR L'AVENTURE</Text>
              <Text style={[styles.title, { color: theme.text }]}>3 Onglets Intuitifs</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Découvrez la navigation de votre application pour démarrer votre 1ère séance.
              </Text>

              <View style={styles.tabsOverviewList}>
                <View style={[styles.tabOverviewCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.tabOverviewBadge, { backgroundColor: theme.surface }]}>
                    <Dumbbell size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabOverviewTitle, { color: theme.text }]}>1. Entraînement</Text>
                    <Text style={[styles.tabOverviewDesc, { color: theme.textMuted }]}>
                      Créez des programmes et lancez vos séances en direct ou libres.
                    </Text>
                  </View>
                </View>

                <View style={[styles.tabOverviewCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.tabOverviewBadge, { backgroundColor: theme.surface }]}>
                    <Calendar size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabOverviewTitle, { color: theme.text }]}>2. Historique</Text>
                    <Text style={[styles.tabOverviewDesc, { color: theme.textMuted }]}>
                      Retrouvez votre calendrier d'assiduité et le détail de chaque entraînement passé.
                    </Text>
                  </View>
                </View>

                <View style={[styles.tabOverviewCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.tabOverviewBadge, { backgroundColor: theme.surface }]}>
                    <User size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabOverviewTitle, { color: theme.text }]}>3. Profil</Text>
                    <Text style={[styles.tabOverviewDesc, { color: theme.textMuted }]}>
                      Suivez vos courbes de poids, mensurations, 1RM et réglages généraux.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Zone Inférieure : Pagination par Points & Boutons d'Action Centrés */}
        <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
          <View style={styles.paginationDots}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentSlide ? theme.accent : theme.border,
                    width: idx === currentSlide ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.navigationRow}>
            {currentSlide > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePrev}
                style={[styles.prevBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <ChevronLeft size={20} color={theme.text} />
              </TouchableOpacity>
            )}

            <Button
              title={currentSlide === 2 ? "Commencer l'aventure" : "Suivant"}
              variant="primary"
              disabled={isNextDisabled}
              onPress={handleNext}
              icon={currentSlide === 2 ? <CheckCircle2 size={18} color="#FFFFFF" /> : <ChevronRight size={18} color="#FFFFFF" />}
              style={[
                { flex: 1 },
                currentSlide > 0 && { marginLeft: 12 },
                isNextDisabled && { opacity: 0.5 },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipBtn: {
    padding: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slideContentContainer: {
    flex: 1,
  },
  slideBox: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTag: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featuresList: {
    width: '100%',
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  formCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  validationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  validationHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsOverviewList: {
    width: '100%',
    gap: 12,
  },
  tabOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabOverviewBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tabOverviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  tabOverviewDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prevBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
