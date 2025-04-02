import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { xtreamApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { MovieDetail } from '../types';

interface MovieDetailsProps {
  movieId: number;
  onPlayMovie: (streamUrl: string, movieDetails: MovieDetail) => void;
}

const SimpleMovieDetails = ({ movieId, onPlayMovie }: MovieDetailsProps) => {
  const { colors, isDark } = useTheme();
  const [movieDetails, setMovieDetails] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching movie details for ID: ${movieId}`);
      
      // Use our improved method that handles different API formats based on Dart model
      const details = await xtreamApi.getMovieDetailsImproved(movieId);
      
      if (details && (details.info || details.movie_data)) {
        console.log('Successfully loaded movie details');
        setMovieDetails(details);
      } else {
        console.log('No movie details found');
        setError('Movie details not available');
        setMovieDetails(null);
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setError('Failed to load movie details');
      setMovieDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMovie = () => {
    if (!movieDetails) return;
    
    // Get optimal streaming URL based on container extension
    const streamUrl = xtreamApi.getOptimalMovieStreamingUrl(movieDetails);
    
    if (streamUrl) {
      onPlayMovie(streamUrl, movieDetails);
    } else {
      setError('Unable to generate streaming URL');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors?.primary || "#0000ff"} />
        <Text style={[styles.loadingText, { color: colors?.text }]}>
          Loading movie details...
        </Text>
      </View>
    );
  }

  if (error || !movieDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color={isDark ? '#666' : '#999'} />
        <Text style={[styles.errorText, { color: colors?.error || "#ff0000" }]}>
          {error || 'Movie not available'}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors?.primary || "#0000ff" }]}
          onPress={fetchMovieDetails}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { info, movie_data } = movieDetails;
  
  return (
    <ScrollView style={styles.container}>
      {/* Movie Poster */}
      <View style={styles.posterContainer}>
        {info?.movie_image ? (
          <Image 
            source={{ uri: info.movie_image }} 
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: isDark ? '#333' : '#ddd' }]}>
            <Ionicons name="film" size={50} color={isDark ? '#555' : '#999'} />
          </View>
        )}
      </View>
      
      {/* Movie Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors?.text }]}>
          {movie_data?.name || info?.movie_image || 'Unknown Title'}
        </Text>
        
        {/* Meta data row */}
        <View style={styles.metaRow}>
          {info?.releasedate && (
            <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
              {new Date(info.releasedate).getFullYear()}
            </Text>
          )}
          
          {info?.duration && (
            <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
              {info.duration}
            </Text>
          )}
          
          {info?.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.metaText, { color: isDark ? '#999' : '#666' }]}>
                {info.rating}
              </Text>
            </View>
          )}
        </View>
        
        {/* Play Button */}
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: colors?.primary || "#0000ff" }]}
          onPress={handlePlayMovie}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.playButtonText}>Play Movie</Text>
        </TouchableOpacity>
        
        {/* Movie Plot */}
        {info?.plot && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors?.text }]}>Plot</Text>
            <Text style={[styles.plotText, { color: isDark ? '#999' : '#666' }]}>
              {info.plot}
            </Text>
          </View>
        )}
        
        {/* Movie Genre */}
        {info?.genre && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors?.text }]}>Genre</Text>
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              {info.genre}
            </Text>
          </View>
        )}
        
        {/* Movie Cast */}
        {info?.cast && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors?.text }]}>Cast</Text>
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              {info.cast}
            </Text>
          </View>
        )}
        
        {/* Movie Director */}
        {info?.director && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors?.text }]}>Director</Text>
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              {info.director}
            </Text>
          </View>
        )}
        
        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors?.text }]}>Technical Details</Text>
          <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
            Format: {movie_data?.container_extension || 'Unknown'}
            {info?.bitrate ? `, Bitrate: ${info.bitrate}` : ''}
            {info?.video?.width && info?.video?.height ? `, Resolution: ${info.video.width}x${info.video.height}` : ''}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  posterContainer: {
    width: '100%',
    height: 300,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
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
    marginRight: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 16,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  plotText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
  },
});

export default SimpleMovieDetails; 