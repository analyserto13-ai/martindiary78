import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { APP_THEME } from '../utils/colors';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinInput({ length = 4, onComplete, error }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.replace(/[^0-9]/g, '');
    setValues(newValues);

    // Auto-advance to next field
    if (newValues[index] && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const pin = newValues.join('');
    if (pin.length === length) {
      onComplete(pin);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {values.map((val, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.input, error ? styles.inputError : null]}
            value={val}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            selectTextOnFocus
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  input: {
    width: 60,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: APP_THEME.border,
    backgroundColor: APP_THEME.surface,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: APP_THEME.text,
  },
  inputError: {
    borderColor: APP_THEME.error,
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    color: APP_THEME.error,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});