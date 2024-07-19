const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authmiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Public routes
router.post('/', userController.createUser);
router.post('/login', authLimiter, userController.loginUser);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/request-password-reset', authLimiter, userController.requestPasswordReset);
router.post('/reset-password/:token', userController.resetPassword);

// Protected routes
router.get('/', auth, userController.getUsers);
router.get('/:id', auth, userController.getUserById);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;