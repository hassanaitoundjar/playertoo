import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define player types
export type PlayerType = 'expo' | 'vlc';

// Interface for PlayerSettings context
interface PlayerSettingsContextProps {
  playerType: PlayerType;
  setPlayerType: (type: PlayerType) => void;
}

// Storage key for player settings
const PLAYER_SETTINGS_KEY = '@iptv_player_settings';

// Create the context with default values
const PlayerSettingsContext = createContext<PlayerSettingsContextProps>({
  playerType: 'expo',
  setPlayerType: () => {},
});

// Provider component for player settings
export const PlayerSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerType, setPlayerTypeState] = useState<PlayerType>('expo');
  
  // Load saved player type preference on mount
  useEffect(() => {
    const loadPlayerSettings = async () => {
      try {
        const savedType = await AsyncStorage.getItem(PLAYER_SETTINGS_KEY);
        if (savedType && (savedType === 'expo' || savedType === 'vlc')) {
          setPlayerTypeState(savedType as PlayerType);
        }
      } catch (error) {
        console.error('Failed to load player settings', error);
      }
    };
    
    loadPlayerSettings();
  }, []);
  
  // Save player type preference to storage
  const setPlayerType = async (newType: PlayerType) => {
    setPlayerTypeState(newType);
    try {
      await AsyncStorage.setItem(PLAYER_SETTINGS_KEY, newType);
    } catch (error) {
      console.error('Failed to save player settings', error);
    }
  };
  
  return (
    <PlayerSettingsContext.Provider
      value={{
        playerType,
        setPlayerType,
      }}
    >
      {children}
    </PlayerSettingsContext.Provider>
  );
};

// Custom hook for using player settings
export const usePlayerSettings = () => useContext(PlayerSettingsContext); 