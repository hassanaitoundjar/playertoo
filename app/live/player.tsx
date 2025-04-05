import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { xtreamApi } from '../../services/api';
import { VideoPlayer } from '../../components/Player/VideoPlayer';
import { useTheme } from '../../context/ThemeContext';
import { LiveStream } from '../../types';
import { black, white } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

export default function LivePlayerScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const streamId = typeof params.streamId === 'string' ? parseInt(params.streamId, 10) : 0;
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load stream details when screen mounts
    loadStreamDetails();
  }, [streamId]);
  
  const loadStreamDetails = async () => {
    try {
      if (!streamId) {
        setError('Invalid stream ID');
        setLoading(false);
        return;
      }
      
      // Fetch stream details from all streams
      const streams = await xtreamApi.getLiveStreams();
      const streamInfo = streams.find(s => s.stream_id === streamId);
      
      if (streamInfo) {
        setStream(streamInfo);
      } else {
        setError('Stream not found');
      }
    } catch (error) {
      console.error('Error loading stream details:', error);
      setError('Failed to load stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle player close
  const handleClose = () => {
    router.back();
  };
  
  // Handle player error
  const handleError = (errorMessage: string) => {
    setError(`Playback error: ${errorMessage}`);
  };

  // Get stream URL
  const getStreamUrl = () => {
    if (!stream) return null;
    return xtreamApi.getLiveStreamingUrl(stream.stream_id);
  };
  
  return (
    <View style={[styles.container]}>
      <StatusBar style="light" />

      
      <Stack.Screen
        options={{
          headerShown: false,
          title: stream?.name || 'Live TV',
          animation: 'slide_from_bottom',
        }}
      />
      
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            Loading Stream...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : stream ? (
        <VideoPlayer
          source={{ 
            uri: getStreamUrl() || '',
            headers: xtreamApi.getStreamHeaders()
          }}
          title={stream.name}
          onClose={handleClose}
          onError={handleError}
          streamId={stream.stream_id}
          streamType="live"
          posterSource={stream.stream_icon && stream.stream_icon.trim() !== '' ? { uri: stream.stream_icon } : undefined}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>
            Stream not available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ff5252',
  },
}); 