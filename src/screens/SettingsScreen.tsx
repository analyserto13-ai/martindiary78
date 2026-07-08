import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Platform, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { PinInput } from '../components/PinInput';
import { APP_THEME } from '../utils/colors';
import {
  SOUND_OPTIONS,
  getReminderSoundLabel,
  saveReminderSound,
  SoundOption,
} from '../utils/notifications';

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
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [currentSound, setCurrentSound] = useState('Default');

  // Load saved reminder sound on mount
  useEffect(() => {
    (async () => {
      const label = await getReminderSoundLabel();
      setCurrentSound(label);
    })();
  }, []);

  const handleSoundSelect = async (option: SoundOption) => {
    await saveReminderSound(option.label);
    setCurrentSound(option.label);
    setShowSoundPicker(false);
  };

  const getSoundIcon = (label: string): keyof typeof Ionicons.glyphMap => {
    switch (label) {
      case 'Default': return 'volume-medium-outline';
      case 'Bell': return 'notifications-outline';
      case 'Chime': return 'musical-notes-outline';
      case 'Alarm': return 'alarm-outline';
      case 'Vibrate Only': return 'phone-portrait-outline';
      default: return 'volume-medium-outline';
    }
  };

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

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowSoundPicker(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name={getSoundIcon(currentSound)} size={22} color={APP_THEME.primary} />
              <Text style={styles.settingText}>Reminder Sound</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.soundValue}>{currentSound}</Text>
              <Ionicons name="chevron-forward" size={20} color={APP_THEME.textSecondary} />
            </View>
          </TouchableOpacity>
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

      {/* Sound Picker Modal */}
      <Modal
        visible={showSoundPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSoundPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSoundPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reminder Sound</Text>
            <Text style={styles.modalSubtitle}>Choose a notification sound</Text>
            <FlatList
              data={SOUND_OPTIONS}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.soundOption,
                    currentSound === item.label && styles.soundOptionSelected,
                  ]}
                  onPress={() => handleSoundSelect(item)}
                >
                  <Ionicons
                    name={getSoundIcon(item.label)}
                    size={24}
                    color={currentSound === item.label ? APP_THEME.primary : APP_THEME.text}
                  />
                  <Text
                    style={[
                      styles.soundOptionText,
                      currentSound === item.label && styles.soundOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {currentSound === item.label && (
                    <Ionicons name="checkmark-circle" size={24} color={APP_THEME.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  soundValue: {
    fontSize: 15,
    color: APP_THEME.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP_THEME.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: APP_THEME.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_THEME.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: APP_THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  soundOptionSelected: {
    backgroundColor: APP_THEME.background,
  },
  soundOptionText: {
    flex: 1,
    fontSize: 16,
    color: APP_THEME.text,
    fontWeight: '500',
  },
  soundOptionTextSelected: {
    color: APP_THEME.primary,
    fontWeight: '700',
  },
});