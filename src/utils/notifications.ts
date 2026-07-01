import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Martin78 Diary Reminder',
      body: `🔔 "${title}"`,
      data: { entryId },
    },
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