import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import './Items.css';

function Items() {
  const { items, loading, error, pagination, fetchItems, searchItems, sortItems, loadMoreItems } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [wasFocused, setWasFocused] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonTimeout, setSkeletonTimeout] = useState(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const mountedRef = useRef(true);
  const searchInputRef = useRef(null);

  // Minimum loading time for skeleton (in milliseconds)
  const MIN_LOADING_TIME = 500;

  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' }
  ];

  // Calculate responsive list height
  const listHeight = useMemo(() => {
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    if (isSmallMobile) {
      return Math.max(400, windowHeight - 200); // Account for header and controls
    } else if (isMobile) {
      return Math.max(500, windowHeight - 180);
    } else {
      return 600; // Desktop default
    }
  }, [windowHeight]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize with first page
  useEffect(() => {
    mountedRef.current = true;
    
    const loadInitialData = async () => {
      if (mountedRef.current) {
        setShowSkeleton(true);
        const startTime = Date.now();
        
        await fetchItems({ page: 1, limit: 20, sort: sortOption });
        
        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        if (remainingTime > 0) {
          const timeout = setTimeout(() => {
            if (mountedRef.current) {
              setShowSkeleton(false);
            }
          }, remainingTime);
          setSkeletonTimeout(timeout);
        } else {
          setShowSkeleton(false);
        }
      }
    };
    
    loadInitialData();

    return () => {
      mountedRef.current = false;
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (skeletonTimeout) {
        clearTimeout(skeletonTimeout);
      }
    };
  }, [fetchItems, sortOption]);

  // Restore focus after re-renders
  useEffect(() => {
    if (wasFocused && searchInputRef.current) {
      searchInputRef.current.focus();
      // Restore cursor position to end of input
      const length = searchInputRef.current.value.length;
      searchInputRef.current.setSelectionRange(length, length);
    }
  }, [items, wasFocused]);

  // Track focus state
  const handleInputFocus = useCallback(() => {
    setWasFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setWasFocused(false);
  }, []);

  // Handle sort change with reset
  const handleSortChange = useCallback(async (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    
    // Reset list and fetch with new sort order
    if (mountedRef.current) {
      setShowSkeleton(true);
      const startTime = Date.now();
      
      await sortItems(newSortOption);
      
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        const skeletonTimeout = setTimeout(() => {
          if (mountedRef.current) {
            setShowSkeleton(false);
          }
        }, remainingTime);
        setSkeletonTimeout(skeletonTimeout);
      } else {
        setShowSkeleton(false);
      }
    }
  }, [sortItems]);

  // Handle search button click
  const handleSearchClick = useCallback(async () => {
    if (mountedRef.current) {
      setShowSkeleton(true);
      const startTime = Date.now();
      
      await searchItems(searchQuery, sortOption);
      
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        const skeletonTimeout = setTimeout(() => {
          if (mountedRef.current) {
            setShowSkeleton(false);
          }
        }, remainingTime);
        setSkeletonTimeout(skeletonTimeout);
      } else {
        setShowSkeleton(false);
      }
    }
  }, [searchQuery, searchItems, sortOption]);

  // Handle enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  }, [handleSearchClick]);

  // Debounced search with minimum loading time
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(async () => {
      if (mountedRef.current) {
        setShowSkeleton(true);
        const startTime = Date.now();
        
        await searchItems(query, sortOption);
        
        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        if (remainingTime > 0) {
          const skeletonTimeout = setTimeout(() => {
            if (mountedRef.current) {
              setShowSkeleton(false);
            }
          }, remainingTime);
          setSkeletonTimeout(skeletonTimeout);
        } else {
          setShowSkeleton(false);
        }
      }
    }, 300);
    
    setSearchTimeout(timeout);
  }, [searchItems, searchTimeout, sortOption]);

  // Load more items for infinite scroll
  const handleLoadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (loading || !pagination?.hasNext) return;
    
    try {
      const nextPage = Math.floor(startIndex / 20) + 1;
      await loadMoreItems(nextPage, sortOption, searchQuery);
    } catch (error) {
      console.error('Error loading more items:', error);
    }
  }, [loadMoreItems, loading, pagination, searchQuery, sortOption]);

  // Check if item is loaded
  const isItemLoaded = useCallback((index) => {
    return !pagination?.hasNext || index < items.length;
  }, [pagination, items.length]);

  // Calculate responsive item size
  const itemSize = useMemo(() => {
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    if (isSmallMobile) {
      return 100; // Smaller items for small mobile
    } else if (isMobile) {
      return 90; // Medium items for mobile
    } else {
      return 80; // Desktop default
    }
  }, []);

  // Memoize the search input to prevent unnecessary re-renders
  const searchInput = useMemo(() => (
    <div className="search-input-container">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="search-input"
      />
      <button
        onClick={handleSearchClick}
        className="search-button"
        type="button"
        aria-label="Search items"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>
  ), [searchQuery, handleSearchChange, handleKeyPress, handleInputFocus, handleInputBlur, handleSearchClick]);

  // Memoize the sort dropdown
  const sortDropdown = useMemo(() => (
    <select
      value={sortOption}
      onChange={handleSortChange}
      className="sort-dropdown"
    >
      {sortOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ), [sortOption, handleSortChange]);

  // Virtualized row renderer
  const Row = useCallback(({ index, style }) => {
    // Show skeleton during initial load or search
    if (showSkeleton && items.length === 0) {
      return (
        <div style={style} className="item-row">
          <div className="item-content">
            <div className="skeleton-name"></div>
            <div className="skeleton-category"></div>
            <div className="skeleton-price"></div>
          </div>
        </div>
      );
    }

    const item = items[index];
    
    if (!isItemLoaded(index)) {
      // Loading skeleton for unloaded items
      return (
        <div style={style} className="item-row">
          <div className="item-content">
            <div className="skeleton-name"></div>
            <div className="skeleton-category"></div>
            <div className="skeleton-price"></div>
          </div>
        </div>
      );
    }
    
    if (!item) return null;
    
    return (
      <div style={style} className="item-row">
        <div className="item-content">
          <h3 className="item-name">{item.name}</h3>
          <p className="item-category">{item.category}</p>
          <p className="item-price">${item.price.toLocaleString()}</p>
          <Link to={`/items/${item.id}`} className="item-link-overlay" aria-label={`View details for ${item.name}`} />
        </div>
      </div>
    );
  }, [items, isItemLoaded, showSkeleton]);

  // Error state
  if (error) {
    return (
      <div className="items-container">
        <div className="error-container">
          <h2>Error loading items</h2>
          <p>{error}</p>
          <button onClick={() => fetchItems({ page: 1, sort: sortOption })} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="items-container">
      <div className="search-controls-row">
        {searchInput}
        {items.length > 0 && sortDropdown}
      </div>

      {items.length === 0 && !loading && !showSkeleton ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="items-list">
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={showSkeleton && items.length === 0 ? 10 : (pagination?.hasNext ? items.length + 1 : items.length)}
            loadMoreItems={handleLoadMoreItems}
            threshold={5} // Start loading 5 items before reaching the end
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={listHeight}
                itemCount={showSkeleton && items.length === 0 ? 10 : (pagination?.hasNext ? items.length + 1 : items.length)}
                itemSize={itemSize}
                width="100%"
                onItemsRendered={onItemsRendered}
                className="virtualized-list"
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
          
          {loading && items.length > 0 && (
            <div className="infinite-loading">
              <div className="loading-spinner"></div>
              <p>Loading more items...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Items;