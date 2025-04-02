import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { xtreamApi } from '../services/api';
import { MovieDetail } from '../types';

interface MovieDetailsProps {
  movieId: number;
}

const BasicMovieDetails = ({ movieId }: MovieDetailsProps) => {
  const [movieDetail, setMovieDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching movie details for ID: ${movieId}`);
        
        // Use our enhanced method that parses Dart-compatible structures
        const details = await xtreamApi.getMovieDetailsImproved(movieId);
        
        if (details && (details.info || details.movie_data)) {
          console.log(`Successfully loaded movie details`);
          setMovieDetail(details);
        } else {
          console.log('No movie details found');
          setError('Movie details not available');
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  const handlePlayMovie = () => {
    if (!movieDetail) return;
    
    // Get optimal streaming URL based on container extension
    const streamUrl = xtreamApi.getOptimalMovieStreamingUrl(movieDetail);
    console.log("Play movie URL:", streamUrl);
    
    // In a real app, you would navigate to your video player here
    // For example: navigation.navigate('Player', { streamUrl, title: movieDetail.movie_data?.name });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (error || !movieDetail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Movie not available'}</Text>
        <TouchableOpacity 
          style={styles.tryAgainButton}
          onPress={() => setLoading(true)} // This will trigger the useEffect again
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { info, movie_data } = movieDetail;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{movie_data?.name || 'Unknown Title'}</Text>
      
      <View style={styles.contentRow}>
        <Image 
          source={{ uri: info?.movie_image }} 
          style={styles.poster} 
          resizeMode="cover"
        />
        
        <View style={styles.detailsContainer}>
          {info?.rating && (
            <Text style={styles.rating}>Rating: {info.rating}</Text>
          )}
          
          {info?.genre && (
            <Text style={styles.genre}>Genre: {info.genre}</Text>
          )}
          
          {info?.duration && (
            <Text style={styles.duration}>Duration: {info.duration}</Text>
          )}
          
          {info?.releasedate && (
            <Text style={styles.year}>
              Year: {new Date(info.releasedate).getFullYear()}
            </Text>
          )}
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayMovie}
          >
            <Text style={styles.playButtonText}>Play Movie</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {info?.plot && (
        <View style={styles.plotContainer}>
          <Text style={styles.plotTitle}>Plot</Text>
          <Text style={styles.plotText}>{info.plot}</Text>
        </View>
      )}
      
      {info?.director && (
        <Text style={styles.castText}>Director: {info.director}</Text>
      )}
      
      {info?.cast && (
        <Text style={styles.castText}>Cast: {info.cast}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  loader: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 14,
    marginBottom: 4,
  },
  genre: {
    fontSize: 14,
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    marginBottom: 8,
  },
  playButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  plotContainer: {
    marginVertical: 16,
  },
  plotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  plotText: {
    fontSize: 14,
    lineHeight: 20,
  },
  castText: {
    fontSize: 14,
    marginBottom: 8,
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

export default BasicMovieDetails; 