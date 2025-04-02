import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for saved accounts
const SAVED_ACCOUNTS_KEY = '@iptv_player_saved_accounts';

// Interface for saved account
interface SavedAccount {
  playlistName: string;
  username: string;
  password: string;
  server_url: string;
}

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login, isLoading } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For accounts list modal
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  // Load saved accounts
  const loadSavedAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const savedAccountsJSON = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (savedAccountsJSON) {
        const accounts = JSON.parse(savedAccountsJSON);
        setSavedAccounts(accounts);
      } else {
        setSavedAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load saved accounts:', error);
      Alert.alert('Error', 'Failed to load saved accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };
  
  // Effect to load saved accounts when component mounts
  useEffect(() => {
    loadSavedAccounts();
  }, []);
  
  const handleLogin = async () => {
    // Form validation
    if (!username || !password || !serverUrl) {
      setError('Please fill in all required fields');
      return;
    }
    
    // URL validation (basic)
    if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      setError('Server URL must start with http:// or https://');
      return;
    }
    
    // Clear previous errors
    setError(null);
    
    // Remove trailing slash from server URL if present
    const formattedServerUrl = serverUrl.endsWith('/') 
      ? serverUrl.slice(0, -1) 
      : serverUrl;
    
    // Attempt login
    const success = await login({
      username,
      password,
      server_url: formattedServerUrl,
    });
    
    if (success) {
      // Save account details if login successful
      try {
        // Generate a default playlist name if not provided
        const accountName = playlistName.trim() || `Account_${username}`;
        
        // Create account object
        const newAccount: SavedAccount = {
          playlistName: accountName,
          username,
          password,
          server_url: formattedServerUrl,
        };
        
        // Load existing accounts
        const savedAccountsJSON = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
        let accounts: SavedAccount[] = savedAccountsJSON ? JSON.parse(savedAccountsJSON) : [];
        
        // Check if account already exists
        const existingIndex = accounts.findIndex(
          acc => acc.username === username && acc.server_url === formattedServerUrl
        );
        
        if (existingIndex !== -1) {
          // Update existing account
          accounts[existingIndex] = newAccount;
        } else {
          // Add new account
          accounts.push(newAccount);
        }
        
        // Save updated accounts list
        await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (error) {
        console.error('Failed to save account:', error);
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } else {
      setError('Login failed. Please check your credentials and try again.');
    }
  };
  
  // Handle login from saved account
  const handleLoginFromSavedAccount = (account: SavedAccount) => {
    setPlaylistName(account.playlistName);
    setUsername(account.username);
    setPassword(account.password);
    setServerUrl(account.server_url);
    setShowAccountsModal(false);
    
    // Automatically login after a short delay
    setTimeout(() => {
      handleLogin();
    }, 300);
  };
  
  // Delete saved account
  const handleDeleteAccount = async (index: number) => {
    try {
      const updatedAccounts = [...savedAccounts];
      updatedAccounts.splice(index, 1);
      
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
      setSavedAccounts(updatedAccounts);
    } catch (error) {
      console.error('Failed to delete account:', error);
      Alert.alert('Error', 'Failed to delete account');
    }
  };
  
  // Render saved account item
  const renderAccountItem = ({ item, index }: { item: SavedAccount; index: number }) => (
    <View style={[styles.accountItem, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
      <TouchableOpacity 
        style={styles.accountContent}
        onPress={() => handleLoginFromSavedAccount(item)}
      >
        <View style={styles.accountIcon}>
          <Ionicons 
            name="tv-outline" 
            size={30} 
            color={colors.primary} 
          />
        </View>
        <View style={styles.accountDetails}>
          <Text style={[styles.accountName, { color: colors.text }]}>
            {item.playlistName}
          </Text>
          <Text style={[styles.accountUsername, { color: isDark ? '#aaa' : '#666' }]}>
            {item.username}
          </Text>
          <Text 
            style={[styles.accountServer, { color: isDark ? '#888' : '#777' }]}
            numberOfLines={1}
          >
            {item.server_url}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteAccountButton}
        onPress={() => {
          Alert.alert(
            'Delete Account',
            `Are you sure you want to delete "${item.playlistName}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: () => handleDeleteAccount(index) 
              }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <LinearGradient
        colors={
          isDark 
            ? ['#000000', '#121212', '#1E1E1E'] 
            : ['#F0F0F0', '#FFFFFF']
        }
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Text style={[styles.appTitle, { color: colors.primary }]}>
              IPTV Player
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.text }]}>
              Stream Anywhere, Anytime
            </Text>
          </View>
          
          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.loginTitle, { color: colors.text }]}>
              Login to Your Account
            </Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {/* Saved Accounts Button */}
            <TouchableOpacity
              style={[styles.savedAccountsButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                loadSavedAccounts();
                setShowAccountsModal(true);
              }}
            >
              <Ionicons name="list-outline" size={20} color={colors.primary} />
              <Text style={[styles.savedAccountsButtonText, { color: colors.primary }]}>
                View Saved Accounts
              </Text>
            </TouchableOpacity>
            
            {/* Playlist Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="list-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Playlist Name (optional)"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={playlistName}
                onChangeText={setPlaylistName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Username *"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Password *"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="server-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Server URL * (e.g., http://example.com)"
                placeholderTextColor={isDark ? '#777' : '#999'}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text }]}>
              Powered by Xtream Codes API
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* Saved Accounts Modal */}
      <Modal
        visible={showAccountsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Saved Accounts</Text>
              <TouchableOpacity onPress={() => setShowAccountsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {loadingAccounts ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 20 }} />
            ) : savedAccounts.length === 0 ? (
              <Text style={[styles.noAccountsText, { color: colors.text }]}>
                No saved accounts found. Login to save an account.
              </Text>
            ) : (
              <FlatList
                data={savedAccounts}
                renderItem={renderAccountItem}
                keyExtractor={(item, index) => `${item.username}-${item.server_url}-${index}`}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#eee' }} />}
                style={{ maxHeight: 400 }}
              />
            )}
            
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: colors.primary, marginTop: 20 }]}
              onPress={() => setShowAccountsModal(false)}
            >
              <Text style={styles.loginButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF3B30',
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
  },
  savedAccountsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  savedAccountsButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noAccountsText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  accountContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  accountServer: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteAccountButton: {
    padding: 10,
  },
}); 