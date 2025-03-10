import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Import routes
import openRouterRoutes from './routes/openrouter.js';
import langchainRoutes from './routes/langchain.js';
import benchmarkRoutes from './routes/benchmark.js';
import configRoutes from './routes/config.js';
import resultRoutes from './routes/result.js';
import evaluationRoutes from './routes/evaluation.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(helmet()); // Security headers
// Configure CORS to be more flexible for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://benchmarkllm.onrender.com',
      'https://benchmarkllm-1.onrender.com',
    ].filter(Boolean); // Remove any undefined/null values
   
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true // Allow cookies if needed
};

app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON request body
app.use(morgan('dev')); // Request logging

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', apiLimiter);

// Define routes
app.use('/api/openrouter', openRouterRoutes);
app.use('/api/langchain', langchainRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/evaluation', evaluationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;