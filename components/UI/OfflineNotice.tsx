import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../services/network';

const { width } = Dimensions.get('window');

export const OfflineNotice: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-60)).current;
  
  useEffect(() => {
    if (isOffline) {
      // Animate in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      // Animate out
      Animated.spring(translateY, {
        toValue: -60,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }, [isOffline]);
  
  if (!isOffline) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    position: 'absolute',
    top: 0,
    width: width,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 