import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { xtreamApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SeriesEpisode } from '../types';

interface SeriesEpisodesProps {
  seriesId: number;
  seasonNumber: number;
  onEpisodePress: (episode: SeriesEpisode) => void;
}

const SeriesEpisodesComponent = ({ seriesId, seasonNumber, onEpisodePress }: SeriesEpisodesProps) => {
  const { colors, isDark } = useTheme();
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEpisodes();
  }, [seriesId, seasonNumber]);

  const fetchEpisodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching episodes for Series ID: ${seriesId}, Season: ${seasonNumber}`);
      
      // First try the improved method which handles Dart-compatible structures
      const episodesData = await xtreamApi.getSeriesEpisodesImproved(seriesId, seasonNumber);
      
      if (episodesData && episodesData.length > 0) {
        // Check for NOBRIDGE format indicators
        const isNoBridgeFormat = episodesData.some(episode => 
          (episode.title && episode.title.includes("NOBRIDGE")) ||
          (episode.info?.plot && episode.info.plot.includes("NOBRIDGE")) ||
          (episode.id === "1" && episode.info?.plot?.includes("information unavailable"))
        );
        
        if (isNoBridgeFormat) {
          console.log('NOBRIDGE format detected in episodes');
          setError('NOBRIDGE format detected');
          setEpisodes([]);
        } else {
          console.log(`Successfully loaded ${episodesData.length} episodes`);
          setEpisodes(episodesData);
        }
      } else {
        console.log('No episodes found for this season');
        setError('No episodes found for this season');
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
      setError('Failed to load episodes');
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const renderEpisodeItem = ({ item }: { item: SeriesEpisode }) => {
    return (
      <TouchableOpacity
        style={[styles.episodeItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}
        onPress={() => onEpisodePress(item)}
      >
        <View style={styles.episodeImageContainer}>
          {item.info && item.info.movie_image ? (
            <Image
              source={{ uri: item.info.movie_image || undefined }}
              defaultSource={require('../assets/images/placeholder.png')}
              style={styles.episodeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.episodePlaceholder, { backgroundColor: isDark ? '#333' : '#ddd' }]}>
              <Ionicons name="videocam" size={24} color={isDark ? '#555' : '#999'} />
            </View>
          )}
        </View>

        <View style={styles.episodeDetails}>
          <Text style={[styles.episodeTitle, { color: colors.text }]}>
            {item.title || `Episode ${item.episode_num}`}
          </Text>
          {item.info && item.info.plot && (
            <Text
              style={[styles.episodeDescription, { color: isDark ? '#999' : '#666' }]}
              numberOfLines={2}
            >
              {item.info.plot}
            </Text>
          )}
          <Text style={[styles.episodeInfo, { color: isDark ? '#777' : '#888' }]}>
            {item.info && item.info.duration ? `${item.info.duration} • ` : ''}
            Episode {item.episode_num}
          </Text>
        </View>
        
        <Ionicons name="play-circle-outline" size={32} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading episodes...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color={isDark ? '#666' : '#999'} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
        {error.includes('NOBRIDGE') && (
          <Text style={[styles.errorSubtext, { color: isDark ? '#999' : '#666' }]}>
            Your IPTV provider appears to be using the NOBRIDGE format, which has limited support for series content.
            This is a limitation of your provider, not the app. You can try:
            {'\n\n'}• Selecting a different season
            {'\n'}• Trying other series that might be more compatible 
            {'\n'}• Contacting your provider for series support details
          </Text>
        )}
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={fetchEpisodes}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {episodes.length > 0 ? (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEpisodeItem}
          contentContainerStyle={styles.episodeList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noEpisodesContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={isDark ? '#666' : '#999'} />
          <Text style={[styles.noEpisodesText, { color: colors.text }]}>
            No episodes found for this season
          </Text>
          <Text style={[styles.noEpisodesSubtext, { color: isDark ? '#999' : '#666' }]}>
            Try another season or series.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noEpisodesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noEpisodesText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  noEpisodesSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  episodeList: {
    paddingVertical: 8,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  episodeImageContainer: {
    width: 120,
    height: 68,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  episodeImage: {
    width: '100%',
    height: '100%',
  },
  episodePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeDetails: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  episodeDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  episodeInfo: {
    fontSize: 12,
  },
});

export default SeriesEpisodesComponent; 