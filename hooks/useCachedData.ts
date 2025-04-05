import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { xtreamApi } from '../services/api';

export function useCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expireTime: number = 1000 * 60 * 30, // 30 minutes default
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a user-specific cache key
  const getCacheKey = () => {
    if (!xtreamApi.isInitialized()) return key;
    const username = xtreamApi.getUsername();
    const baseUrl = xtreamApi.getBaseUrl();
    return `cache:${username}@${baseUrl}:${key}`;
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const cacheKey = getCacheKey();
        
        // Try to get data from cache first
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const { data: storedData, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > expireTime;
          
          if (!isExpired) {
            // Use cached data if not expired
            if (isMounted) {
              setData(storedData);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Fetch fresh data
        const freshData = await fetchFunction();
        
        if (isMounted) {
          setData(freshData);
          
          // Store in cache with timestamp
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: freshData,
              timestamp: Date.now()
            })
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching ${key}:`, err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, dependencies);
  
  return { data, isLoading, error, refetch: () => setData(null) };
} 