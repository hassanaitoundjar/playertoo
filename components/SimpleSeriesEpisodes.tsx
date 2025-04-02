import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { xtreamApi } from '../services/api';
import { SeriesEpisode } from '../types';

interface SeriesEpisodesProps {
  seriesId: number;
  seasonNumber?: number;
}

const SimpleSeriesEpisodes = ({ seriesId, seasonNumber = 1 }: SeriesEpisodesProps) => {
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        console.log(`Fetching episodes for Series ID: ${seriesId}, Season: ${seasonNumber}`);
        
        // Use our enhanced method that supports various API formats including Dart-compatible ones
        const episodesData = await xtreamApi.getSeriesEpisodesImproved(seriesId, seasonNumber);
        
        if (episodesData && episodesData.length > 0) {
          console.log(`Successfully loaded ${episodesData.length} episodes`);
          setEpisodes(episodesData);
        } else {
          console.log('No episodes found for this season');
          setError('No episodes found for this season');
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
        setError('Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [seriesId, seasonNumber]);

  const handleEpisodePress = (episode: SeriesEpisode) => {
    // Generate streaming URL for this episode
    const streamUrl = xtreamApi.getSeriesStreamingUrl(Number(episode.id));
    console.log("Play episode:", episode.title, "URL:", streamUrl);
    
    // In a real app, you would navigate to your video player here
    // For example: navigation.navigate('Player', { streamUrl, title: episode.title });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.tryAgainButton}
          onPress={() => setLoading(true)} // This will trigger the useEffect again
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Episodes</Text>
      
      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.episodeItem}
            onPress={() => handleEpisodePress(item)}
          >
            <Text style={styles.episodeTitle}>
              {item.title || `Episode ${item.episode_num}`}
            </Text>
            {item.info?.plot && (
              <Text style={styles.episodePlot} numberOfLines={2}>
                {item.info.plot}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  episodeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  episodePlot: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default SimpleSeriesEpisodes; 