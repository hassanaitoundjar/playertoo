import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { VodStream } from '../types';

interface MovieCardProps {
  movie: VodStream;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const MovieCard = ({ movie, onPress, style }: MovieCardProps) => {
  const { colors, isDark } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: colors.card },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Movie Poster */}
      {movie.stream_icon ? (
        <Image 
          source={{ uri: movie.stream_icon }} 
          style={styles.poster}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.posterPlaceholder, { backgroundColor: isDark ? '#333' : '#ddd' }]}>
          <Ionicons name="film-outline" size={30} color={isDark ? '#555' : '#999'} />
        </View>
      )}
      
      {/* Movie Info */}
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {movie.name}
        </Text>
        
        {/* Add category, year, or other metadata if available */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  poster: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  posterPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MovieCard; 