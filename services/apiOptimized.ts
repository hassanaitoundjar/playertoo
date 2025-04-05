import axios from 'axios';
import { optimizedFetch, processArrayInChunks } from './apiUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LiveCategory, 
  LiveStream, 
  VodCategory, 
  VodStream, 
  VodInfo, 
  SeriesCategory, 
  Series, 
  SeriesInfo, 
  Season as SeriesSeason,
  Episode as SeriesEpisode,
  EPGShort, 
  EPGSimpleDate 
} from '../types';

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  CATEGORIES: 60 * 60 * 1000, // 1 hour
  STREAMS: 30 * 60 * 1000,    // 30 minutes
  INFO: 15 * 60 * 1000        // 15 minutes
};

class OptimizedXtreamAPI {
  private username: string = '';
  private password: string = '';
  private baseUrl: string = '';
  private isAuthenticated: boolean = false;
  private abortControllers: Record<string, AbortController> = {};

  // Initialize API with credentials
  public initialize(username: string, password: string, serverUrl: string): void {
    this.username = username;
    this.password = password;
    this.baseUrl = serverUrl;
    this.isAuthenticated = true;
  }

  // Reset API credentials
  public reset(): void {
    this.username = '';
    this.password = '';
    this.baseUrl = '';
    this.isAuthenticated = false;
    
    // Cancel any pending requests
    Object.values(this.abortControllers).forEach(controller => {
      controller.abort();
    });
    this.abortControllers = {};
  }

  // Check if API is initialized
  public isInitialized(): boolean {
    return this.isAuthenticated;
  }

  // Helper method to get full API URL
  private getApiUrl(action: string, params: Record<string, string | number> = {}): string {
    const baseApiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
    const queryParams = Object.entries(params)
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
    
    return `${baseApiUrl}&action=${action}${queryParams}`;
  }

  // Get cache key for specific API requests
  private getCacheKey(key: string): string {
    return `cache:${this.username}@${this.baseUrl}:${key}`;
  }

