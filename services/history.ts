import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchHistoryItem } from '../types';
import { xtreamApi } from './api';

const HISTORY_STORAGE_KEY = '@iptv_player_history';
const MAX_HISTORY_ITEMS = 100; // Limit history to prevent storage overflow

export class HistoryService {
  // Get user-specific storage key
  private static getUserKey(): string {
    if (!xtreamApi.isInitialized()) {
      return HISTORY_STORAGE_KEY;
    }
    const baseUrl = xtreamApi.getBaseUrl();
    const username = xtreamApi.getUsername();
    return `${HISTORY_STORAGE_KEY}:${username}@${baseUrl}`;
  }

  private static async getHistory(): Promise<WatchHistoryItem[]> {
    try {
      const userKey = this.getUserKey();
      console.log(`Getting history with user-specific key: ${userKey}`);
      const historyJson = await AsyncStorage.getItem(userKey);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting watch history:', error);
      return [];
    }
  }

  private static async saveHistory(history: WatchHistoryItem[]): Promise<void> {
    try {
      const userKey = this.getUserKey();
      console.log(`Saving history with user-specific key: ${userKey}`);
      // Keep only the latest MAX_HISTORY_ITEMS
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(userKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }

  static async addToHistory(item: WatchHistoryItem): Promise<void> {
    let history = await this.getHistory();
    
    // Remove if already exists (to update timestamp and move to top)
    history = history.filter(h => 
      !(h.id === item.id && h.type === item.type && 
        (item.type !== 'series' || (h.season === item.season && h.episode_num === item.episode_num)))
    );
    
    // Add to beginning of array (newest first)
    history.unshift({
      ...item,
      timestamp: Date.now(), // Always update timestamp
    });
    
    await this.saveHistory(history);
  }

  static async removeFromHistory(id: number, type: 'live' | 'vod' | 'series', season?: number, episode_num?: number): Promise<void> {
    let history = await this.getHistory();
    
    history = history.filter(h => {
      if (h.id !== id || h.type !== type) return true;
      if (type === 'series' && (season !== undefined && episode_num !== undefined)) {
        return !(h.season === season && h.episode_num === episode_num);
      }
      return false;
    });
    
    await this.saveHistory(history);
  }

  static async getRecentlyWatched(limit: number = 10): Promise<WatchHistoryItem[]> {
    const history = await this.getHistory();
    return history.slice(0, limit);
  }

  static async getWatchedByType(type: 'live' | 'vod' | 'series', limit: number = 20): Promise<WatchHistoryItem[]> {
    const history = await this.getHistory();
    return history.filter(h => h.type === type).slice(0, limit);
  }

  static async getPlaybackPosition(id: number, type: 'vod' | 'series', season?: number, episode_num?: number): Promise<number | null> {
    const history = await this.getHistory();
    
    const item = history.find(h => {
      if (h.id !== id || h.type !== type) return false;
      if (type === 'series' && (season !== undefined && episode_num !== undefined)) {
        return h.season === season && h.episode_num === episode_num;
      }
      return true;
    });
    
    return item?.position || null;
  }

  static async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }
} 