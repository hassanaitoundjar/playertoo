import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { VodStream } from '../types';
import EmptyMovieCategory from './EmptyMovieCategory';
import MovieCard from './MovieCard';

interface MovieCategoryListProps {
  title?: string;
  movies: VodStream[];
  loading: boolean;
  error?: string | null;
  onMoviePress: (movie: VodStream) => void;
  onRetry?: () => void;
  onBrowseAll?: () => void;
}

const { width } = Dimensions.get('window');
const numColumns = Math.floor(width / 150); // Adjust based on your card width

const MovieCategoryList = ({
  title,
  movies,
  loading,
  error,
  onMoviePress,
  onRetry,
  onBrowseAll
}: MovieCategoryListProps) => {
  const { colors, isDark } = useTheme();

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading movies...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <EmptyMovieCategory
        categoryName={title || "this category"}
        onRetry={onRetry}
        onBrowseAll={onBrowseAll}
      />
    );
  }

  // Render empty state
  if (!movies || movies.length === 0) {
    return (
      <EmptyMovieCategory
        categoryName={title || "this category"}
        onRetry={onRetry}
        onBrowseAll={onBrowseAll}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      )}
      
      <FlatList
        data={movies}
        keyExtractor={(item) => item.stream_id.toString()}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() => onMoviePress(item)}
            style={styles.movieCard}
          />
        )}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  movieCard: {
    width: (width - 40) / numColumns,
    margin: 4,
    height: 200,
  }
});

export default MovieCategoryList; 