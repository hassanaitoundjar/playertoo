import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  notification: string;
}

interface ThemeContextProps {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: '#F0F0F0',
  card: '#FFFFFF',
  text: '#000000',
  border: '#D0D0D0',
  primary: '#E50914', // Netflix red
  secondary: '#221F1F', // Netflix dark
  accent: '#F5F5F1', // Netflix light
  error: '#FF3B30',
  success: '#34C759',
  notification: '#1C77F2',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  border: '#2C2C2C',
  primary: '#E50914', // Netflix red
  secondary: '#B9090B', // Netflix dark red
  accent: '#221F1F', // Netflix dark
  error: '#FF453A',
  success: '#30D158',
  notification: '#0A84FF',
};

const THEME_STORAGE_KEY = '@iptv_player_theme';

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };
  
  // Determine if dark mode is active based on mode and system settings
  const isDark = 
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
    
  // Get the appropriate color scheme
  const colors = isDark ? darkColors : lightColors;
  
  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => useContext(ThemeContext); 