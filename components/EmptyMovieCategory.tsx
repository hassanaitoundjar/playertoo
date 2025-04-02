import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyMovieCategoryProps {
  categoryName?: string;
  onRetry?: () => void;
  onBrowseAll?: () => void;
}

const EmptyMovieCategory = ({ 
  categoryName = 'this category', 
  onRetry, 
  onBrowseAll 
}: EmptyMovieCategoryProps) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons 
        name="film-outline" 
        size={70} 
        color={isDark ? '#555' : '#ddd'} 
      />
      
      <Text style={[styles.title, { color: colors?.text }]}>
        No Movies Found
      </Text>
      
      <Text style={[styles.message, { color: isDark ? '#999' : '#666' }]}>
        There are no movies available in {categoryName}.
        This could be due to:
      </Text>
      
      <View style={styles.reasonsContainer}>
        <Text style={[styles.reason, { color: isDark ? '#999' : '#666' }]}>
          • The category is empty on your provider
        </Text>
        <Text style={[styles.reason, { color: isDark ? '#999' : '#666' }]}>
          • Your subscription doesn't include this content
        </Text>
        <Text style={[styles.reason, { color: isDark ? '#999' : '#666' }]}>
          • There was an error loading the content
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors?.primary || '#2196F3' }]}
            onPress={onRetry}
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        
        {onBrowseAll && (
          <TouchableOpacity 
            style={[styles.button, { 
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: colors?.primary || '#2196F3' 
            }]}
            onPress={onBrowseAll}
          >
            <Ionicons 
              name="grid-outline" 
              size={18} 
              color={colors?.primary || '#2196F3'} 
            />
            <Text style={[styles.buttonText, { color: colors?.primary || '#2196F3' }]}>
              Browse All Movies
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  reasonsContainer: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  reason: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default EmptyMovieCategory; 