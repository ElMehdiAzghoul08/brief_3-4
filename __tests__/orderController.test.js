const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Order = require('../models/order');

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
  await Order.deleteMany({});
});

describe('Order Controller', () => {
  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        user: mongoose.Types.ObjectId(),
        products: [
          {
            product: mongoose.Types.ObjectId(),
            quantity: 2
          }
        ],
        totalAmount: 100
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.totalAmount).toBe(100);
    });
  });

  describe('GET /orders', () => {
    it('should retrieve all orders', async () => {
      await Order.create([
        { user: mongoose.Types.ObjectId(), totalAmount: 100 },
        { user: mongoose.Types.ObjectId(), totalAmount: 200 }
      ]);

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update an order', async () => {
      const order = await Order.create({
        user: mongoose.Types.ObjectId(),
        totalAmount: 100
      });

      const response = await request(app)
        .put(`/api/orders/${order._id}`)
        .send({ totalAmount: 150 })
        .expect(200);

      expect(response.body.totalAmount).toBe(150);
    });

    it('should return 404 if order not found', async () => {
      await request(app)
        .put(`/api/orders/${mongoose.Types.ObjectId()}`)
        .send({ totalAmount: 150 })
        .expect(404);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete an order', async () => {
      const order = await Order.create({
        user: mongoose.Types.ObjectId(),
        totalAmount: 100
      });

      await request(app)
        .delete(`/api/orders/${order._id}`)
        .expect(200);

      const deletedOrder = await Order.findById(order._id);
      expect(deletedOrder).toBeNull();
    });

    it('should return 404 if order not found', async () => {
      await request(app)
        .delete(`/api/orders/${mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });
});