import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DiaryEntry, PriorityLevel } from '../types';
import { insertEntry, updateEntry, getEntryById } from '../database/database';
import { ColorSelector } from '../components/ColorSelector';
import { PhotoPicker } from '../components/PhotoPicker';
import { scheduleReminder } from '../utils/notifications';
import { APP_THEME } from '../utils/colors';
import * as Linking from 'expo-linking';
import DateTimePicker from '@react-native-community/datetimepicker';

type NewEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewEntry'>;
type NewEntryScreenRouteProp = RouteProp<RootStackParamList, 'NewEntry'>;

interface NewEntryScreenProps {
  navigation: NewEntryScreenNavigationProp;
  route: NewEntryScreenRouteProp;
}

export function NewEntryScreen({ navigation, route }: NewEntryScreenProps) {
  const entryId = route.params?.entryId;
  const isEditing = !!entryId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && entryId) {
      loadEntry(entryId);
    }
  }, [entryId]);

  const loadEntry = async (id: string) => {
    const entry = await getEntryById(id);
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setDate(entry.date);
      setPriority(entry.priority);
      setPhotos(entry.photos);
      setLinks(entry.links.length > 0 ? entry.links : ['']);
      if (entry.reminderDate) {
        setHasReminder(true);
        setReminderDate(new Date(entry.reminderDate));
      }
    }
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const updateLink = (text: string, index: number) => {
    const updated = [...links];
    updated[index] = text;
    setLinks(updated);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for your entry.');
      return;
    }

    setSaving(true);

    const validLinks = links.filter((l) => l.trim().length > 0);
    const now = new Date().toISOString();
    const id = entryId || Date.now().toString();

    const entry: DiaryEntry = {
      id,
      title: title.trim(),
      content: content.trim(),
      date,
      priority,
      photos,
      links: validLinks,
      reminderDate: hasReminder ? reminderDate.toISOString() : null,
      createdAt: isEditing ? '' : now,
      updatedAt: now,
    };

    try {
      if (isEditing) {
        const existing = await getEntryById(id);
        if (existing) {
          entry.createdAt = existing.createdAt;
        }
        await updateEntry(entry);
      } else {
        entry.createdAt = now;
        await insertEntry(entry);
      }

      // Schedule reminder
      if (hasReminder && entry.reminderDate) {
        await scheduleReminder(entry.id, entry.title, new Date(entry.reminderDate));
      }

      navigation.goBack();
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setSaving(false);
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
            try {
              const { deleteEntry } = await import('../database/database');
              await deleteEntry(entryId!);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete entry.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={APP_THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Entry' : 'New Entry'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          <Text style={[styles.saveBtn, saving && styles.savingBtn]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Entry title..."
            placeholderTextColor="#BDBDBD"
            value={title}
            onChangeText={setTitle}
          />

          {/* Date */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={APP_THEME.textSecondary} />
            <Text style={styles.dateText}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Ionicons name="chevron-down" size={18} color={APP_THEME.textSecondary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(date + 'T00:00:00')}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS !== 'ios');
                if (selectedDate) {
                  setDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}

          {/* Color/Priority Selector */}
          <ColorSelector selected={priority} onSelect={setPriority} />

          {/* Content */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts..."
              placeholderTextColor="#BDBDBD"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Photos */}
          <PhotoPicker photos={photos} onPhotosChange={setPhotos} />

          {/* Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Links</Text>
              <TouchableOpacity onPress={addLink}>
                <Ionicons name="add-circle-outline" size={22} color={APP_THEME.primary} />
              </TouchableOpacity>
            </View>
            {links.map((link, index) => (
              <View key={index} style={styles.linkRow}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://..."
                  placeholderTextColor="#BDBDBD"
                  value={link}
                  onChangeText={(text) => updateLink(text, index)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity onPress={() => removeLink(index)}>
                  <Ionicons name="close-circle" size={22} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <View style={styles.reminderToggle}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alarm-outline" size={20} color={APP_THEME.textSecondary} />
                <Text style={[styles.sectionLabel, { marginLeft: 6 }]}>Reminder</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, hasReminder && styles.toggleActive]}
                onPress={() => setHasReminder(!hasReminder)}
              >
                <View style={[styles.toggleCircle, hasReminder && styles.toggleCircleActive]} />
              </TouchableOpacity>
            </View>

            {hasReminder && (
              <TouchableOpacity
                style={styles.reminderDateBtn}
                onPress={() => setShowReminderPicker(true)}
              >
                <Ionicons name="time-outline" size={18} color={APP_THEME.primary} />
                <Text style={styles.reminderDateText}>
                  {reminderDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            )}

            {showReminderPicker && (
              <DateTimePicker
                value={reminderDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowReminderPicker(Platform.OS !== 'ios');
                  if (selectedDate) {
                    setReminderDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Delete button (only in edit mode) */}
          {isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={APP_THEME.error} />
              <Text style={styles.deleteText}>Delete Entry</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_THEME.primary,
  },
  savingBtn: {
    color: '#BDBDBD',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_THEME.text,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.border,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: APP_THEME.text,
    fontWeight: '500',
  },
  section: {
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentInput: {
    backgroundColor: APP_THEME.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: APP_THEME.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: APP_THEME.border,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  linkInput: {
    flex: 1,
    backgroundColor: APP_THEME.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: APP_THEME.primary,
    borderWidth: 1,
    borderColor: APP_THEME.border,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: APP_THEME.primary,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  reminderDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: APP_THEME.border,
  },
  reminderDateText: {
    fontSize: 14,
    color: APP_THEME.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.error,
  },
});