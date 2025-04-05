import { useState, useEffect } from 'react';
import { useCachedData } from './useCachedData';
import { xtreamApi } from '../services/api';
import { useUserChange } from './useUserChange';
import { LiveCategory, LiveStream, VodCategory, VodStream, SeriesCategory, Series } from '../types';

export function useInitialData() {
  const refreshKey = useUserChange();
  const [isAllDataLoaded, setIsAllDataLoaded] = useState(false);
  
  // Use the cached data hook for each data type with appropriate cache expiry times
  const liveCategories = useCachedData<LiveCategory[]>(
    'live_categories',
    () => xtreamApi.getLiveCategories(),
    1000 * 60 * 60, // 1 hour cache
    [refreshKey]
  );
  
  const liveStreams = useCachedData<LiveStream[]>(
    'live_streams',
    () => xtreamApi.getLiveStreams(),
    1000 * 60 * 30, // 30 minutes cache
    [refreshKey]
  );
  
  const vodCategories = useCachedData<VodCategory[]>(
    'vod_categories',
    () => xtreamApi.getVodCategories(),
    1000 * 60 * 60, // 1 hour cache
    [refreshKey]
  );
  
  const vodStreams = useCachedData<VodStream[]>(
    'vod_streams', 
    () => xtreamApi.getVodStreams(),
    1000 * 60 * 30, // 30 minutes cache
    [refreshKey]
  );
  
  const seriesCategories = useCachedData<SeriesCategory[]>(
    'series_categories',
    () => xtreamApi.getSeriesCategories(),
    1000 * 60 * 60, // 1 hour cache
    [refreshKey]
  );
  
  const seriesList = useCachedData<Series[]>(
    'series_list',
    () => xtreamApi.getSeries(),
    1000 * 60 * 30, // 30 minutes cache
    [refreshKey]
  );
  
  // Track the overall loading state
  useEffect(() => {
    const allLoaded = 
      !liveCategories.isLoading && 
      !liveStreams.isLoading && 
      !vodCategories.isLoading && 
      !vodStreams.isLoading && 
      !seriesCategories.isLoading && 
      !seriesList.isLoading;
      
    setIsAllDataLoaded(allLoaded);
  }, [
    liveCategories.isLoading,
    liveStreams.isLoading,
    vodCategories.isLoading,
    vodStreams.isLoading,
    seriesCategories.isLoading,
    seriesList.isLoading
  ]);
  
  // Method to force refresh all data
  const refreshAllData = () => {
    liveCategories.refetch();
    liveStreams.refetch();
    vodCategories.refetch();
    vodStreams.refetch();
    seriesCategories.refetch();
    seriesList.refetch();
  };
  
  return {
    liveCategories: liveCategories.data || [],
    liveStreams: liveStreams.data || [],
    vodCategories: vodCategories.data || [],
    vodStreams: vodStreams.data || [],
    seriesCategories: seriesCategories.data || [],
    seriesList: seriesList.data || [],
    isLoading: !isAllDataLoaded,
    error: liveCategories.error || liveStreams.error || vodCategories.error || 
           vodStreams.error || seriesCategories.error || seriesList.error,
    refreshAllData
  };
} 