import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteItem } from '../types';
import { xtreamApi } from './api';

const FAVORITES_STORAGE_KEY = '@iptv_player_favorites';

export class FavoritesService {
  // Get user-specific storage key
  private static getUserKey(): string {
    if (!xtreamApi.isInitialized()) {
      return FAVORITES_STORAGE_KEY;
    }
    const baseUrl = xtreamApi.getBaseUrl();
    const username = xtreamApi.getUsername();
    return `${FAVORITES_STORAGE_KEY}:${username}@${baseUrl}`;
  }

  private static async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const userKey = this.getUserKey();
      console.log(`Getting favorites with user-specific key: ${userKey}`);
      const favoritesJson = await AsyncStorage.getItem(userKey);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  private static async saveFavorites(favorites: FavoriteItem[]): Promise<void> {
    try {
      const userKey = this.getUserKey();
      console.log(`Saving favorites with user-specific key: ${userKey}`);
      await AsyncStorage.setItem(userKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  static async addFavorite(item: FavoriteItem): Promise<void> {
    const favorites = await this.getFavorites();
    
    // Check if already in favorites
    const exists = favorites.some(fav => 
      fav.id === item.id && fav.type === item.type
    );
    
    if (!exists) {
      favorites.push(item);
      await this.saveFavorites(favorites);
    }
  }

  static async removeFavorite(id: number, type: 'live' | 'vod' | 'series'): Promise<void> {
    let favorites = await this.getFavorites();
    
    favorites = favorites.filter(fav => 
      !(fav.id === id && fav.type === type)
    );
    
    await this.saveFavorites(favorites);
  }

  static async isFavorite(id: number, type: 'live' | 'vod' | 'series'): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(fav => fav.id === id && fav.type === type);
  }

  static async getAllFavorites(): Promise<FavoriteItem[]> {
    return await this.getFavorites();
  }

  static async getFavoritesByType(type: 'live' | 'vod' | 'series'): Promise<FavoriteItem[]> {
    const favorites = await this.getFavorites();
    return favorites.filter(fav => fav.type === type);
  }

  static async clearAllFavorites(): Promise<void> {
    await this.saveFavorites([]);
  }
} 