const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Register
router.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty(),
    body('role').isIn(['creator', 'student'])
], authController.register);

// Login
router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], authController.login);

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
