const mongoose = require('mongoose');
require('dotenv').config();
// Import logger utility for logging
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    // Remove deprecated options since using Mongoose 6+
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Add event listeners for connection states
    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB Error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Disconnected');
    });

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const closeDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, closeDB };
