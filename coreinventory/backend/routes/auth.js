const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register, login, logout, refreshToken,
  getMe, forgotPassword, verifyOTP, resetPassword, updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again after an hour.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);
router.put('/update-password', protect, updatePassword);

module.exports = router;
