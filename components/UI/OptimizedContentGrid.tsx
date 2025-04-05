import React, { useCallback, memo } from 'react';
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
import { usePaginatedData } from '../../hooks/usePaginatedData';

interface ContentItem {
  id: number;
  title: string;
  image?: string;
  type: 'live' | 'vod' | 'series';
}

interface OptimizedContentGridProps {
  title: string;
  data: ContentItem[];
  onItemPress: (item: ContentItem) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  numColumns?: number;
  showType?: boolean;
}

const { width } = Dimensions.get('window');

// Memoized item component for better performance
const GridItem = memo(({ 
  item, 
  onPress, 
  itemWidth, 
  colors, 
  isDark, 
  showType 
}: { 
  item: ContentItem, 
  onPress: () => void, 
  itemWidth: number, 
  colors: any, 
  isDark: boolean, 
  showType: boolean 
}) => (
  <TouchableOpacity
    style={[styles.itemContainer, { width: itemWidth }]}
    onPress={onPress}
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
));

export const OptimizedContentGrid: React.FC<OptimizedContentGridProps> = ({
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
  
  // Use paginated data hook
  const { 
    visibleItems, 
    handleEndReached, 
    hasMore, 
    totalItems 
  } = usePaginatedData<ContentItem>(data, 20, 5);
  
  // Memoized render function
  const renderItem = useCallback(({ item }: { item: ContentItem }) => (
    <GridItem
      item={item}
      onPress={() => onItemPress(item)}
      itemWidth={itemWidth}
      colors={colors}
      isDark={isDark}
      showType={showType}
    />
  ), [itemWidth, colors, isDark, showType, onItemPress]);
  
  // Memoized key extractor
  const keyExtractor = useCallback((item: ContentItem) => 
    `${item.type}-${item.id}`, []);
  
  const renderEmpty = useCallback(() => (
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
  ), [isLoading, colors.primary, colors.text, emptyMessage]);
  
  // Footer to show loading indicator when loading more items
  const renderFooter = useCallback(() => (
    hasMore ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null
  ), [hasMore, colors.primary]);
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {totalItems > 0 && (
          <Text style={[styles.count, { color: colors.text }]}>
            {totalItems} items
          </Text>
        )}
      </View>
      
      <FlatList
        data={visibleItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        windowSize={5} // Reducing the window size for better performance
        removeClippedSubviews={true} // Improves memory usage
        maxToRenderPerBatch={10} // Limit items rendered in each batch
        initialNumToRender={12} // Start with fewer items
        updateCellsBatchingPeriod={50} // Batch cell updates
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  count: {
    fontSize: 14,
    opacity: 0.7,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    margin: 5,
    marginBottom: 15,
  },
  imageContainer: {
    aspectRatio: 0.7,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    textAlign: 'center',
  },
  typeTag: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 