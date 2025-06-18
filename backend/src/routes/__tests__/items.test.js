const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const itemsRouter = require('../items');

const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

describe('Items Routes', () => {
  const mockItems = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
    { id: 2, name: 'Noise Cancelling Headphones', category: 'Electronics', price: 399 },
    { id: 3, name: 'Ultra-Wide Monitor', category: 'Electronics', price: 999 },
    { id: 4, name: 'Ergonomic Chair', category: 'Furniture', price: 799 },
    { id: 5, name: 'Standing Desk', category: 'Furniture', price: 1199 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cache before each test
    itemsRouter.clearCache();
  });

  describe('GET /api/items', () => {
    it('should return all items when no query parameters', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.items).toEqual(mockItems.slice(0, 10)); // Default page size
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should filter items by search query', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?q=electronics')
        .expect(200);

      expect(response.body.items).toHaveLength(3);
      expect(response.body.items.every(item => 
        item.name.toLowerCase().includes('electronics') || 
        item.category.toLowerCase().includes('electronics')
      )).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items?limit=2&page=2')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 2,
        pageSize: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should handle file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body.error).toBe('File not found');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/1')
        .expect(200);

      expect(response.body).toEqual(mockItems[0]);
    });

    it('should return 404 for non-existent item', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/999')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should handle invalid id parameter', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));

      const response = await request(app)
        .get('/api/items/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid ID parameter');
    });
  });

  describe('POST /api/items', () => {
    it('should create new item with valid data', async () => {
      const newItem = { name: 'Test Item', category: 'Test', price: 100 };
      const expectedItem = { id: expect.any(Number), ...newItem };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockResolvedValue();

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toEqual(expectedItem);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should return 400 for missing name', async () => {
      const invalidItem = { category: 'Test', price: 100 };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('Invalid item data');
    });

    it('should return 400 for missing category', async () => {
      const invalidItem = { name: 'Test Item', price: 100 };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('Invalid item data');
    });

    it('should return 400 for invalid price', async () => {
      const invalidItem = { name: 'Test Item', category: 'Test', price: -100 };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('Invalid item data');
    });

    it('should return 400 for non-numeric price', async () => {
      const invalidItem = { name: 'Test Item', category: 'Test', price: 'invalid' };

      const response = await request(app)
        .post('/api/items')
        .send(invalidItem)
        .expect(400);

      expect(response.body.error).toContain('Invalid item data');
    });

    it('should handle file write errors', async () => {
      const newItem = { name: 'Test Item', category: 'Test', price: 100 };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
      fs.writeFile.mockRejectedValue(new Error('Write failed'));

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);

      expect(response.body.error).toBe('Write failed');
    });
  });
}); 