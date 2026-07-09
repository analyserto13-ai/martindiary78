import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  TouchableOpacity, Alert, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DiaryEntry } from '../types';
import { getEntryById, deleteEntry } from '../database/database';
import { PRIORITY_COLORS, PRIORITY_BG_COLORS, PRIORITY_LABELS, APP_THEME } from '../utils/colors';

type EntryDetailNavigationProp = StackNavigationProp<RootStackParamList, 'EntryDetail'>;
type EntryDetailRouteProp = RouteProp<RootStackParamList, 'EntryDetail'>;

interface EntryDetailScreenProps {
  navigation: EntryDetailNavigationProp;
  route: EntryDetailRouteProp;
}

export function EntryDetailScreen({ navigation, route }: EntryDetailScreenProps) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.unloadAsync();
      }
    };
  }, []);

  const loadEntry = async () => {
    const data = await getEntryById(entryId);
    setEntry(data);
  };

  const handlePlayAudio = async () => {
    if (!entry?.audioUri) return;

    if (isPlaying && playerRef.current) {
      await playerRef.current.stopAsync();
      await playerRef.current.unloadAsync();
      playerRef.current = null;
      setIsPlaying(false);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: entry.audioUri },
        { shouldPlay: true }
      );
      playerRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          playerRef.current = null;
        }
      });
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(entryId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleOpenLink = async (url: string) => {
    const validUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
      const supported = await Linking.canOpenURL(validUrl);
      if (supported) {
        await Linking.openURL(validUrl);
      } else {
        Alert.alert('Error', `Cannot open link: ${validUrl}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const priorityColor = PRIORITY_COLORS[entry.priority];
  const priorityBg = PRIORITY_BG_COLORS[entry.priority];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewEntry', { entryId })}
            style={styles.headerBtn}
          >
            <Ionicons name="create-outline" size={22} color={APP_THEME.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color={APP_THEME.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Priority Banner */}
        <View style={[styles.priorityBanner, { backgroundColor: priorityBg, borderLeftColor: priorityColor }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {PRIORITY_LABELS[entry.priority]} Priority
          </Text>
        </View>

        {/* Title & Date */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{entry.title || 'Untitled'}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={APP_THEME.textSecondary} />
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Content */}
        {entry.content ? (
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>{entry.content}</Text>
          </View>
        ) : null}

        {/* Photos */}
        {entry.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {entry.photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Audio Recording */}
        {entry.audioUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Recording</Text>
            <View style={styles.audioPlayer}>
              <Ionicons name="musical-note" size={20} color={APP_THEME.primary} />
              <Text style={styles.audioLabel}>Audio recording</Text>
              <TouchableOpacity onPress={handlePlayAudio} style={styles.playBtn}>
                <Ionicons
                  name={isPlaying ? 'stop-circle' : 'play-circle'}
                  size={36}
                  color={APP_THEME.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Links */}
        {entry.links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            {entry.links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkItem}
                onPress={() => handleOpenLink(link)}
              >
                <Ionicons name="link-outline" size={18} color={APP_THEME.primary} />
                <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
                <Ionicons name="open-outline" size={16} color={APP_THEME.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reminder */}
        {entry.reminderDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder</Text>
            <View style={styles.reminderBadge}>
              <Ionicons name="alarm-outline" size={18} color="#FF7043" />
              <Text style={styles.reminderText}>
                {new Date(entry.reminderDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_THEME.background,
  },
  loadingText: {
    fontSize: 16,
    color: APP_THEME.textSecondary,
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
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  scrollView: {
    flex: 1,
  },
  priorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 5,
    gap: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: APP_THEME.surface,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: APP_THEME.text,
    lineHeight: 34,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  date: {
    fontSize: 14,
    color: APP_THEME.textSecondary,
    fontWeight: '500',
  },
  contentSection: {
    padding: 20,
    backgroundColor: APP_THEME.surface,
    marginTop: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: APP_THEME.text,
  },
  section: {
    padding: 20,
    backgroundColor: APP_THEME.surface,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.border,
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: APP_THEME.primary,
    textDecorationLine: 'underline',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    alignSelf: 'flex-start',
  },
  reminderText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  audioLabel: {
    flex: 1,
    fontSize: 14,
    color: APP_THEME.text,
    fontWeight: '500',
  },
  playBtn: {
    marginLeft: 'auto',
  },
});