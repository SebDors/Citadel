import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Configuration de la gestion des notifications au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let activeNotificationId: string | null = null;
let soundObject: Audio.Sound | null = null;

export const NotificationService = {
  /**
   * Initialise les canaux de notifications Android et demande les permissions.
   */
  async init(): Promise<boolean> {
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
   */
  async scheduleTimerExpirationNotification(seconds: number, exerciseName?: string): Promise<void> {
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
   */
  async cancelScheduledNotification(): Promise<void> {
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
   */
  async playTimerEndSound(): Promise<void> {
    try {
      if (soundObject) {
        await soundObject.unloadAsync();
        soundObject = null;
      }

      // Configuration du mode audio pour retentir même en mode silencieux
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Bip sonore haute fréquence de notification (Audio Synthétique Base64 Data URI)
      const soundUri = 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUtvAAB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4';

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundObject = sound;
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },
};
