import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { PinInput } from '../components/PinInput';
import { APP_THEME } from '../utils/colors';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsNavigationProp;
  onLock: () => void;
}

const STORAGE_KEY = 'app_pin_code';

export function SettingsScreen({ navigation, onLock }: SettingsScreenProps) {
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState('');

  const handlePinChangeFlow = async (pin: string) => {
    if (step === 'current') {
      try {
        const storedPin = await SecureStore.getItemAsync(STORAGE_KEY);
        if (pin === (storedPin || '1234')) {
          setCurrentPin(pin);
          setStep('new');
          setError('');
        } else {
          setError('Current PIN is incorrect');
          setTimeout(() => setError(''), 1500);
        }
      } catch {
        setError('Could not verify PIN');
      }
    } else if (step === 'new') {
      setNewPin(pin);
      setStep('confirm');
      setError('');
    } else if (step === 'confirm') {
      if (pin === newPin) {
        await SecureStore.setItemAsync(STORAGE_KEY, pin);
        Alert.alert('Success', 'Your PIN has been changed successfully.');
        setShowChangePin(false);
        setStep('current');
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
      } else {
        setError('PINs do not match');
        setTimeout(() => setError(''), 1500);
      }
    }
  };

  const getPinTitle = () => {
    switch (step) {
      case 'current': return 'Enter Current PIN';
      case 'new': return 'Enter New PIN';
      case 'confirm': return 'Confirm New PIN';
    }
  };

  const resetPinFlow = () => {
    setShowChangePin(false);
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              resetPinFlow();
              setShowChangePin(!showChangePin);
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={22} color={APP_THEME.primary} />
              <Text style={styles.settingText}>Change PIN Code</Text>
            </View>
            <Ionicons
              name={showChangePin ? 'chevron-up' : 'chevron-forward'}
              size={20}
              color={APP_THEME.textSecondary}
            />
          </TouchableOpacity>

          {showChangePin && (
            <View style={styles.pinSection}>
              <Text style={styles.pinTitle}>{getPinTitle()}</Text>
              <PinInput
                key={step}
                length={4}
                onComplete={handlePinChangeFlow}
                error={error}
              />
              <Text style={styles.pinHint}>
                {step === 'current'
                  ? 'Enter your existing PIN code'
                  : step === 'new'
                  ? 'Choose a new 4-digit PIN'
                  : 'Re-enter your new PIN'}
              </Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>Martin78 Diary</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>
              A private, secure, and beautiful diary app for daily journaling with
              colorful priority organization.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.settingItem} onPress={onLock}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={APP_THEME.text} />
              <Text style={styles.settingText}>Lock Diary</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={APP_THEME.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: APP_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.border,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_THEME.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: APP_THEME.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: APP_THEME.text,
    fontWeight: '500',
  },
  pinSection: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.text,
    marginBottom: 16,
  },
  pinHint: {
    fontSize: 13,
    color: APP_THEME.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  infoItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.border,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: APP_THEME.text,
    lineHeight: 22,
  },
});