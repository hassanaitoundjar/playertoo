import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { xtreamApi } from '../../services/api';
import { VideoPlayer } from '../../components/Player/VideoPlayer';
import { useTheme } from '../../context/ThemeContext';
import { HistoryService } from '../../services/history';

export default function SeriesPlayerScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract params with type safety
  const seriesId = typeof params.seriesId === 'string' ? parseInt(params.seriesId, 10) : 0;
  const episodeId = typeof params.episodeId === 'string' ? params.episodeId : '';
  const seasonNum = typeof params.seasonNum === 'string' ? parseInt(params.seasonNum, 10) : 1;
  const episodeNum = typeof params.episodeNum === 'string' ? parseInt(params.episodeNum, 10) : 1;
  const title = typeof params.title === 'string' ? params.title : 'Episode';
  
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState<number | null>(null);
  
  useEffect(() => {
    // Load episode details and prepare for playback
    loadEpisodeDetails();
    getLastPlaybackPosition();
  }, [episodeId]);
  
  const loadEpisodeDetails = async () => {
    try {
      if (!episodeId) {
        setError('Invalid episode ID');
        setLoading(false);
        return;
      }
      
      // Get streaming URL for the episode
      const url = xtreamApi.getSeriesStreamingUrl(parseInt(episodeId));
      setStreamUrl(url);
    } catch (error) {
      console.error('Error loading episode details:', error);
      setError('Failed to load episode. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getLastPlaybackPosition = async () => {
    try {
      if (!seriesId || !seasonNum || !episodeNum) return;
      
      const position = await HistoryService.getPlaybackPosition(
        seriesId,
        'series',
        seasonNum,
        episodeNum
      );
      
      if (position) {
        setLastPosition(position);
      }
    } catch (error) {
      console.error('Error fetching playback position:', error);
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
  
  // Add to watch history when playback starts
  useEffect(() => {
    if (streamUrl && !loading && !error) {
      // Add to watch history
      HistoryService.addToHistory({
        id: seriesId,
        type: 'series',
        name: title,
        timestamp: Date.now(),
        series_id: seriesId,
        season: seasonNum,
        episode_num: episodeNum,
      });
    }
  }, [streamUrl, loading, error]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          headerShown: false,
          title: title,
          animation: 'slide_from_bottom',
        }}
      />
      
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading episode...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : streamUrl ? (
        <VideoPlayer
          source={{ 
            uri: streamUrl,
            headers: xtreamApi.getStreamHeaders() 
          }}
          title={title}
          onClose={handleClose}
          onError={handleError}
          initialPosition={lastPosition || 0}
          streamId={parseInt(episodeId)}
          streamType="series"
          episodeInfo={{
            seriesId,
            season: seasonNum,
            episodeNum: episodeNum,
          }}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Episode not available
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 