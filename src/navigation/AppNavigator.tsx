import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { NewEntryScreen } from '../screens/NewEntryScreen';
import { EntryDetailScreen } from '../screens/EntryDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  onLock: () => void;
}

export function AppNavigator({ onLock }: AppNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewEntry" component={NewEntryScreen} />
      <Stack.Screen name="EntryDetail" component={EntryDetailScreen} />
      <Stack.Screen name="Settings">
        {(props) => <SettingsScreen {...props} onLock={onLock} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}