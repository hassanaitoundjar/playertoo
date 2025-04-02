import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { xtreamApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { VodStream } from '../../types';
import MovieCategoryList from '../../components/MovieCategoryList';

export default function MovieCategoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get category ID and name from params
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const categoryName = typeof params.name === 'string' ? params.name : 'Movies';
  
  const [movies, setMovies] = useState<VodStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadMovies();
  }, [categoryId]);
  
  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading movies for category ID: ${categoryId}`);
      
      if (!categoryId) {
        throw new Error('Invalid category ID');
      }
      
      const vodStreams = await xtreamApi.getVodStreams(categoryId);
      
      console.log(`Loaded ${vodStreams.length} movies for category ${categoryName}`);
      setMovies(vodStreams);
    } catch (error) {
      console.error('Error loading movies:', error);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMoviePress = (movie: VodStream) => {
    router.push({
      pathname: '/movies/detail',
      params: { movieId: movie.stream_id.toString() }
    });
  };
  
  const handleBrowseAll = () => {
    // Navigate to all movies screen
    router.push('/movies');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: categoryName,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      
      <MovieCategoryList
        title={categoryName}
        movies={movies}
        loading={loading}
        error={error}
        onMoviePress={handleMoviePress}
        onRetry={loadMovies}
        onBrowseAll={handleBrowseAll}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 