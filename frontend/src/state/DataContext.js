import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchItems = useCallback(async (params = {}) => {
    const { q = '', page = 1, limit = 10, sort = 'default', append = false } = params;
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        q,
        page: page.toString(),
        limit: limit.toString(),
        sort
      });
      
      const res = await fetch(`http://localhost:3001/api/items?${queryParams}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (append && page > 1) {
        // Append items for pagination
        setItems(prevItems => {
          const existingIds = new Set(prevItems.map(item => item.id));
          const newItems = data.items.filter(item => !existingIds.has(item.id));
          return [...prevItems, ...newItems];
        });
      } else {
        // Replace items for new searches or sort changes
        setItems(data.items);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchItems = useCallback(async (query, sort = 'default') => {
    await fetchItems({ q: query, page: 1, sort, append: false });
  }, [fetchItems]);

  const loadPage = useCallback(async (page, sort = 'default') => {
    await fetchItems({ page, sort, append: page > 1 });
  }, [fetchItems]);

  const sortItems = useCallback(async (sortOption) => {
    // Reset to page 1 when sorting changes
    await fetchItems({ page: 1, sort: sortOption, append: false });
  }, [fetchItems]);

  const loadMoreItems = useCallback(async (page, sort = 'default', searchQuery = '') => {
    await fetchItems({ 
      page, 
      limit: 20, 
      q: searchQuery, 
      sort, 
      append: true 
    });
  }, [fetchItems]);

  return (
    <DataContext.Provider value={{ 
      items, 
      loading, 
      error, 
      pagination,
      fetchItems, 
      searchItems,
      loadPage,
      sortItems,
      loadMoreItems
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);