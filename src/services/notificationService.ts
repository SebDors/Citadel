import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Guard : expo-notifications est limité dans Expo Go - ne pas crasher
const isExpoGo = Constants.appOwnership === 'expo';

// Configuration de la gestion des notifications au premier plan (uniquement hors Expo Go)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let activeNotificationId: string | null = null;

export const NotificationService = {
  /**
   * Initialise les canaux de notifications Android et demande les permissions.
   * No-op silencieux dans Expo Go.
   */
  async init(): Promise<boolean> {
    if (isExpoGo) {
      console.info('[NotificationService] Expo Go détecté – notifications désactivées. Utilisez un Development Build pour les activer.');
      return false;
    }
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('rest-timer', {
          name: 'Timer de Repos WarriorFit',
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
      console.warn('Notification init error:', e);
      return false;
    }
  },

  /**
   * Programme une notification locale qui se déclenchera exactement à la fin du timer de repos.
   * No-op silencieux dans Expo Go.
   */
  async scheduleTimerExpirationNotification(seconds: number, exerciseName?: string): Promise<void> {
    if (isExpoGo) return;
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
      console.warn('Failed to schedule timer notification:', e);
    }
  },

  /**
   * Annule toute notification de timer en cours ou programmée.
   * No-op silencieux dans Expo Go.
   */
  async cancelScheduledNotification(): Promise<void> {
    if (isExpoGo) return;
    try {
      if (activeNotificationId) {
        await Notifications.dismissNotificationAsync(activeNotificationId);
        await Notifications.cancelScheduledNotificationAsync(activeNotificationId);
        activeNotificationId = null;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Failed to cancel timer notification:', e);
    }
  },

  /**
   * Joue un son d'alerte sonore pour la fin du timer de repos.
   * Utilise expo-audio (SDK 54+).
   * Fonctionne dans Expo Go et dans un Development Build.
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
      console.warn('Audio play error:', e);
    }
  },
};
