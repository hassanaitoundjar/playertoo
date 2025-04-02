import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { ContentGrid } from '../../components/UI/ContentGrid';
import { FavoritesService } from '../../services/favorites';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteItem } from '../../types';
import { useUserChange } from "../../hooks/useUserChange";
import { useAuth } from "../../context/AuthContext";

interface ContentItem {
  id: number;
  title: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

// This component acts as a wrapper to properly render content based on active tab
const FilteredContent = ({ 
  activeTab, 
  liveFavorites, 
  vodFavorites, 
  seriesFavorites,
  handleItemPress,
  colors
}: { 
  activeTab: 'all' | 'live' | 'vod' | 'series';
  liveFavorites: FavoriteItem[];
  vodFavorites: FavoriteItem[];
  seriesFavorites: FavoriteItem[];
  handleItemPress: (item: ContentItem) => void;
  colors: any;
}) => {
  // Build an array of sections to render based on active tab
  const sections = [];
  
  if (activeTab === 'all' || activeTab === 'live') {
    if (liveFavorites.length > 0) {
      sections.push({
        title: 'Live TV Favorites',
        data: liveFavorites.map(item => ({
          id: item.id,
          title: item.name,
          image: item.stream_icon,
          type: 'live' as 'live',
        }))
      });
    }
  }
  
  if (activeTab === 'all' || activeTab === 'vod') {
    if (vodFavorites.length > 0) {
      sections.push({
        title: 'Movie Favorites',
        data: vodFavorites.map(item => ({
          id: item.id,
          title: item.name,
          image: item.stream_icon,
          type: 'vod' as 'vod',
        }))
      });
    }
  }
  
  if (activeTab === 'all' || activeTab === 'series') {
    if (seriesFavorites.length > 0) {
      sections.push({
        title: 'Series Favorites',
        data: seriesFavorites.map(item => ({
          id: item.id,
          title: item.name,
          image: item.cover,
          type: 'series' as 'series',
        }))
      });
    }
  }
  
  // Use FlatList to render sections
  return (
    <FlatList
      data={sections}
      keyExtractor={(item) => item.title}
      renderItem={({ item: section }) => (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
          <View style={styles.gridWrapper}>
            <ContentGrid
              title=""
              data={section.data}
              onItemPress={handleItemPress}
              showType={activeTab === 'all'}
            />
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyFilterContainer}>
          <Ionicons name="filter-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No favorites in this category
          </Text>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  // Use the useUserChange hook to detect user changes
  const refreshKey = useUserChange();
  
  const [liveFavorites, setLiveFavorites] = useState<FavoriteItem[]>([]);
  const [vodFavorites, setVodFavorites] = useState<FavoriteItem[]>([]);
  const [seriesFavorites, setSeriesFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'vod' | 'series'>('all');

  useEffect(() => {
    loadFavorites();
    
    // Set the initial tab based on route params
    if (params.initialTab) {
      if (params.initialTab === 'live') {
        setActiveTab('live');
      } else if (params.initialTab === 'vod') {
        setActiveTab('vod');
      } else if (params.initialTab === 'series') {
        setActiveTab('series');
      }
    }
  }, [params.initialTab, refreshKey]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      console.log(`Loading favorites for user: ${user?.username}`);
      // Load favorites by type in parallel
      const [live, vod, series] = await Promise.all([
        FavoritesService.getFavoritesByType('live'),
        FavoritesService.getFavoritesByType('vod'),
        FavoritesService.getFavoritesByType('series')
      ]);
      
      setLiveFavorites(live);
      setVodFavorites(vod);
      setSeriesFavorites(series);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemPress = (item: ContentItem) => {
    if (item.type === 'live') {
      // Navigate to live player
      router.push({
        pathname: '/live/player',
        params: { streamId: item.id },
      });
    } else if (item.type === 'vod') {
      // Navigate to movie details
      router.push({
        pathname: '/movies/detail',
        params: { vodId: item.id },
      });
    } else if (item.type === 'series') {
      // Navigate to series details
      router.push({
        pathname: '/series/detail',
        params: { seriesId: item.id },
      });
    }
  };

  const removeFavorite = async (item: FavoriteItem) => {
    try {
      await FavoritesService.removeFavorite(item.id, item.type);
      
      // Update state based on type
      if (item.type === 'live') {
        setLiveFavorites(prev => prev.filter(fav => fav.id !== item.id));
      } else if (item.type === 'vod') {
        setVodFavorites(prev => prev.filter(fav => fav.id !== item.id));
      } else if (item.type === 'series') {
        setSeriesFavorites(prev => prev.filter(fav => fav.id !== item.id));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderContent = () => {
    const allEmpty = liveFavorites.length === 0 && vodFavorites.length === 0 && seriesFavorites.length === 0;
    
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Loading favorites...
          </Text>
        </View>
      );
    }
    
    if (allEmpty) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You don't have any favorites yet
          </Text>
          <Text style={[styles.emptySubText, { color: colors.text }]}>
            Add content to your favorites to see it here
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'all' && { backgroundColor: colors.primary }
              ]} 
              onPress={() => setActiveTab('all')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'all' ? '#fff' : colors.text }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'live' && { backgroundColor: colors.primary }
              ]} 
              onPress={() => setActiveTab('live')}
            >
              <Ionicons 
                name="tv-outline" 
                size={16} 
                color={activeTab === 'live' ? '#fff' : colors.text} 
                style={styles.tabIcon} 
              />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'live' ? '#fff' : colors.text }
              ]}>
                Live TV
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'vod' && { backgroundColor: colors.primary }
              ]} 
              onPress={() => setActiveTab('vod')}
            >
              <Ionicons 
                name="film-outline" 
                size={16}
                color={activeTab === 'vod' ? '#fff' : colors.text} 
                style={styles.tabIcon} 
              />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'vod' ? '#fff' : colors.text }
              ]}>
                Movies
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'series' && { backgroundColor: colors.primary }
              ]} 
              onPress={() => setActiveTab('series')}
            >
              <Ionicons 
                name="albums-outline" 
                size={16}
                color={activeTab === 'series' ? '#fff' : colors.text} 
                style={styles.tabIcon} 
              />
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'series' ? '#fff' : colors.text }
              ]}>
                Series
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Content sections */}
        <FilteredContent 
          activeTab={activeTab}
          liveFavorites={liveFavorites}
          vodFavorites={vodFavorites}
          seriesFavorites={seriesFavorites}
          handleItemPress={handleItemPress}
          colors={colors}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Favorites</Text>
        {!isLoading && (liveFavorites.length > 0 || vodFavorites.length > 0 || seriesFavorites.length > 0) && (
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadFavorites}
          >
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  tabContainer: {
    paddingVertical: 10,
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  gridWrapper: {
    height: 220, // Fixed height for grid section
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
}); 