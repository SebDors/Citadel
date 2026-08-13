import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Guard : expo-notifications crashe au chargement dans Expo Go.
// On n'importe JAMAIS le module statiquement — uniquement en dynamic import conditionnel.
const isExpoGo = Constants.appOwnership === 'expo';

let activeNotificationId: string | null = null;
let notificationsInitialized = false;

/**
 * Charge expo-notifications dynamiquement (uniquement hors Expo Go).
 * Retourne null dans Expo Go ou en cas d'erreur.
 */
async function getNotifications() {
  if (isExpoGo) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export const NotificationService = {
  /**
   * Initialise les canaux de notifications Android et demande les permissions.
   * No-op silencieux dans Expo Go.
   */
  async init(): Promise<boolean> {
    if (isExpoGo) {
      console.info('[NotificationService] Expo Go détecté – notifications désactivées. Utilisez un APK / Development Build.');
      return false;
    }

    const Notifications = await getNotifications();
    if (!Notifications) return false;

    try {
      // Configuration du handler de notifications au premier plan (une seule fois)
      if (!notificationsInitialized) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationsInitialized = true;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('rest-timer', {
          name: 'Timer de Repos Citadel',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#618764',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[NotificationService] init error:', e);
      return false;
    }
  },

  /**
   * Programme une notification locale qui se déclenchera exactement à la fin du timer de repos.
   * No-op silencieux dans Expo Go.
   */
  async scheduleTimerExpirationNotification(seconds: number, exerciseName?: string): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      await this.cancelScheduledNotification();
      if (seconds <= 0) return;

      const title = '⏱️ Repos Terminé !';
      const body = exerciseName
        ? `Temps de repos pour ${exerciseName} écoulé. Prochaine série !`
        : 'Votre temps de repos est écoulé !';

      activeNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { type: 'timer_expiration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(seconds)),
        },
      });
    } catch (e) {
      console.warn('[NotificationService] scheduleTimerExpirationNotification error:', e);
    }
  },

  /**
   * Annule toute notification de timer en cours ou programmée.
   * No-op silencieux dans Expo Go.
   */
  async cancelScheduledNotification(): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      if (activeNotificationId) {
        await Notifications.dismissNotificationAsync(activeNotificationId);
        await Notifications.cancelScheduledNotificationAsync(activeNotificationId);
        activeNotificationId = null;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[NotificationService] cancelScheduledNotification error:', e);
    }
  },

  /**
   * Joue un son d'alerte sonore pour la fin du timer de repos.
   * Utilise expo-audio (SDK 54+).
   * Fonctionne dans Expo Go et dans un APK / Development Build.
   */
  async playTimerEndSound(): Promise<void> {
    try {
      const { createAudioPlayer, setIsAudioActiveAsync } = await import('expo-audio');

      await setIsAudioActiveAsync(true);

      const player = createAudioPlayer(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }
      );
      player.volume = 1.0;
      player.play();

      // Nettoyage après 5s
      setTimeout(() => {
        try { player.remove(); } catch (_) {}
      }, 5000);
    } catch (e) {
      console.warn('[NotificationService] Audio play error:', e);
    }
  },
};
