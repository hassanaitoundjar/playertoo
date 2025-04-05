import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { xtreamApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { SeriesInfo, SeriesSeason, SeriesEpisode } from '../../types';
import { FavoritesService } from '../../services/favorites';

const { width, height } = Dimensions.get('window');

export default function SeriesDetailScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const seriesId = typeof params.seriesId === 'string' ? parseInt(params.seriesId, 10) : 0;
  
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [seasons, setSeasons] = useState<SeriesSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<SeriesSeason | null>(null);
  const [episodes, setEpisodes] = useState<SeriesEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    // Load series details when screen mounts
    loadSeriesDetails();
    checkFavoriteStatus();
  }, [seriesId]);
  
  // When a season is selected, load its episodes
  useEffect(() => {
    if (selectedSeason) {
      loadEpisodes(selectedSeason.season_number);
    }
  }, [selectedSeason]);
  
  const loadSeriesDetails = async () => {
    try {
      if (!seriesId) {
        setError('Invalid series ID');
        setLoading(false);
        return;
      }
      
      // Fetch series details
      const seriesInfo = await xtreamApi.getSeriesInfo(seriesId);
      
      if (seriesInfo) {
        setSeries(seriesInfo);
        
        // Get seasons from the series info
        const seriesSeasons = await xtreamApi.getSeriesSeasons(seriesId);
        if (seriesSeasons && seriesSeasons.length > 0) {
          setSeasons(seriesSeasons);
          setSelectedSeason(seriesSeasons[0]); // Select first season by default
        }
      } else {
        setError('Series not found');
      }
    } catch (error) {
      console.error('Error loading series details:', error);
      setError('Failed to load series. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadEpisodes = async (seasonNumber: number) => {
    setEpisodesLoading(true);
    try {
      const seasonEpisodes = await xtreamApi.getSeriesEpisodes(seriesId, seasonNumber);
      if (seasonEpisodes) {
        setEpisodes(seasonEpisodes);
      } else {
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Error loading episodes:', error);
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  };
  
  const checkFavoriteStatus = async () => {
    if (!seriesId) return;
    
    const isSeriesFavorite = await FavoritesService.isFavorite(seriesId, 'series');
    setIsFavorite(isSeriesFavorite);
  };
  
  const handleBackPress = () => {
    router.back();
  };
  
  const handleSeasonSelect = (season: SeriesSeason) => {
    setSelectedSeason(season);
  };
  
  const handleEpisodePress = (episode: SeriesEpisode) => {
    router.push({
      pathname: '/series/player',
      params: {
        seriesId: seriesId.toString(),
        episodeId: episode.id.toString(),
        seasonNum: selectedSeason?.season_number.toString() || '1',
        episodeNum: episode.episode_num.toString(),
        title: `${series?.info.name} - S${selectedSeason?.season_number || 1}E${episode.episode_num}`,
      },
    });
  };
  
  const toggleFavorite = async () => {
    if (!series) return;
    
    if (isFavorite) {
      await FavoritesService.removeFavorite(seriesId, 'series');
    } else {
      await FavoritesService.addFavorite({
        id: seriesId,
        type: 'series',
        name: series.info.name,
        stream_icon: series.info.cover,
      });
    }
    
    // Update favorite status
    setIsFavorite(!isFavorite);
  };
  
  const renderSeasonItem = ({ item }: { item: SeriesSeason }) => {
    const isSelected = selectedSeason?.season_number === item.season_number;
    
    return (
      <TouchableOpacity
        style={[
          styles.seasonItem,
          isSelected && { backgroundColor: colors.primary + '40' },
          { borderColor: isDark ? '#444' : '#ddd' }
        ]}
        onPress={() => handleSeasonSelect(item)}
      >
        <Text style={[styles.seasonText, { color: isSelected ? colors.primary : colors.text }]}>
          Season {item.season_number}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderEpisodeItem = ({ item }: { item: SeriesEpisode }) => {
    return (
      <TouchableOpacity
        style={[styles.episodeItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}
        onPress={() => handleEpisodePress(item)}
      >
        <View style={styles.episodeImageContainer}>
          {item.info && item.info.movie_image ? (
            <Image
              source={{ uri: item.info.movie_image || undefined }}
              defaultSource={require('../../assets/images/placeholder.png')}
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          headerShown: false,
          title: series?.info.name || 'Series Detail',
          animation: 'slide_from_right',
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading series details...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : series ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Series Cover and Gradient Overlay */}
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: series.info.cover }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.coverGradient}
            />
            <TouchableOpacity
              style={styles.backButtonOverlay}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Series Details */}
          <View style={styles.detailsContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {series.info.name}
            </Text>
            
            <View style={styles.metaRow}>
              {series.info.releaseDate && (
                <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                  {new Date(series.info.releaseDate).getFullYear()}
                </Text>
              )}
              
              {series.info.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                    {series.info.rating}
                  </Text>
                </View>
              )}
              
              {seasons.length > 0 && (
                <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                  {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
                </Text>
              )}
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity
              style={[styles.favoriteButton, { borderColor: isDark ? '#444' : '#ddd' }]}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? colors.primary : isDark ? '#fff' : '#000'}
              />
              <Text style={[styles.favoriteText, { color: colors.text }]}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
            
            {/* Series Info */}
            {series.info.plot && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {series.info.plot}
                </Text>
              </View>
            )}
            
            {series.info.cast && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Cast</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {series.info.cast}
                </Text>
              </View>
            )}
            
            {series.info.genre && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Genre</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {series.info.genre}
                </Text>
              </View>
            )}
            
            {/* Seasons Selector */}
            <View style={styles.seasonSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Seasons</Text>
              <FlatList
                data={seasons}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderSeasonItem}
                keyExtractor={(item) => `season-${item.season_number}`}
                contentContainerStyle={styles.seasonsContainer}
              />
            </View>
            
            {/* Episodes List */}
            <View style={styles.episodesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Episodes{selectedSeason ? ` - Season ${selectedSeason.season_number}` : ''}
              </Text>
              
              {episodesLoading ? (
                <View style={styles.episodesLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading episodes...
                  </Text>
                </View>
              ) : episodes.length === 0 ? (
                <Text style={[styles.noEpisodesText, { color: isDark ? '#999' : '#666' }]}>
                  No episodes available for this season
                </Text>
              ) : (
                episodes.map(episode => renderEpisodeItem({ item: episode }))
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Series not available
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    width: width,
    height: height * 0.4,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  favoriteText: {
    marginLeft: 8,
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  seasonSection: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  seasonsContainer: {
    paddingBottom: 8,
  },
  seasonItem: {
    padding: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  seasonText: {
    fontSize: 14,
  },
  episodesSection: {
    marginTop: 8,
  },
  episodesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  noEpisodesText: {
    fontSize: 14,
    paddingVertical: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 