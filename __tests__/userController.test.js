const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user');
const emailService = require('../services/emailService');

jest.mock('../services/emailService');

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
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('User Controller', () => {
  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      emailService.sendVerificationEmail.mockResolvedValue();

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created. Please check your email to verify your account.');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('POST /users/login', () => {
    it('should login a user', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        emailVerified: true
      });
      await user.save();

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should not login unverified user', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        emailVerified: false
      });
      await user.save();

      await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('should retrieve all users', async () => {
      await User.create([
        { email: 'user1@example.com', password: 'password' },
        { email: 'user2@example.com', password: 'password' }
      ]);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /users/:id', () => {
    it('should retrieve a user by id', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password'
      });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 404 if user not found', async () => {
      await request(app)
        .get(`/api/users/${mongoose.Types.ObjectId()}`)
        .expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user', async () => {
      const user = await User.create({
        email: 'old@example.com',
        password: 'password'
      });

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .send({ email: 'new@example.com' })
        .expect(200);

      expect(response.body.email).toBe('new@example.com');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const user = await User.create({
        email: 'delete@example.com',
        password: 'password'
      });

      await request(app)
        .delete(`/api/users/${user._id}`)
        .expect(200);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('GET /users/verify/:token', () => {
    it('should verify user email', async () => {
      const user = await User.create({
        email: 'verify@example.com',
        password: 'password',
        emailVerificationToken: 'testtoken'
      });

      await request(app)
        .get('/api/users/verify/testtoken')
        .expect(200);

      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.emailVerified).toBe(true);
      expect(verifiedUser.emailVerificationToken).toBeUndefined();
    });
  });

  describe('POST /users/reset-password', () => {
    it('should request password reset', async () => {
      const user = await User.create({
        email: 'reset@example.com',
        password: 'password'
      });

      emailService.sendPasswordResetEmail.mockResolvedValue();

      await request(app)
        .post('/api/users/reset-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('POST /users/reset-password/:token', () => {
    it('should reset password', async () => {
      const user = await User.create({
        email: 'reset@example.com',
        password: 'oldpassword',
        passwordResetToken: 'resettoken',
        passwordResetExpires: Date.now() + 3600000
      });

      await request(app)
        .post('/api/users/reset-password/resettoken')
        .send({ password: 'newpassword' })
        .expect(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();
    });
  });
});