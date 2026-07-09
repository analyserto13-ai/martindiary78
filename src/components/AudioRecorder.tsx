import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { APP_THEME } from '../utils/colors';

interface AudioRecorderProps {
  audioUri: string | null;
  onAudioChange: (uri: string | null) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioRecorder({ audioUri, onAudioChange }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<Audio.Sound | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request permissions on mount
  useEffect(() => {
    if (!permissionResponse?.granted) {
      requestPermission();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (durationTimer.current) clearInterval(durationTimer.current);
      if (playerRef.current) {
        playerRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        const perm = await requestPermission();
        if (!perm.granted) {
          alert('Microphone permission is required to record audio.');
          return;
        }
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      if (recordingTimer.current) clearInterval(recordingTimer.current);
      recordingTimer.current = null;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        onAudioChange(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const playAudio = async () => {
    try {
      if (!audioUri) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      playerRef.current = sound;

      setIsPlaying(true);
      setDuration(0);

      // Get duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(Math.floor(status.durationMillis / 1000));
      }

      // Start playback timer
      let elapsed = 0;
      durationTimer.current = setInterval(() => {
        elapsed++;
        setDuration((prev) => prev - 1);
        if (elapsed >= (duration || 0)) {
          clearInterval(durationTimer.current!);
          durationTimer.current = null;
          setIsPlaying(false);
        }
      }, 1000);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          if (durationTimer.current) clearInterval(durationTimer.current);
          durationTimer.current = null;
        }
      });
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
    }
  };

  const stopAudio = async () => {
    if (playerRef.current) {
      await playerRef.current.stopAsync();
      await playerRef.current.unloadAsync();
      playerRef.current = null;
    }
    setIsPlaying(false);
    if (durationTimer.current) clearInterval(durationTimer.current);
    durationTimer.current = null;
  };

  const removeAudio = () => {
    stopAudio();
    onAudioChange(null);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mic-outline" size={20} color={APP_THEME.textSecondary} />
        <Text style={styles.label}>Voice Recording</Text>
      </View>

      <View style={styles.controls}>
        {!audioUri && !isRecording && (
          <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
            <Ionicons name="mic" size={24} color="#FFFFFF" />
            <Text style={styles.recordBtnText}>Record</Text>
          </TouchableOpacity>
        )}

        {isRecording && (
          <View style={styles.recordingActive}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                Recording... {formatDuration(recordingDuration)}
              </Text>
            </View>
            <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
              <Ionicons name="stop" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {audioUri && !isRecording && (
          <View style={styles.audioPlayer}>
            <Ionicons
              name="musical-note"
              size={20}
              color={APP_THEME.primary}
            />
            <Text style={styles.audioLabel}>Audio recording</Text>

            <TouchableOpacity
              style={styles.playBtn}
              onPress={isPlaying ? stopAudio : playAudio}
            >
              <Ionicons
                name={isPlaying ? 'stop-circle' : 'play-circle'}
                size={36}
                color={APP_THEME.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.removeBtn} onPress={removeAudio}>
              <Ionicons name="trash-outline" size={20} color={APP_THEME.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controls: {
    backgroundColor: APP_THEME.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_THEME.border,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  recordingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E53935',
  },
  recordingText: {
    fontSize: 15,
    color: APP_THEME.text,
    fontWeight: '600',
  },
  stopBtn: {
    backgroundColor: '#E53935',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  removeBtn: {
    padding: 4,
  },
});