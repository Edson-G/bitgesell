const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Cache for stats
let statsCache = null;
let lastModified = null;

// Calculate stats
function calculateStats(items) {
  return {
    total: items.length,
    averagePrice: items.length > 0 ? items.reduce((acc, cur) => acc + cur.price, 0) / items.length : 0,
    categories: items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {}),
    priceRange: items.length > 0 ? {
      min: Math.min(...items.map(item => item.price)),
      max: Math.max(...items.map(item => item.price))
    } : { min: 0, max: 0 }
  };
}

// Check if cache is valid
async function isCacheValid() {
  try {
    const stats = await fs.stat(DATA_PATH);
    return lastModified && stats.mtime.getTime() === lastModified.getTime();
  } catch (err) {
    return false;
  }
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    // Check if cache is still valid
    if (statsCache && await isCacheValid()) {
      return res.json(statsCache);
    }

    // Read fresh data and calculate stats
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);
    
    // Update cache
    statsCache = calculateStats(items);
    const stats = await fs.stat(DATA_PATH);
    lastModified = stats.mtime.getTime();

    res.json(statsCache);
  } catch (err) {
    next(err);
  }
});

module.exports = router;