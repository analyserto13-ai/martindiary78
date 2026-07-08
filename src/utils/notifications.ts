import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMINDER_SOUND_KEY = 'reminder_sound';

export interface SoundOption {
  label: string;
  soundValue: string | null;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { label: 'Default', soundValue: 'default' },
  { label: 'Bell', soundValue: 'bell' },
  { label: 'Chime', soundValue: 'chime' },
  { label: 'Alarm', soundValue: 'alarm' },
  { label: 'Vibrate Only', soundValue: null },
];

export async function getReminderSound(): Promise<string | null> {
  try {
    const saved = await SecureStore.getItemAsync(REMINDER_SOUND_KEY);
    if (!saved) return 'default';
    const option = SOUND_OPTIONS.find((o) => o.label === saved);
    return option ? option.soundValue : 'default';
  } catch {
    return 'default';
  }
}

export async function saveReminderSound(label: string): Promise<void> {
  await SecureStore.setItemAsync(REMINDER_SOUND_KEY, label);
}

export async function getReminderSoundLabel(): Promise<string> {
  try {
    const saved = await SecureStore.getItemAsync(REMINDER_SOUND_KEY);
    return saved || 'Default';
  } catch {
    return 'Default';
  }
}

export async function setupNotifications(): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5C6BC0',
    });
  }
}

export async function scheduleReminder(
  entryId: string,
  title: string,
  reminderDate: Date
): Promise<string | undefined> {
  await setupNotifications();

  const sound = await getReminderSound();

  const content: Notifications.NotificationContentInput = {
    title: 'Martin78 Diary Reminder',
    body: `🔔 "${title}"`,
    data: { entryId },
  };

  // Apply sound if not "Vibrate Only"
  if (sound !== null) {
    content.sound = sound;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return identifier;
}

export async function cancelReminder(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function formatReminderDate(date: Date): string {
  return date.toISOString();
}

export function parseReminderDate(dateString: string): Date {
  return new Date(dateString);
}