import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { PriorityLevel } from '../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../utils/colors';

interface ColorSelectorProps {
  selected: PriorityLevel;
  onSelect: (priority: PriorityLevel) => void;
}

export function ColorSelector({ selected, onSelect }: ColorSelectorProps) {
  const priorities: PriorityLevel[] = ['low', 'medium', 'high'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {priorities.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.item,
              { backgroundColor: PRIORITY_COLORS[p] },
              selected === p && styles.selected,
            ]}
            onPress={() => onSelect(p)}
          >
            <Text style={styles.itemText}>{PRIORITY_LABELS[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#212121',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  itemText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});