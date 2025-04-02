import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PlayerSettingsProvider } from '../context/PlayerSettingsContext';
import { OfflineNotice } from '../components/UI/OfflineNotice';
import SplashScreen from '../components/SplashScreen';

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    // Check if the path is protected
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Prevent unnecessary redirects that could cause infinite loops
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace('/(auth)/login');
      }
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace('/(tabs)');
      }
    } else {
      // Reset the navigation flag when we're in the correct group
      hasNavigated.current = false;
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <View style={{ flex: 1 }}>
      <OfflineNotice />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="live" options={{ headerShown: false }} />
        <Stack.Screen name="movies" options={{ headerShown: false }} />
        <Stack.Screen name="series" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  
  const [showSplash, setShowSplash] = useState(true);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide the native splash screen
      ExpoSplashScreen.hideAsync();
      
      // We'll keep our custom splash screen visible
      // It will hide itself after the animation completes
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  const handleSplashAnimationComplete = () => {
    setShowSplash(false);
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PlayerSettingsProvider>
            {showSplash ? (
              <SplashScreen 
                onAnimationComplete={handleSplashAnimationComplete} 
                appName="IPTV Player"
                // Using the default icon (no logoSource provided)
                duration={3000}
              />
            ) : null}
            <RootLayoutNav />
          </PlayerSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
