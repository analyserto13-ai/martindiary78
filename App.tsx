import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { type EventSubscription } from 'expo-modules-core';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LockScreen } from './src/screens/LockScreen';
import { setupNotifications } from './src/utils/notifications';
import * as Notifications from 'expo-notifications';
import { StyleSheet } from 'react-native';

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const notificationListener = useRef<EventSubscription>(undefined);
  const responseListener = useRef<EventSubscription>(undefined);

  useEffect(() => {
    setupNotifications();

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.entryId) {
          console.log('Tapped notification for entry:', data.entryId);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLock = () => {
    setIsUnlocked(false);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          {isUnlocked ? (
            <AppNavigator onLock={handleLock} />
          ) : (
            <LockScreen onUnlock={handleUnlock} />
          )}
        </NavigationContainer>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});