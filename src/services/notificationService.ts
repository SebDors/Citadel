import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Guard : expo-notifications crashe au chargement dans Expo Go.
// On n'importe JAMAIS le module statiquement — uniquement en dynamic import conditionnel.
const isExpoGo = Constants.appOwnership === 'expo';

// Son local embarqué dans les assets (WAV 44100 Hz, bip double 880 Hz + 1100 Hz)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TIMER_SOUND = require('../../assets/timer_end.wav');

let activeNotificationId: string | null = null;
let ongoingNotificationId: string | null = null;
let notificationsInitialized = false;
let currentAudioPlayer: any = null;

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
      // Configuration du handler de notifications au premier plan
      if (!notificationsInitialized) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
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
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[NotificationService] init error:', e);
      return false;
    }
  },

  /**
   * Programme une unique notification locale qui se déclenchera à la fin du timer (timer = 0)
   * avec le nom du prochain exercice à effectuer.
   * No-op silencieux dans Expo Go.
   */
  async scheduleTimerExpirationNotification(
    seconds: number,
    exerciseName?: string,
    nextSetInfo?: { exerciseName: string; setNumber: number; isNextExercise: boolean } | null,
  ): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      await this.cancelScheduledNotification();
      if (seconds <= 0) return;

      const title = 'Repos terminé !';

      let body = 'Votre temps de repos est écoulé !';
      if (nextSetInfo?.exerciseName) {
        if (nextSetInfo.isNextExercise) {
          body = `Prochain exercice : ${nextSetInfo.exerciseName} (Série ${nextSetInfo.setNumber})`;
        } else {
          body = `Prochaine série : ${nextSetInfo.exerciseName} (Série ${nextSetInfo.setNumber})`;
        }
      } else if (exerciseName) {
        body = `Prochain exercice : ${exerciseName}`;
      }

      activeNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          interruptionLevel: 'timeSensitive',
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
   * Désactivé : Seule la notification d'expiration à 0 est conservée.
   */
  async updateOngoingNotification(): Promise<void> {
    // No-op
  },

  /**
   * Annule toute notification de timer en cours ou programmée.
   * No-op silencieux dans Expo Go.
   */
  async cancelScheduledNotification(): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    try {
      if (ongoingNotificationId) {
        try { await Notifications.dismissNotificationAsync(ongoingNotificationId); } catch (_) {}
        ongoingNotificationId = null;
      }
      if (activeNotificationId) {
        try {
          await Notifications.dismissNotificationAsync(activeNotificationId);
          await Notifications.cancelScheduledNotificationAsync(activeNotificationId);
        } catch (_) {}
        activeNotificationId = null;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('[NotificationService] cancelScheduledNotification error:', e);
    }
  },

  /**
   * Joue le son d'alerte (timer_end.wav) une seule fois et garantit l'absence de chevauchement.
   */
  async playTimerEndSound(): Promise<void> {
    try {
      // Arrêt immédiat de tout lecteur audio en cours
      if (currentAudioPlayer) {
        try {
          currentAudioPlayer.pause();
          currentAudioPlayer.remove();
        } catch (_) {}
        currentAudioPlayer = null;
      }

      const { createAudioPlayer } = await import('expo-audio');
      const player = createAudioPlayer(TIMER_SOUND);
      player.volume = 1.0;
      player.play();
      currentAudioPlayer = player;

      // Nettoyage après 3s (durée du bip ~0.4s)
      setTimeout(() => {
        try {
          if (currentAudioPlayer === player) {
            player.remove();
            currentAudioPlayer = null;
          }
        } catch (_) {}
      }, 3000);
    } catch (e) {
      console.warn('[NotificationService] Audio play error:', e);
    }
  },
};
