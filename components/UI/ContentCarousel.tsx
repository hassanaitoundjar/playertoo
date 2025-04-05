import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CarouselItem {
  id: number;
  title: string;
  image?: string;
  backdrop?: string;
  description?: string;
  type: 'live' | 'vod' | 'series';
}

interface ContentCarouselProps {
  title: string;
  data: CarouselItem[];
  onItemPress: (item: CarouselItem) => void;
  autoScroll?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width;
const ITEM_HEIGHT = width * 0.56; // 16:9 aspect ratio

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  data,
  onItemPress,
  autoScroll = true,
}) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // AutoScroll functionality
  React.useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    
    if (autoScroll && data.length > 1) {
      scrollInterval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % data.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * ITEM_WIDTH,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 5000); // Auto-scroll every 5 seconds
    }
    
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [currentIndex, data.length, autoScroll]);
  
  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / ITEM_WIDTH);
    setCurrentIndex(index);
  };
  
  const getTypeLabel = (type: 'live' | 'vod' | 'series') => {
    switch (type) {
      case 'live':
        return 'LIVE';
      case 'vod':
        return 'MOVIE';
      case 'series':
        return 'SERIES';
      default:
        return '';
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {data.map((item, index) => (
          <View key={`${item.type}-${item.id}`} style={styles.itemContainer}>
            <ImageBackground
              source={{ uri: (item.backdrop || item.image) || undefined }}
              defaultSource={require('../../assets/images/placeholder.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              >
                <View style={styles.contentContainer}>
                  <View style={styles.typeContainer}>
                    <Text style={styles.typeLabel}>{getTypeLabel(item.type)}</Text>
                  </View>
                  
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  
                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: colors.primary }]}
                    onPress={() => onItemPress(item)}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
      
      {/* Pagination dots */}
      {data.length > 1 && (
        <View style={styles.paginationContainer}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : 'rgba(255, 255, 255, 0.5)',
                  width: index === currentIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 15,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
  },
  contentContainer: {
    padding: 15,
  },
  typeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typeLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: 'white',
    fontSize: 14,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
}); 