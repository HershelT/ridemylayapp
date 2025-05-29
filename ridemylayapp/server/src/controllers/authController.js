const User = require('../models/User');
const jwt = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, ...rest } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      ...rest
    });

    // Remove password from response
    user.passwordHash = undefined;

    // Generate token
    const token = jwt.generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {    const { emailOrUsername, password } = req.body;

    // Check if user exists by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Update last active
    user.lastActive = Date.now();
    await user.save();

    // Remove password from response
    user.passwordHash = undefined;

    // Generate token
    const token = jwt.generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Fields to update
    const { username, bio, avatarUrl, settings } = req.body;

    // Check if username is taken if user is changing username
    if (username) {
      const userWithUsername = await User.findOne({ username });
      if (userWithUsername && userWithUsername._id.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }

    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          username, 
          bio, 
          avatarUrl,
          settings,
          lastActive: Date.now()
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user.id).select('+passwordHash');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    // Update password
    user.passwordHash = newPassword;
    user.lastActive = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};
