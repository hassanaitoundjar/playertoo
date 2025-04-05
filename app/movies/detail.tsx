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
  Share,
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { xtreamApi } from '../../services/api';
import { VideoPlayer } from '../../components/Player/VideoPlayer';
import { useTheme } from '../../context/ThemeContext';
import { VodInfo, VodStream } from '../../types';
import { FavoritesService } from '../../services/favorites';

const { width, height } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const vodId = typeof params.vodId === 'string' ? parseInt(params.vodId, 10) : 0;
  
  const [movie, setMovie] = useState<VodInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    // Load movie details when screen mounts
    loadMovieDetails();
    checkFavoriteStatus();
  }, [vodId]);
  
  const loadMovieDetails = async () => {
    try {
      if (!vodId) {
        setError('Invalid movie ID');
        setLoading(false);
        return;
      }
      
      // Fetch movie details
      const vodInfo = await xtreamApi.getVodInfo(vodId);
      
      if (vodInfo) {
        setMovie(vodInfo);
      } else {
        setError('Movie not found');
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
      setError('Failed to load movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const checkFavoriteStatus = async () => {
    if (!vodId) return;
    
    const isMovieFavorite = await FavoritesService.isFavorite(vodId, 'vod');
    setIsFavorite(isMovieFavorite);
  };
  
  const handlePlayPress = () => {
    setIsPlaying(true);
  };
  
  const handleClosePlayer = () => {
    setIsPlaying(false);
  };
  
  const handleBackPress = () => {
    router.back();
  };
  
  const handlePlayerError = (errorMessage: string) => {
    setIsPlaying(false);
    setError(`Playback error: ${errorMessage}`);
  };
  
  const toggleFavorite = async () => {
    if (!movie) return;
    
    if (isFavorite) {
      await FavoritesService.removeFavorite(vodId, 'vod');
    } else {
      await FavoritesService.addFavorite({
        id: vodId,
        type: 'vod',
        name: movie.movie_data.name,
        stream_icon: movie.movie_data.stream_icon,
      });
    }
    
    // Update favorite status
    setIsFavorite(!isFavorite);
  };
  
  const handleShare = async () => {
    if (!movie) return;
    
    try {
      await Share.share({
        message: `Check out this movie: ${movie.movie_data.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Get stream URL
  const getStreamUrl = () => {
    if (!movie) return '';
    return xtreamApi.getVodStreamingUrl(movie.movie_data.stream_id);
  };
  
  if (isPlaying && movie) {
    return (
      <VideoPlayer
        source={{ 
          uri: getStreamUrl(),
          headers: xtreamApi.getStreamHeaders()
        }}
        title={movie.movie_data.name}
        onClose={handleClosePlayer}
        onError={handlePlayerError}
        streamId={movie.movie_data.stream_id}
        streamType="vod"
        posterSource={movie.info.movie_image ? { uri: movie.info.movie_image } : undefined}
      />
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          headerShown: false,
          title: movie?.movie_data.name || 'Movie Detail',
          animation: 'slide_from_right',
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading movie details...
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
      ) : movie ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Movie Poster and Gradient Overlay */}
          <View style={styles.posterContainer}>
            <Image
              source={{ uri: (movie.info.movie_image || movie.movie_data.stream_icon) || undefined }}
              defaultSource={require('../../assets/images/placeholder.png')}
              style={styles.posterImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.posterGradient}
            />
            <TouchableOpacity
              style={styles.backButtonOverlay}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Movie Details */}
          <View style={styles.detailsContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {movie.movie_data.name}
            </Text>
            
            <View style={styles.metaRow}>
              {movie.info.releaseDate && (
                <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                  {new Date(movie.info.releaseDate).getFullYear()}
                </Text>
              )}
              
              {movie.info.duration && (
                <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                  {movie.info.duration}
                </Text>
              )}
              
              {movie.info.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                    {movie.info.rating}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                onPress={handlePlayPress}
              >
                <Ionicons name="play" size={20} color="white" />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: isDark ? '#444' : '#ddd' }]}
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={isFavorite ? colors.primary : isDark ? '#fff' : '#000'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.iconButton, { borderColor: isDark ? '#444' : '#ddd' }]}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={isDark ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>
            
            {/* Movie Info */}
            {movie.info.genre && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Genre</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {movie.info.genre}
                </Text>
              </View>
            )}
            
            {movie.info.plot && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Plot</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {movie.info.plot}
                </Text>
              </View>
            )}
            
            {movie.info.director && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Director</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {movie.info.director}
                </Text>
              </View>
            )}
            
            {movie.info.cast && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Cast</Text>
                <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
                  {movie.info.cast}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Movie not available
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
  posterContainer: {
    width: width,
    height: height * 0.5,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterGradient: {
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
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 16,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoSection: {
    marginBottom: 16,
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