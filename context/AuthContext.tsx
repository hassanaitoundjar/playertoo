import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, User } from '../types';
import { xtreamApi } from '../services/api';

// User change event for content refresh
type UserChangeListener = () => void;

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  // Add methods to register for user change events
  addUserChangeListener: (listener: UserChangeListener) => () => void;
  refreshUserContent: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  isAuthenticated: false,
  addUserChangeListener: () => () => {},
  refreshUserContent: () => {},
});

const USER_STORAGE_KEY = '@iptv_player_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Add state to track the current content cache key to force refreshes
  const [contentRefreshKey, setContentRefreshKey] = useState<number>(0);
  // User change listeners
  const [userChangeListeners, setUserChangeListeners] = useState<UserChangeListener[]>([]);
  // Track if we're currently refreshing to prevent loops
  const isRefreshing = useRef(false);

  // Function to notify all listeners about user change
  const notifyUserChange = () => {
    userChangeListeners.forEach(listener => listener());
  };

  // Register a listener for user changes, returns unsubscribe function
  const addUserChangeListener = (listener: UserChangeListener) => {
    setUserChangeListeners(prev => [...prev, listener]);
    
    // Return a function to unsubscribe
    return () => {
      setUserChangeListeners(prev => prev.filter(l => l !== listener));
    };
  };

  // Force content refresh
  const refreshUserContent = () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    
    // Use setTimeout to break the potential render cycle
    setTimeout(() => {
      setContentRefreshKey(prev => prev + 1);
      notifyUserChange();
      isRefreshing.current = false;
    }, 0);
  };

  // Helper function to clear content caches when switching users
  const clearContentCaches = async () => {
    try {
      console.log('Clearing content caches for user switch');
      
      // Try to clear common cache keys used in the app
      const commonKeys = [
        '@iptv_player_favorites', 
        '@iptv_player_history',
        '@live_categories',
        '@live_streams', 
        '@vod_categories',
        '@vod_streams',
        '@series_categories',
        '@series'
      ];
      
      // Get all keys from storage
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter keys that match our common patterns or are related to content
      const contentKeys = keys.filter(key => 
        commonKeys.some(pattern => key.includes(pattern)) || 
        key.includes('cache:') || 
        key.includes('content:')
      );
      
      if (contentKeys.length > 0) {
        await AsyncStorage.multiRemove(contentKeys);
        console.log(`Cleared ${contentKeys.length} content cache keys`);
      }
    } catch (error) {
      console.error('Error clearing content caches:', error);
    }
  };

  useEffect(() => {
    // Load user credentials from AsyncStorage on app start
    const loadUserFromStorage = async () => {
      try {
        const userJSON = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (userJSON) {
          const userData = JSON.parse(userJSON) as User;
          setUser(userData);
          
          // Initialize the API with stored credentials
          xtreamApi.initialize(
            userData.username, 
            userData.password, 
            userData.server_url
          );
        }
      } catch (error) {
        console.error('Failed to load user data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);
  
  // Set up effect to clear all content caches when user changes
  useEffect(() => {
    if (user && !isLoading) {
      // Increment content refresh key and notify listeners when user changes
      refreshUserContent();
    }
  }, [user?.username, user?.server_url]);

  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // If we already have a logged in user, clear their data first
      if (user) {
        await clearContentCaches();
      }
      
      // Initialize the API with the provided credentials
      xtreamApi.initialize(
        credentials.username,
        credentials.password,
        credentials.server_url
      );
      
      // Test if credentials are valid
      const isAuthenticated = await xtreamApi.authenticate();
      
      if (isAuthenticated) {
        // Create user object
        const userData: User = {
          ...credentials,
          status: 'authenticated',
        };
        
        // Save to state
        setUser(userData);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        
        return true;
      } else {
        // Reset API if authentication failed
        xtreamApi.reset();
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Clear content caches
      await clearContentCaches();
      
      // Reset user state
      setUser(null);
      
      // Reset API
      xtreamApi.reset();
      
      // Notify listeners about user change
      notifyUserChange();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        isAuthenticated: !!user,
        addUserChangeListener,
        refreshUserContent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext); 