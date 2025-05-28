const winston = require('winston');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(
    ({ level, message, timestamp, stack }) => {
      if (stack) {
        // Print log level, timestamp, message, and stack trace for errors
        return `${timestamp} ${level}: ${message}\n${stack}`;
      }
      // Print log level, timestamp, and message for non-errors
      return `${timestamp} ${level}: ${message}`;
    }
  )
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
  // Prevent winston from exiting on error
  exitOnError: false
});

// Create a stream object for Morgan middleware
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
