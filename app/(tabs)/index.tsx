import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { xtreamApi } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { ContentCarousel } from '../../components/UI/ContentCarousel';
import { ContentGrid } from '../../components/UI/ContentGrid';
import { HistoryService } from '../../services/history';
import { FavoritesService } from '../../services/favorites';
import { LiveStream, VodStream, Series, WatchHistoryItem } from '../../types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load data when component mounts
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Load recently watched
      const history = await HistoryService.getRecentlyWatched(10);
      setRecentlyWatched(history);
      
      // Load favorites
      const favs = await FavoritesService.getAllFavorites();
      setFavorites(favs);
      
      // Load featured content (mix of live, vod, series)
      await loadFeaturedContent();
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadFeaturedContent = async () => {
    try {
      // Get a mix of content for the featured carousel
      const featured = [];
      
      // Add some live streams
      const liveStreams = await xtreamApi.getLiveStreams();
      if (liveStreams.length > 0) {
        // Add a few popular/random live streams
        const liveFeatured = liveStreams
          .slice(0, 20)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2)
          .map((stream: LiveStream) => ({
            id: stream.stream_id,
            title: stream.name,
            image: stream.stream_icon,
            type: 'live' as 'live',
            description: 'Live TV Channel',
          }));
        
        featured.push(...liveFeatured);
      }
      
      // Add some movies
      const vodStreams = await xtreamApi.getVodStreams();
      if (vodStreams.length > 0) {
        const vodFeatured = vodStreams
          .slice(0, 20)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((stream: VodStream) => ({
            id: stream.stream_id,
            title: stream.name,
            image: stream.stream_icon,
            type: 'vod' as 'vod',
            description: 'Movie',
          }));
        
        featured.push(...vodFeatured);
      }
      
      // Add some series
      const seriesList = await xtreamApi.getSeries();
      if (seriesList.length > 0) {
        const seriesFeatured = seriesList
          .slice(0, 20)
          .sort(() => 0.5 - Math.random())
          .slice(0, 2)
          .map((series: Series) => ({
            id: series.series_id,
            title: series.name,
            image: series.cover,
            backdrop: series.backdrop_path?.[0],
            type: 'series' as 'series',
            description: series.plot?.slice(0, 100) || 'TV Series',
          }));
        
        featured.push(...seriesFeatured);
      }
      
      // Shuffle featured items
      setFeaturedItems(featured.sort(() => 0.5 - Math.random()));
    } catch (error) {
      console.error('Error loading featured content:', error);
    }
  };
  
  const handleItemPress = (item: any) => {
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {featuredItems.length > 0 && (
          <ContentCarousel
            title="Featured Content"
            data={featuredItems}
            onItemPress={handleItemPress}
          />
        )}
        
        {recentlyWatched.length > 0 && (
          <ContentGrid
            title="Continue Watching"
            data={recentlyWatched.map(item => ({
              id: item.id,
              title: item.name,
              image: item.stream_icon || item.cover,
              type: item.type,
            }))}
            onItemPress={handleItemPress}
            showType
          />
        )}
        
        {favorites.length > 0 && (
          <ContentGrid
            title="My Favorites"
            data={favorites.map(item => ({
              id: item.id,
              title: item.name,
              image: item.stream_icon || item.cover,
              type: item.type,
            }))}
            onItemPress={handleItemPress}
            showType
          />
        )}
        
        {isLoading && recentlyWatched.length === 0 && featuredItems.length === 0 && (
          <ContentGrid
            title="Content"
            data={[]}
            onItemPress={() => {}}
            isLoading={true}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
