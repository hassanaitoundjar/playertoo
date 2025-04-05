import { useState, useEffect, useCallback, useRef } from 'react';

export function usePaginatedData<T>(
  allItems: T[],
  initialPageSize: number = 20,
  loadMoreThreshold: number = 5
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const isLoadingMoreRef = useRef(false);
  
  // Initialize with first page
  useEffect(() => {
    setVisibleItems(allItems.slice(0, initialPageSize));
    setPageSize(initialPageSize);
  }, [allItems, initialPageSize]);
  
  // Load more items when needed
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || visibleItems.length >= allItems.length) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    
    // Use requestAnimationFrame to avoid blocking the UI
    requestAnimationFrame(() => {
      const nextItems = allItems.slice(0, pageSize + initialPageSize);
      setVisibleItems(nextItems);
      setPageSize(prevSize => prevSize + initialPageSize);
      isLoadingMoreRef.current = false;
    });
  }, [allItems, visibleItems.length, pageSize, initialPageSize]);
  
  // Handle scroll events in FlatList
  const handleEndReached = useCallback(({ distanceFromEnd }: { distanceFromEnd: number }) => {
    if (distanceFromEnd < loadMoreThreshold) {
      return;
    }
    
    loadMore();
  }, [loadMore, loadMoreThreshold]);
  
  return { 
    visibleItems, 
    loadMore, 
    handleEndReached,
    hasMore: visibleItems.length < allItems.length,
    totalItems: allItems.length
  };
} 