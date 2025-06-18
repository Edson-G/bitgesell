const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate cache key
function generateCacheKey(params) {
  const { q = '', page = 1, limit = 10, sort = 'default' } = params;
  return `${q}_${page}_${limit}_${sort}`;
}

// Get cached data
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// Set cached data
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Clear cache (call when data changes)
function clearCache() {
  cache.clear();
}

// Export clearCache for testing
router.clearCache = clearCache;

// Utility to read data (async version)
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // Re-throw the error to be handled by the route
    throw err;
  }
}

// Utility to write data (async version)
async function writeData(data) {
  try {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    // Clear cache when data changes
    clearCache();
  } catch (err) {
    // Re-throw the error to be handled by the route
    throw err;
  }
}

// Sort items based on sort parameter
function sortItems(items, sortBy) {
  if (!sortBy || sortBy === 'default') {
    return items;
  }

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      default:
        return 0;
    }
  });
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const { limit, q, page = 1, sort } = req.query;
    const cacheKey = generateCacheKey({ q, page, limit, sort });
    
    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const data = await readData();
    let results = data;

    // Server-side search
    if (q) {
      results = results.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        item.category.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Server-side sorting
    results = sortItems(results, sort);

    // Pagination
    const pageSize = limit ? parseInt(limit) : 10;
    const pageNum = parseInt(page);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedResults = results.slice(startIndex, endIndex);
    
    const response = {
      items: paginatedResults,
      pagination: {
        page: pageNum,
        pageSize,
        total: results.length,
        totalPages: Math.ceil(results.length / pageSize),
        hasNext: endIndex < results.length,
        hasPrev: pageNum > 1
      }
    };

    // Cache the result
    setCachedData(cacheKey, response);
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if ID is valid (not NaN)
    if (isNaN(id)) {
      const err = new Error('Invalid ID parameter');
      err.status = 400;
      throw err;
    }
    
    const data = await readData();
    const item = data.find(i => i.id === id);
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // Validate payload
    const { name, category, price } = req.body;
    if (!name || !category || typeof price !== 'number' || price < 0) {
      const err = new Error('Invalid item data. Name, category, and positive price are required.');
      err.status = 400;
      throw err;
    }

    const data = await readData();
    const newItem = {
      id: Date.now(),
      name,
      category,
      price
    };
    
    data.push(newItem);
    await writeData(data);
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;