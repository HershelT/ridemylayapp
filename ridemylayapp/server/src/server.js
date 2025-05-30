const express = require('express');
const http = require('http'); // Required for Socket.IO
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path'); // Still useful for path.resolve if needed elsewhere, but not for serving client build

// Load environment variables from .env file
dotenv.config();

// Import modules
const { connectDB } = require('./config/db');
const routes = require('./routes');
const setupSocketIO = require('./sockets'); // Assuming this function handles io.on('connection') logic
const logger = require('./utils/logger'); // Your custom logger

// Create Express app
const app = express();

// --- Configuration for Allowed Origins ---
// In production, process.env.CLIENT_URL will be your Vercel frontend URL (e.g., https://ride-my-lay.vercel.app)
// and your custom domain (https://www.ridemylay.com).
// In development, it's localhost:3000
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, 'https://www.ridemylay.com', 'https://ride-my-lay.vercel.app', 'https://www.parrlei.com'] // Add your Vercel default domain here too
    : ['http://localhost:3000'];

// --- Middleware ---
app.use(helmet());

// CORS Configuration for Express API
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Logging (only in development for 'dev' format)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount API routes
app.use('/api', routes);

// --- REMOVED: Frontend serving logic ---
// The Node.js server on Render will NOT serve the React build.
// Vercel will serve the React frontend from its own deployment.
// Remove the following block:
/*
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/build')));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
    });
}
*/

// Error handling middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// --- Server Initialization for Render (and local development) ---
// This entire block replaces the previous conditional VERCEL logic.
// Render is not a serverless environment in the way Vercel functions are,
// so the server will start and listen on a port.
const init = async () => {
    try {
        // Connect to database
        await connectDB();
        logger.info('Database connected successfully.');

        // Create HTTP server for Express and Socket.IO
        const server = http.createServer(app);

        // Setup Socket.IO with CORS
        const io = setupSocketIO(server, { // Pass allowedOrigins to setupSocketIO
            cors: {
                origin: allowedOrigins, // Use the same allowedOrigins for Socket.IO
                methods: ["GET", "POST"], // Or other methods your Sockets use
                credentials: true
            }
        });

        // Set port
        const PORT = process.env.PORT || 5000; // Render will provide process.env.PORT

        // Start server
        server.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.info(`API accessible at http://localhost:${PORT}/api (or Render URL)`);
        });

        // Handle unhandled promise rejections (important for robustness)
        process.on('unhandledRejection', (err, promise) => {
            logger.error(`Unhandled Rejection: ${err.message}`, err);
            // Optionally, shut down gracefully after logging
            server.close(() => process.exit(1));
        });

        // This return is mostly for testing, not directly used in production runtime
        return { app, server, io };

    } catch (error) {
        logger.error(`Server initialization error: ${error.message}`);
        // Exit process if DB connection or server startup fails
        process.exit(1);
    }
};

// Start the server if this file is executed directly (e.g., by 'npm start')
if (require.main === module) {
    init();
}

// Export the app (for potential testing frameworks or if ever used as a serverless function again,
// though this setup is for a persistent server)
module.exports = app;