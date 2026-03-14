const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken, hashToken } = require('../utils/jwt');
const { sendOTPEmail } = require('../utils/email');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, role: role || 'staff' });

    const { refreshToken } = sendTokenResponse(user, 201, res, 'Account created successfully.');

    // Store hashed refresh token
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Get user with password
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +isActive');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact admin.' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
          : 'Account locked for 15 minutes due to too many failed attempts.',
      });
    }

    // Success - reset attempts
    await user.resetLoginAttempts();

    const { refreshToken } = sendTokenResponse(user, 200, res, 'Login successful.');

    // Store hashed refresh token
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token from DB
    await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null }, { validateBeforeSave: false });

    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (uses refresh token cookie)
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const decoded = verifyRefreshToken(token);
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      _id: decoded.id,
      refreshTokenHash: hashedToken,
    }).select('+refreshTokenHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
    }
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpire +resetPasswordOTPAttempts');

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, an OTP has been sent.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;

    // Hash OTP before storing
    user.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordOTPExpire = new Date(Date.now() + expireMinutes * 60 * 1000);
    user.resetPasswordOTPAttempts = 0;
    await user.save({ validateBeforeSave: false });

    try {
      await sendOTPEmail(user.email, user.name, otp);
    } catch (emailError) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Try again.' });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email}. Valid for ${expireMinutes} minutes.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpire +resetPasswordOTPAttempts');

    if (!user || !user.resetPasswordOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP request.' });
    }

    // Max 5 OTP attempts
    if (user.resetPasswordOTPAttempts >= 5) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOTP !== user.resetPasswordOTP) {
      user.resetPasswordOTPAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    // OTP verified — issue a short-lived reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordOTP = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordOTPExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 min to reset
    user.resetPasswordOTPAttempts = 0;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP verified.',
      resetToken, // Frontend uses this to call reset-password
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedToken,
      resetPasswordOTPExpire: { $gt: Date.now() },
    }).select('+resetPasswordOTP +resetPasswordOTPExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.refreshTokenHash = undefined; // Invalidate all sessions
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password (logged in)
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    const { refreshToken } = sendTokenResponse(user, 200, res, 'Password updated successfully.');
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    next(error);
  }
};
