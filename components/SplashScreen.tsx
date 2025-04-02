import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Image,
  Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SplashScreenProps {
  onAnimationComplete: () => void;
  appName?: string;
  logoSource?: any;
  duration?: number;
}

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ 
  onAnimationComplete,
  appName = 'IPTV Player', 
  logoSource,
  duration = 3000
}: SplashScreenProps) => {
  const { colors, isDark } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);
  
  // Derived animations
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Start pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  };
  
  useEffect(() => {
    // Prevent multiple animation sequences
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    
    // Start main animation sequence
    Animated.sequence([
      // Fade in logo with scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      
      // Start rotation (for icon only)
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      
      // Fade in text
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Hold for a moment
      Animated.delay(duration - 2000), // Adjust based on total duration
      
      // Fade out everything
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Animation complete callback
      onAnimationComplete();
    });
    
    // Start pulse animation separately
    startPulseAnimation();
    
    // Cleanup function
    return () => {
      // No need for cleanup as animations will be stopped when component unmounts
    };
  }, []);
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#121212' : '#ffffff' }
    ]}>
      {/* Background glow effect */}
      <Animated.View 
        style={[
          styles.glowEffect,
          { 
            backgroundColor: colors.primary + '20',
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      />
      
      {/* Logo Animation */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: logoSource ? '0deg' : rotate } // Only rotate if using icon
            ]
          }
        ]}
      >
        {logoSource ? (
          <Image 
            source={logoSource} 
            style={styles.logo} 
            resizeMode="contain"
          />
        ) : (
          <View style={[
            styles.iconContainer,
            { backgroundColor: colors.primary }
          ]}>
            <Ionicons 
              name="play-circle" 
              size={80} 
              color="white" 
            />
          </View>
        )}
      </Animated.View>
      
      {/* App Name */}
      <Animated.Text 
        style={[
          styles.appName,
          { 
            color: colors.text,
            opacity: textFadeAnim,
          }
        ]}
      >
        {appName}
      </Animated.Text>
      
      {/* Subtitle/Version */}
      <Animated.Text 
        style={[
          styles.subtitle,
          { 
            color: isDark ? '#999' : '#666',
            opacity: textFadeAnim,
          }
        ]}
      >
        Your Ultimate IPTV Experience
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  glowEffect: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 140,
    height: 140,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
});

export default SplashScreen; 