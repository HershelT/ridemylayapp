const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes - authentication middleware
const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    logger.warn('No auth token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const { valid, decoded, error } = verifyToken(token);
    
    if (!valid) {
      logger.warn(`Invalid token: ${error}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      logger.warn(`User not found for token ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn(`Admin access attempt by user: ${req.user.id}`);
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
};

module.exports = {
  protect,
  admin
};
