import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  FlatListProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { xtreamApi } from '../../services/api';
import { ContentGrid } from '../../components/UI/ContentGrid';
import { SeriesCategory, Series } from '../../types';
import { useUserChange } from "../../hooks/useUserChange";
import { useAuth } from "../../context/AuthContext";

interface ContentItem {
  id: number;
  title: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

export default function SeriesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const refreshKey = useUserChange();
  
  const [categories, setCategories] = useState<SeriesCategory[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Load series data when component mounts or user changes
    loadSeriesData();
  }, [refreshKey]);
  
  useEffect(() => {
    // Filter series based on selected category and search query
    filterSeries();
  }, [selectedCategory, searchQuery]);
  
  const loadSeriesData = async () => {
    setIsLoading(true);
    
    try {
      console.log(`Loading series data for user: ${user?.username}`);
      // Load categories
      const seriesCategories = await xtreamApi.getSeriesCategories();
      setCategories(seriesCategories);
      
      // Load all series
      const series = await xtreamApi.getSeries();
      setSeriesList(series);
      setFilteredSeries(series);
    } catch (error) {
      console.error('Error loading series data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterSeries = () => {
    let filtered = [...seriesList];
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(series => 
        series.category_id === selectedCategory
      );
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(series => 
        series.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredSeries(filtered);
  };
  
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };
  
  const handleSeriesPress = (series: Series) => {
    router.push({
      pathname: '/series/detail',
      params: { seriesId: series.series_id },
    });
  };
  
  const renderCategory = ({ item }: { item: SeriesCategory }) => (
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
          <Text style={[styles.title, { color: colors.text }]}>Series</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search series..."
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
          title={selectedCategory ? categories.find(c => c.category_id === selectedCategory)?.category_name || 'Series' : 'All Series'}
          data={filteredSeries.map(series => ({
            id: series.series_id,
            title: series.name,
            image: series.cover,
            type: 'series' as 'series',
          }))}
          onItemPress={(item: ContentItem) => {
            const series = seriesList.find(s => s.series_id === item.id);
            if (series) handleSeriesPress(series);
          }}
          isLoading={isLoading}
          emptyMessage={searchQuery ? "No series matching your search" : "No series in this category"}
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