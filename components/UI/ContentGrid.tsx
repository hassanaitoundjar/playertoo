import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ContentItem {
  id: number;
  title: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

interface ContentGridProps {
  title: string;
  data: ContentItem[];
  onItemPress: (item: ContentItem) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  numColumns?: number;
  showType?: boolean;
}

const { width } = Dimensions.get('window');

export const ContentGrid: React.FC<ContentGridProps> = ({
  title,
  data,
  onItemPress,
  isLoading = false,
  emptyMessage = 'No content available',
  numColumns = 3,
  showType = false,
}) => {
  const { colors, isDark } = useTheme();
  const itemWidth = (width - 40) / numColumns;
  
  const renderItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { width: itemWidth }]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.border }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image || undefined }}
            defaultSource={require('../../assets/images/placeholder.png')}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: colors.card }]}>
            <Ionicons
              name={
                item.type === 'live'
                  ? 'tv-outline'
                  : item.type === 'vod'
                  ? 'film-outline'
                  : 'albums-outline'
              }
              size={28}
              color={colors.primary}
            />
          </View>
        )}
        
        {showType && (
          <View style={[styles.typeTag, { backgroundColor: colors.primary }]}>
            <Text style={styles.typeText}>
              {item.type === 'live' ? 'LIVE' : item.type === 'vod' ? 'MOVIE' : 'SERIES'}
            </Text>
          </View>
        )}
      </View>
      
      <Text 
        style={[styles.title, { color: colors.text }]} 
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {emptyMessage}
          </Text>
        </>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
  },
  gridContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 15,
    padding: 5,
  },
  imageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    aspectRatio: 2/3,
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  typeTag: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
}); 