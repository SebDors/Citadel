import { Linking } from 'react-native';
import Constants from 'expo-constants';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkDownloadUrl: string | null;
  releaseUrl: string;
  publishedAt: string;
}

const GITHUB_REPO = 'SebDors/Citadel';
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Compare deux versions sémantiques (ex: '1.6.0' vs '1.5.1')
 * Retourne 1 si v1 > v2, -1 si v1 < v2, et 0 si identiques.
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split(/[-+]/)[0].split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split(/[-+]/)[0].split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export const UpdateService = {
  /**
   * Récupère la version actuelle de l'application depuis la configuration Expo
   */
  getCurrentVersion(): string {
    return Constants.expoConfig?.version || '1.5.1';
  },

  /**
   * Vérifie auprès de GitHub s'il existe une nouvelle version publiée
   */
  async checkForUpdate(explicitCurrentVersion?: string): Promise<UpdateInfo> {
    const currentVersion = explicitCurrentVersion || this.getCurrentVersion();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(LATEST_RELEASE_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Citadel-Mobile-App',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GitHub API error: HTTP ${response.status}`);
      }

      const releaseData = await response.json();
      const latestTag = releaseData.tag_name || '';
      const latestVersion = latestTag.replace(/^v/i, '').trim();

      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

      // Recherche de l'asset APK dans la release
      let apkDownloadUrl: string | null = null;
      if (Array.isArray(releaseData.assets)) {
        const apkAsset = releaseData.assets.find(
          (asset: any) =>
            typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset && apkAsset.browser_download_url) {
          apkDownloadUrl = apkAsset.browser_download_url;
        }
      }

      // Si pas d'asset APK direct, on redirige vers la page de release GitHub
      const releaseUrl = releaseData.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;

      return {
        hasUpdate,
        latestVersion,
        currentVersion,
        releaseName: releaseData.name || latestTag,
        releaseNotes: releaseData.body || 'Aucune note de mise à jour fournie.',
        apkDownloadUrl: apkDownloadUrl || releaseUrl,
        releaseUrl,
        publishedAt: releaseData.published_at || new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  /**
   * Ouvre l'URL de téléchargement direct de l'APK ou la page de release
   */
  async downloadAndInstall(downloadUrl: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        await Linking.openURL(`https://github.com/${GITHUB_REPO}/releases/latest`);
      }
    } catch (e) {
      console.error('Erreur lors de l’ouverture du lien de téléchargement:', e);
      await Linking.openURL(`https://github.com/${GITHUB_REPO}/releases/latest`);
    }
  },
};
