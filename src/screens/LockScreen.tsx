import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { PinInput } from '../components/PinInput';
import { APP_THEME } from '../utils/colors';

interface LockScreenProps {
  onUnlock: () => void;
}

const DEFAULT_PIN = '1234';
const STORAGE_KEY = 'app_pin_code';

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    try {
      const storedPin = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!storedPin) {
        // No PIN set yet — prompt user to set one
        setIsSettingPin(true);
      }
    } catch {
      // Fallback: if SecureStore fails, just use default
    }
  };

  const handlePinComplete = async (enteredPin: string) => {
    if (isSettingPin) {
      if (!confirmStep) {
        setNewPin(enteredPin);
        setConfirmStep(true);
        setPin('');
        setError('');
        return;
      } else {
        if (enteredPin === newPin) {
          await SecureStore.setItemAsync(STORAGE_KEY, enteredPin);
          onUnlock();
        } else {
          setError('PINs do not match. Try again.');
          setConfirmStep(false);
          setPin('');
          setNewPin('');
        }
        return;
      }
    }

    setPin(enteredPin);
    try {
      const storedPin = await SecureStore.getItemAsync(STORAGE_KEY);
      const validPin = storedPin || DEFAULT_PIN;
      if (enteredPin === validPin) {
        onUnlock();
      } else {
        setError('Incorrect PIN. Try again.');
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1500);
      }
    } catch {
      if (enteredPin === DEFAULT_PIN) {
        onUnlock();
      } else {
        setError('Incorrect PIN. Try again.');
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1500);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={APP_THEME.primary} />
        </View>

        <Text style={styles.appName}>Martin78 Diary</Text>

        {isSettingPin ? (
          <>
            <Text style={styles.title}>
              {confirmStep ? 'Confirm Your PIN' : 'Set Your PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {confirmStep
                ? 'Re-enter your new PIN to confirm'
                : 'Choose a 4-digit PIN to secure your diary'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter PIN</Text>
            <Text style={styles.subtitle}>Unlock your diary</Text>
          </>
        )}

        <View style={styles.pinSection}>
          <PinInput
            key={confirmStep ? 'confirm' : 'new'}
            length={4}
            onComplete={handlePinComplete}
            error={error}
          />
        </View>

        {!isSettingPin && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => Alert.alert('Reset PIN', 'Contact support to reset your PIN. Default PIN: 1234')}
          >
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        )}

        {isSettingPin && confirmStep && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setConfirmStep(false);
              setNewPin('');
              setPin('');
              setError('');
            }}
          >
            <Ionicons name="arrow-back" size={16} color={APP_THEME.textSecondary} />
            <Text style={styles.backText}> Go back</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.version}>v1.0.0</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: APP_THEME.primaryDark,
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_THEME.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: APP_THEME.textSecondary,
    marginBottom: 30,
  },
  pinSection: {
    marginBottom: 20,
  },
  forgotBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  forgotText: {
    color: APP_THEME.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backText: {
    color: APP_THEME.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    color: '#BDBDBD',
    fontSize: 12,
  },
});