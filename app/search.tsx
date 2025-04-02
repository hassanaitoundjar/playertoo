import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { xtreamApi } from '../services/api';
import { LiveStream, VodStream, Series } from '../types';

interface SearchResult {
  id: number;
  name: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Debounce search to avoid making too many API calls
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    const timer = setTimeout(() => {
      performSearch();
    }, 500); // 500ms delay
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const performSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Search in live TV
      const liveStreams = await xtreamApi.getLiveStreams();
      const matchingLiveStreams = liveStreams
        .filter(stream => 
          stream.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(stream => ({
          id: stream.stream_id,
          name: stream.name,
          image: stream.stream_icon,
          type: 'live' as 'live',
        }));
      
      // Search in movies
      const movies = await xtreamApi.getVodStreams();
      const matchingMovies = movies
        .filter(movie => 
          movie.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(movie => ({
          id: movie.stream_id,
          name: movie.name,
          image: movie.stream_icon,
          type: 'vod' as 'vod',
        }));
      
      // Search in series
      const series = await xtreamApi.getSeries();
      const matchingSeries = series
        .filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(s => ({
          id: s.series_id,
          name: s.name,
          image: s.cover,
          type: 'series' as 'series',
        }));
      
      // Combine all results
      const combinedResults = [
        ...matchingLiveStreams,
        ...matchingMovies,
        ...matchingSeries
      ];
      
      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleResultPress = (item: SearchResult) => {
    if (item.type === 'live') {
      router.push({
        pathname: '/live/player',
        params: { streamId: item.id },
      });
    } else if (item.type === 'vod') {
      router.push({
        pathname: '/movies/detail',
        params: { vodId: item.id },
      });
    } else if (item.type === 'series') {
      router.push({
        pathname: '/series/detail',
        params: { seriesId: item.id },
      });
    }
  };
  
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? '#333' : '#ddd' }]}>
            <Ionicons 
              name={
                item.type === 'live' 
                  ? 'tv-outline' 
                  : item.type === 'vod' 
                  ? 'film-outline' 
                  : 'albums-outline'
              } 
              size={24} 
              color={isDark ? '#555' : '#999'} 
            />
          </View>
        )}
      </View>
      
      <View style={styles.resultDetails}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        
        <View style={styles.typeContainer}>
          <Ionicons 
            name={
              item.type === 'live' 
                ? 'radio-outline' 
                : item.type === 'vod' 
                ? 'film-outline' 
                : 'tv-outline'
            } 
            size={14} 
            color={colors.primary} 
            style={styles.typeIcon}
          />
          <Text style={[styles.typeText, { color: isDark ? '#999' : '#666' }]}>
            {item.type === 'live' ? 'Live TV' : item.type === 'vod' ? 'Movie' : 'Series'}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#999'} />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Search',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      
      <View style={[styles.searchBarContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search for content..."
          placeholderTextColor={isDark ? '#777' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={performSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')} 
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {isSearching ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            Searching...
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsList}
        />
      ) : hasSearched ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="search-outline" size={64} color={isDark ? '#555' : '#ddd'} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            No results found
          </Text>
          <Text style={[styles.hintText, { color: isDark ? '#777' : '#999' }]}>
            Try different keywords or check your spelling
          </Text>
        </View>
      ) : (
        <View style={styles.centeredContainer}>
          <Ionicons name="search-outline" size={64} color={isDark ? '#555' : '#ddd'} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            Search for TV channels, movies or series
          </Text>
          <Text style={[styles.hintText, { color: isDark ? '#777' : '#999' }]}>
            Enter at least 3 characters to start searching
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginRight: 4,
  },
  typeText: {
    fontSize: 14,
  },
}); 