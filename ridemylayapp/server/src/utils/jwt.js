const jwt = require('jsonwebtoken');
const logger = require('./logger');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    logger.error(`JWT verification error: ${error.message}`);
    return { valid: false, error: error.message };
  }
};

module.exports = {
  generateToken,
  verifyToken
};
