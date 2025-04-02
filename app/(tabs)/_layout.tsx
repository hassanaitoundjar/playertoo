import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  LayoutChangeEvent,
  Text,
  Platform,
  Easing
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Type for tab information
interface TabInfo {
  key: string;
  title: string;
  icon: {
    focused: React.ComponentProps<typeof Ionicons>['name'];
    unfocused: React.ComponentProps<typeof Ionicons>['name'];
  };
}

// Custom AnimatedTabBar component
function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();
  const [tabPositions, setTabPositions] = useState<{[key: string]: number}>({});
  const [tabWidths, setTabWidths] = useState<{[key: string]: number}>({});
  const animatedValue = useRef(new Animated.Value(0)).current;
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  // Define tab information
  const tabs: TabInfo[] = [
    { key: 'index', title: 'Home', icon: { focused: 'home', unfocused: 'home-outline' } },
    { key: 'live', title: 'Live TV', icon: { focused: 'tv', unfocused: 'tv-outline' } },
    { key: 'movies', title: 'Movies', icon: { focused: 'film', unfocused: 'film-outline' } },
    { key: 'series', title: 'Series', icon: { focused: 'albums', unfocused: 'albums-outline' } },
    { key: 'favorites', title: 'Favorites', icon: { focused: 'heart', unfocused: 'heart-outline' } },
    { key: 'settings', title: 'Settings', icon: { focused: 'settings', unfocused: 'settings-outline' } }
  ];
  
  // Animation when tab changes
  useEffect(() => {
    if (Object.keys(tabPositions).length === 0 || Object.keys(tabWidths).length === 0) return;
    
    const currentTab = state.routes[state.index].name;
    const position = tabPositions[currentTab] || 0;
    const tabWidth = tabWidths[currentTab] || 0;
    
    Animated.parallel([
      Animated.timing(indicatorPosition, {
        toValue: position,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }),
      Animated.timing(indicatorWidth, {
        toValue: tabWidth,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }),
      Animated.spring(animatedValue, {
        toValue: state.index,
        useNativeDriver: true,
        friction: 8
      })
    ]).start();
  }, [state.index, tabPositions, tabWidths]);
  
  // Handle tab layout to determine positions and widths
  const handleTabLayout = (key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    
    setTabPositions(prev => ({
      ...prev,
      [key]: x
    }));
    
    setTabWidths(prev => ({
      ...prev,
      [key]: width
    }));
    
    // Initialize indicator position if this is the active tab
    if (state.routes[state.index].name === key) {
      indicatorPosition.setValue(x);
      indicatorWidth.setValue(width);
    }
  };
  
  // Tab bar height calculation
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 50 + insets.bottom : 60;
  
  return (
    <View style={[
      styles.tabBar, 
      { 
        backgroundColor: isDark ? 'rgba(25, 28, 37, 0.95)' : 'rgba(255, 255, 255, 0.97)',
        borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        height: TAB_BAR_HEIGHT,
        paddingBottom: insets.bottom,
        marginBottom: 8,
        marginHorizontal: 10,
        borderTopWidth: 0.5,
        borderRadius: 16,
      }
    ]}>
      {/* Sliding Indicator */}
      <Animated.View 
        style={[
          styles.indicator, 
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: indicatorPosition }],
            width: indicatorWidth,
            bottom: TAB_BAR_HEIGHT - 48,
          }
        ]} 
      />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const tab = tabs.find(t => t.key === route.name);
          
          if (!tab) return null;
          
          const isFocused = state.index === index;
          
          // Icon scale animation
          const scale = animatedValue.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp'
          });
          
          const opacity = animatedValue.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp'
          });
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          
          const onLongPress = (event: any) => {
            // Show tab menu on long press
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
          
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={(e) => onLongPress(e)}
              style={styles.tab}
              onLayout={(e) => handleTabLayout(route.name, e)}
              delayLongPress={500}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.tabContent, { transform: [{ scale: scale }], opacity }]}>
                <Ionicons
                  name={isFocused ? tab.icon.focused : tab.icon.unfocused}
                  size={22}
                  color={isFocused ? colors.primary : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                  style={styles.tabIcon}
                />
                <Animated.Text 
                  style={[
                    styles.tabLabel, 
                    { 
                      color: isFocused ? colors.primary : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      opacity: opacity,
                      transform: [{ translateY: isFocused ? -2 : 0 }]
                    }
                  ]}
                  numberOfLines={1}
                >
                  {tab.title}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={handleSearchPress}
            style={styles.headerButton}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
        // Hide default tab bar since we're using custom one
        tabBarStyle: { display: 'none' }
      }}
      tabBar={props => <AnimatedTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live TV',
        }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: 'Movies',
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: 'Series',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'column',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  indicator: {
    height: 3,
    borderRadius: 1.5,
    position: 'absolute',
    top: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  headerButton: {
    padding: 10,
    marginRight: 5,
  },
});
