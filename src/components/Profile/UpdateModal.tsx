import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { UpdateInfo, UpdateService } from '../../services/updateService';
import { Download, ExternalLink, X, ArrowUpCircle } from 'lucide-react-native';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  updateInfo,
}) => {
  const { theme } = useTheme();

  if (!updateInfo) return null;

  const formattedDate = updateInfo.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const handleDownload = async () => {
    if (updateInfo.apkDownloadUrl) {
      await UpdateService.downloadAndInstall(updateInfo.apkDownloadUrl);
    }
  };

  const handleOpenReleasePage = async () => {
    if (updateInfo.releaseUrl) {
      await UpdateService.downloadAndInstall(updateInfo.releaseUrl);
    }
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
          style={[
            styles.container,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}
          activeOpacity={1}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.surface, borderColor: theme.accent },
                ]}
              >
                <ArrowUpCircle size={24} color={theme.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.title, { color: theme.text }]}>
                  Mise à jour disponible
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  {updateInfo.releaseName || `Version ${updateInfo.latestVersion}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Badge de Version */}
          <View
            style={[
              styles.versionBanner,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.versionColumn}>
              <Text style={[styles.versionLabel, { color: theme.textMuted }]}>
                Installée
              </Text>
              <Text style={[styles.versionValue, { color: theme.text }]}>
                v{updateInfo.currentVersion}
              </Text>
            </View>

            <View style={styles.versionArrow}>
              <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '900' }}>
                ➔
              </Text>
            </View>

            <View style={styles.versionColumn}>
              <Text style={[styles.versionLabel, { color: theme.accent }]}>
                Nouvelle
              </Text>
              <Text style={[styles.versionValue, { color: theme.accent }]}>
                v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {formattedDate ? (
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              Publiée le {formattedDate}
            </Text>
          ) : null}

          {/* Notes de mise à jour */}
          <Text style={[styles.notesHeader, { color: theme.text }]}>
            Nouveautés & Changements :
          </Text>
          <View
            style={[
              styles.notesBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator>
              <Text style={[styles.notesText, { color: theme.text }]}>
                {updateInfo.releaseNotes}
              </Text>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={handleDownload}
            >
              <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                Télécharger la mise à jour (.apk)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={handleOpenReleasePage}
            >
              <ExternalLink
                size={15}
                color={theme.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>
                Voir sur GitHub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.cancelBtn}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>
                Plus tard
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  versionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  versionColumn: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  versionValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  versionArrow: {
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  notesHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  notesBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
