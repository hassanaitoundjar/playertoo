import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePlayerSettings, PlayerType } from '../../context/PlayerSettingsContext';
import { HistoryService } from '../../services/history';
import { FavoritesService } from '../../services/favorites';
import { xtreamApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

// Interface for account info
interface AccountInfo {
  status: string;
  exp_date: string;
  max_connections: number;
  username: string;
  password: string;
  message: string;
  is_trial: string;
  active_cons: number;
  created_at: string;
  max_download_speed: string;
  allowed_output_formats: string[];
}

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const { playerType, setPlayerType } = usePlayerSettings();
  const router = useRouter();
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch account information
  const fetchAccountInfo = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching account info...');
      const info = await xtreamApi.getAccountInfo();
      console.log('Account info response:', JSON.stringify(info));
      
      if (!info) {
        setError('Unable to fetch account information');
        setAccountInfo(null);
      } else {
        setAccountInfo(info);
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error);
      setError('Error loading account information');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchAccountInfo();
  }, [user]);
  
  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };
  
  const clearHistory = () => {
    Alert.alert(
      'Clear Watch History',
      'Are you sure you want to clear your watch history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await HistoryService.clearHistory();
            Alert.alert('Success', 'Watch history cleared');
          },
        },
      ]
    );
  };
  
  const clearFavorites = () => {
    Alert.alert(
      'Clear Favorites',
      'Are you sure you want to clear all favorites?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await FavoritesService.clearAllFavorites();
            Alert.alert('Success', 'Favorites cleared');
          },
        },
      ]
    );
  };
  
  // Handle clearing all cache
  const clearAllCache = () => {
    Alert.alert(
      'Clear All Cache',
      'Are you sure you want to clear all cached data? This will refresh all content.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all keys from storage
              const keys = await AsyncStorage.getAllKeys();
              
              // Filter cache-related keys
              const cacheKeys = keys.filter(key => 
                key.includes('cache:') || 
                key.includes('@iptv_player') ||
                key.includes('live_') ||
                key.includes('vod_') ||
                key.includes('series_')
              );
              
              if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                console.log(`Cleared ${cacheKeys.length} cache entries`);
              }
              
              Alert.alert('Success', 'Cache cleared successfully. Please restart the app for changes to take effect.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing as unix timestamp
      const timestamp = parseInt(dateString, 10);
      if (!isNaN(timestamp)) {
        const dateFromTimestamp = new Date(timestamp * 1000);
        return dateFromTimestamp.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if account is expired
  const isExpired = (expDate: string) => {
    if (!expDate) return false;
    
    let expTimestamp;
    if (/^\d+$/.test(expDate)) {
      // If it's a numeric string, treat as Unix timestamp
      expTimestamp = parseInt(expDate, 10) * 1000;
    } else {
      // Otherwise try to parse as date string
      expTimestamp = new Date(expDate).getTime();
    }
    
    if (isNaN(expTimestamp)) return false;
    
    return Date.now() > expTimestamp;
  };
  
  // Calculate days remaining until expiration
  const getDaysRemaining = (expDate: string) => {
    if (!expDate) return 0;
    
    let expTimestamp;
    if (/^\d+$/.test(expDate)) {
      // If it's a numeric string, treat as Unix timestamp
      expTimestamp = parseInt(expDate, 10) * 1000;
    } else {
      // Otherwise try to parse as date string
      expTimestamp = new Date(expDate).getTime();
    }
    
    if (isNaN(expTimestamp)) return 0;
    
    const now = Date.now();
    if (now > expTimestamp) return 0;
    
    const diffMs = expTimestamp - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Handle subscription renewal
  const handleRenewSubscription = () => {
    Alert.alert(
      'Renew Subscription',
      'Would you like to contact your service provider to renew your subscription?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Contact Provider',
          onPress: () => {
            // This would typically open an email or website to the provider
            // For demo purposes, we'll just show an alert
            Alert.alert('Contact Provider', 'This would open your provider\'s renewal page.');
            // Linking.openURL('https://yourprovider.com/renewal');
          },
        },
      ]
    );
  };
  
  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: isDark ? '#999' : '#666' }]}>
          {subtitle}
        </Text>
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#999' : '#666'} />
      ) : null}
    </TouchableOpacity>
  );
  
  // Add a refresh account info function
  const handleRefreshAccountInfo = () => {
    fetchAccountInfo();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <TouchableOpacity onPress={handleRefreshAccountInfo} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {renderSettingItem(
            'person-outline',
            'Username',
            user?.username || 'Not logged in'
          )}
          
          {renderSettingItem(
            'server-outline',
            'Server',
            user?.server_url || 'Not configured'
          )}
          
          {/* Subscription Status */}
          {isLoading ? (
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="timer-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Account Status</Text>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 5 }} />
              </View>
            </View>
          ) : error ? (
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#FF5252" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Error</Text>
                <Text style={[styles.settingSubtitle, { color: '#FF5252' }]}>{error}</Text>
                <TouchableOpacity 
                  onPress={handleRefreshAccountInfo}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : accountInfo ? (
            <>
              {/* Account Status */}
              {renderSettingItem(
                'checkmark-circle-outline',
                'Account Status',
                accountInfo.status === 'Active' ? 'Active' : 'Inactive',
                undefined,
                <View style={styles.statusIndicator}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { 
                        backgroundColor: accountInfo.status === 'Active' ? 
                          '#4CAF50' : '#FF5252' 
                      }
                    ]} 
                  />
                </View>
              )}
              
              {/* Expiration Date */}
              {accountInfo.exp_date && renderSettingItem(
                'calendar-outline',
                'Expiration Date',
                formatDate(accountInfo.exp_date),
                undefined,
                <View style={styles.expirationBadge}>
                  <Text style={[
                    styles.expirationBadgeText,
                    { 
                      color: '#fff',
                      backgroundColor: isExpired(accountInfo.exp_date) ? 
                        '#FF5252' : getDaysRemaining(accountInfo.exp_date) < 7 ? 
                        '#FFA726' : '#4CAF50'
                    }
                  ]}>
                    {isExpired(accountInfo.exp_date) ? 
                      'Expired' : 
                      `${getDaysRemaining(accountInfo.exp_date)} days`}
                  </Text>
                </View>
              )}
              
              {/* Connection Info */}
              {renderSettingItem(
                'link-outline',
                'Max Connections',
                `${accountInfo.active_cons || 0} active of ${accountInfo.max_connections || 1} allowed`
              )}
              
              {/* Account Type */}
              {renderSettingItem(
                'information-circle-outline',
                'Account Type',
                accountInfo.is_trial === '1' ? 'Trial Account' : 'Regular Account'
              )}
              
              {/* Created Date */}
              {accountInfo.created_at && renderSettingItem(
                'time-outline',
                'Created On',
                formatDate(accountInfo.created_at)
              )}
              
              {/* Renewal Option */}
              {(accountInfo.exp_date && (isExpired(accountInfo.exp_date) || getDaysRemaining(accountInfo.exp_date) < 30)) && (
                renderSettingItem(
                  'refresh-circle-outline',
                  'Renew Subscription',
                  'Update your subscription plan',
                  handleRenewSubscription
                )
              )}
            </>
          ) : (
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Account Info</Text>
                <Text style={[styles.settingSubtitle, { color: isDark ? '#999' : '#666' }]}>
                  No account information available
                </Text>
                <TouchableOpacity 
                  onPress={handleRefreshAccountInfo}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Load Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {renderSettingItem(
            'log-out-outline',
            'Logout',
            'Sign out of your account',
            handleLogout
          )}
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          {renderSettingItem(
            'sunny-outline',
            'Light Theme',
            'Use light mode',
            () => handleThemeChange('light'),
            <View style={styles.radioButton}>
              {mode === 'light' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
          
          {renderSettingItem(
            'moon-outline',
            'Dark Theme',
            'Use dark mode',
            () => handleThemeChange('dark'),
            <View style={styles.radioButton}>
              {mode === 'dark' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
          
          {renderSettingItem(
            'phone-portrait-outline',
            'System',
            'Follow system theme',
            () => handleThemeChange('system'),
            <View style={styles.radioButton}>
              {mode === 'system' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Player Settings</Text>
          
          {renderSettingItem(
            'videocam-outline',
            'Expo Player',
            'Use the built-in Expo player',
            () => setPlayerType('expo'),
            <View style={styles.radioButton}>
              {playerType === 'expo' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
          
          {renderSettingItem(
            'logo-youtube',
            'VLC Style Player',
            'Use VLC style player with more features',
            () => setPlayerType('vlc'),
            <View style={styles.radioButton}>
              {playerType === 'vlc' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
          
          {renderSettingItem(
            'time-outline',
            'Clear Watch History',
            'Remove all watched items',
            clearHistory
          )}
          
          {renderSettingItem(
            'heart-outline',
            'Clear Favorites',
            'Remove all favorite items',
            clearFavorites
          )}
          
          {renderSettingItem(
            'refresh-outline',
            'Clear All Cache',
            'Remove all cached data',
            clearAllCache
          )}
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          {renderSettingItem(
            'information-circle-outline',
            'App Version',
            '1.0.0'
          )}
          
          {renderSettingItem(
            'code-outline',
            'Made with',
            'Expo & React Native'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  expirationBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  expirationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButton: {
    padding: 5,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
}); 