  // Save data to cache
  private async saveToCache<T>(key: string, data: T, duration: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error saving to cache (${key}):`, error);
    }
  }

  // Get data from cache
  private async getFromCache<T>(key: string): Promise<{ data: T, isValid: boolean } | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const cachedJson = await AsyncStorage.getItem(cacheKey);
      if (!cachedJson) return null;
      
      const cache = JSON.parse(cachedJson);
      const isValid = cache.expiresAt > Date.now();
      
      return {
        data: cache.data as T,
        isValid
      };
    } catch (error) {
      console.error(`Error retrieving from cache (${key}):`, error);
      return null;
    }
  }

  // Fetch with caching and abort control
  private async fetchWithCache<T>(
    key: string, 
    url: string, 
    cacheDuration: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getFromCache<T>(key);
    if (cached && cached.isValid) {
      return cached.data;
    }
    
    // Cancel any existing request with the same key
    if (this.abortControllers[key]) {
      this.abortControllers[key].abort();
    }
    
    // Create new abort controller
    const controller = new AbortController();
    this.abortControllers[key] = controller;
    
    try {
      // Fetch fresh data
      const response = await optimizedFetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IPTVPlayerApp'
        }
      });
      
      // Save to cache and return
      await this.saveToCache(key, response, cacheDuration);
      return response;
    } catch (error) {
      // If we have stale cache, return that instead of failing
      if (cached) {
        console.warn(`Using stale cache for ${key} due to fetch error`);
        return cached.data;
      }
      throw error;
    } finally {
      // Remove the controller reference
      delete this.abortControllers[key];
    }
  }

  // Get base URL of the API
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // Get username of the current user
  public getUsername(): string {
    return this.username;
  }

  // Get streaming URL for live channel
  public getLiveStreamingUrl(streamId: number): string {
    return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
  }

  // Get streaming URL for VOD with format
  public getVodStreamingUrl(streamId: number, format: 'mp4' | 'm3u8' | 'ts' = 'm3u8'): string {
    return `${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.${format}`;
  }

  // Get streaming URL for series episode with format
  public getSeriesStreamingUrl(streamId: number, format: 'mp4' | 'm3u8' | 'ts' = 'm3u8'): string {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${streamId}.${format}`;
  }

  // Authentication - Test if credentials are valid
  public async authenticate(): Promise<boolean> {
    try {
      const url = this.getApiUrl('get_live_categories');
      const response = await fetch(url);
      return response.status === 200;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Live TV Methods
  public async getLiveCategories(): Promise<LiveCategory[]> {
    try {
      const key = 'live_categories';
      const url = this.getApiUrl('get_live_categories');
      const data = await this.fetchWithCache<LiveCategory[]>(key, url, CACHE_DURATIONS.CATEGORIES);
      return data || [];
    } catch (error) {
      console.error('Error fetching live categories:', error);
      return [];
    }
  }

  public async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const key = categoryId ? `live_streams_cat_${categoryId}` : 'live_streams_all';
      const url = this.getApiUrl('get_live_streams', params);
      
      const data = await this.fetchWithCache<LiveStream[]>(key, url, CACHE_DURATIONS.STREAMS);
      return data || [];
    } catch (error) {
      console.error('Error fetching live streams:', error);
      return [];
    }
  }

  // VOD Methods
  public async getVodCategories(): Promise<VodCategory[]> {
    try {
      const key = 'vod_categories';
      const url = this.getApiUrl('get_vod_categories');
      const data = await this.fetchWithCache<VodCategory[]>(key, url, CACHE_DURATIONS.CATEGORIES);
      return data || [];
    } catch (error) {
      console.error('Error fetching VOD categories:', error);
      return [];
    }
  }

  public async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const key = categoryId ? `vod_streams_cat_${categoryId}` : 'vod_streams_all';
      const url = this.getApiUrl('get_vod_streams', params);
      
      const data = await this.fetchWithCache<VodStream[]>(key, url, CACHE_DURATIONS.STREAMS);
      return data || [];
    } catch (error) {
      console.error('Error fetching VOD streams:', error);
      return [];
    }
  }

  public async getVodInfo(vodId: number): Promise<VodInfo | null> {
    try {
      const key = `vod_info_${vodId}`;
      const url = this.getApiUrl('get_vod_info', { vod_id: vodId });
      
      const data = await this.fetchWithCache<VodInfo>(key, url, CACHE_DURATIONS.INFO);
      return data || null;
    } catch (error) {
      console.error('Error fetching VOD info:', error);
      return null;
    }
  }

  // Series Methods
  public async getSeriesCategories(): Promise<SeriesCategory[]> {
    try {
      const key = 'series_categories';
      const url = this.getApiUrl('get_series_categories');
      
      const data = await this.fetchWithCache<SeriesCategory[]>(key, url, CACHE_DURATIONS.CATEGORIES);
      return data || [];
    } catch (error) {
      console.error('Error fetching series categories:', error);
      return [];
    }
  }

  public async getSeries(categoryId?: string): Promise<Series[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const key = categoryId ? `series_cat_${categoryId}` : 'series_all';
      const url = this.getApiUrl('get_series', params);
      
      const data = await this.fetchWithCache<Series[]>(key, url, CACHE_DURATIONS.STREAMS);
      return data || [];
    } catch (error) {
      console.error('Error fetching series:', error);
      return [];
    }
  }

  public async getSeriesInfo(seriesId: number): Promise<SeriesInfo | null> {
    try {
      const key = `series_info_${seriesId}`;
      const url = this.getApiUrl('get_series_info', { series_id: seriesId });
      
      const data = await this.fetchWithCache<SeriesInfo>(key, url, CACHE_DURATIONS.INFO);
      return data || null;
    } catch (error) {
      console.error('Error fetching series info:', error);
      return null;
    }
  }

  // Clear specific cache
  public async clearCache(type: 'all' | 'live' | 'vod' | 'series'): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cachePrefix = `cache:${this.username}@${this.baseUrl}:`;
      
      let keysToRemove: string[] = [];
      
      if (type === 'all') {
        keysToRemove = keys.filter(key => key.startsWith(cachePrefix));
      } else if (type === 'live') {
        keysToRemove = keys.filter(key => 
          key.startsWith(cachePrefix) && 
          (key.includes('live_categories') || key.includes('live_streams'))
        );
      } else if (type === 'vod') {
        keysToRemove = keys.filter(key => 
          key.startsWith(cachePrefix) && 
          (key.includes('vod_categories') || key.includes('vod_streams') || key.includes('vod_info'))
        );
      } else if (type === 'series') {
        keysToRemove = keys.filter(key => 
          key.startsWith(cachePrefix) && 
          (key.includes('series_categories') || key.includes('series_cat_') || key.includes('series_info') || key.includes('series_all'))
        );
      }
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`Cleared ${keysToRemove.length} cache entries for ${type}`);
      }
    } catch (error) {
      console.error(`Error clearing cache for ${type}:`, error);
    }
  }
}

// Export a singleton instance
export const optimizedXtreamApi = new OptimizedXtreamAPI(); 