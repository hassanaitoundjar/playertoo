import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatListProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { xtreamApi } from '../../services/api';
import { ContentGrid } from '../../components/UI/ContentGrid';
import { useUserChange } from "../../hooks/useUserChange";
import { useAuth } from "../../context/AuthContext";
import { LiveCategory, LiveStream } from '../../types';

interface ContentItem {
  id: number;
  title: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

export default function LiveScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  // Use the useUserChange hook to detect user changes
  const refreshKey = useUserChange();
  
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Load live TV data when component mounts or user changes
    loadLiveData();
  }, [refreshKey]);
  
  useEffect(() => {
    // Filter streams based on selected category and search query
    filterStreams();
  }, [selectedCategory, searchQuery]);
  
  const loadLiveData = async () => {
    setIsLoading(true);
    
    try {
      console.log(`Loading live data for user: ${user?.username}`);
      // Load categories
      const liveCategories = await xtreamApi.getLiveCategories();
      setCategories(liveCategories);
      
      // Load all streams
      const liveStreams = await xtreamApi.getLiveStreams();
      setStreams(liveStreams);
      setFilteredStreams(liveStreams);
    } catch (error) {
      console.error('Error loading live TV data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterStreams = () => {
    let filtered = [...streams];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(stream => 
        stream.category_id === selectedCategory
      );
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(stream => 
        stream.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredStreams(filtered);
  };
  
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };
  
  const handleStreamPress = (stream: LiveStream) => {
    router.push({
      pathname: '/live/player',
      params: { streamId: stream.stream_id },
    });
  };
  
  const renderCategory = ({ item }: { item: LiveCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.category_id && { backgroundColor: colors.primary },
      ]}
      onPress={() => handleSelectCategory(item.category_id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.category_id ? { color: 'white' } : { color: colors.text },
        ]}
        numberOfLines={1}
      >
        {item.category_name}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Live TV</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search channels..."
              placeholderTextColor={isDark ? '#777' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.categoriesContainer}>
          <ScrollableFlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.category_id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === null && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleSelectCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === null ? { color: 'white' } : { color: colors.text },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <ContentGrid
          title={selectedCategory ? categories.find(c => c.category_id === selectedCategory)?.category_name || 'Channels' : 'All Channels'}
          data={filteredStreams.map(stream => ({
            id: stream.stream_id,
            title: stream.name,
            image: stream.stream_icon,
            type: 'live' as 'live',
          }))}
          onItemPress={(item: ContentItem) => {
            const stream = streams.find(s => s.stream_id === item.id);
            if (stream) handleStreamPress(stream);
          }}
          isLoading={isLoading}
          emptyMessage={searchQuery ? "No channels matching your search" : "No channels in this category"}
          numColumns={3}
        />
      </View>
    </SafeAreaView>
  );
}

// Helper component to make FlatList scrollable in iOS and Android
const ScrollableFlatList = <T extends any>(props: FlatListProps<T>) => {
  return (
    <View style={{ flexGrow: 0 }}>
      <FlatList<T> {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexShrink: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
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
  categoriesContainer: {
    height: 44,
    marginBottom: 5,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 