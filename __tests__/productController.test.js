const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Product = require('../models/product');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
});

describe('Product Controller', () => {
  describe('POST /products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        price: 19.99,
        description: 'A test product'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Test Product');
    });
  });

  describe('GET /products', () => {
    it('should retrieve all products', async () => {
      await Product.create([
        { name: 'Product 1', price: 10 },
        { name: 'Product 2', price: 20 }
      ]);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update a product', async () => {
      const product = await Product.create({
        name: 'Old Name',
        price: 10
      });

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ name: 'New Name', price: 15 })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.price).toBe(15);
    });

    it('should return 404 if product not found', async () => {
      await request(app)
        .put(`/api/products/${mongoose.Types.ObjectId()}`)
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product', async () => {
      const product = await Product.create({
        name: 'To Be Deleted',
        price: 10
      });

      await request(app)
        .delete(`/api/products/${product._id}`)
        .expect(200);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 if product not found', async () => {
      await request(app)
        .delete(`/api/products/${mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });

  describe('GET /products/search', () => {
    it('should search products', async () => {
      await Product.create([
        { name: 'Apple', price: 1 },
        { name: 'Banana', price: 2 },
        { name: 'Orange', price: 3 }
      ]);

      const response = await request(app)
        .get('/api/products/search?query=Apple')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Apple');
    });
  });

  describe('GET /products/paginate', () => {
    it('should paginate products', async () => {
      const products = Array.from({ length: 15 }, (_, i) => ({
        name: `Product ${i + 1}`,
        price: i + 1
      }));
      await Product.create(products);

      const response = await request(app)
        .get('/api/products/paginate?page=2&limit=10')
        .expect(200);

      expect(response.body).toHaveLength(5);
    });
  });
});