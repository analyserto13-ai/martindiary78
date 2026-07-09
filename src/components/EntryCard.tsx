import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiaryEntry } from '../types';
import { PRIORITY_COLORS, PRIORITY_BG_COLORS, PRIORITY_LABELS } from '../utils/colors';

interface EntryCardProps {
  entry: DiaryEntry;
  onPress: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const priorityColor = PRIORITY_COLORS[entry.priority];
  const bgColor = PRIORITY_BG_COLORS[entry.priority];

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: priorityColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.title || 'Untitled'}
        </Text>
        <View style={[styles.badge, { backgroundColor: priorityColor }]}>
          <Text style={styles.badgeText}>{PRIORITY_LABELS[entry.priority]}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={2}>
        {entry.content || 'No content'}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={13} color="#757575" />
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.footerRight}>
          {entry.photos.length > 0 && (
            <View style={styles.iconWithCount}>
              <Ionicons name="image-outline" size={14} color="#757575" />
              <Text style={styles.count}>{entry.photos.length}</Text>
            </View>
          )}
          {entry.links.length > 0 && (
            <View style={styles.iconWithCount}>
              <Ionicons name="link-outline" size={14} color="#757575" />
              <Text style={styles.count}>{entry.links.length}</Text>
            </View>
          )}
          {entry.reminderDate && (
            <Ionicons name="alarm-outline" size={14} color="#FF7043" />
          )}
          {entry.audioUri && (
            <Ionicons name="mic-outline" size={14} color="#5C6BC0" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  content: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  date: {
    fontSize: 12,
    color: '#757575',
  },
  iconWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  count: {
    fontSize: 12,
    color: '#757575',
  },
});