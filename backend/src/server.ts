import dotenv from 'dotenv';
// Load environment variables immediately before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import mediaRoutes from './routes/media.routes';
import messageRoutes from './routes/message.routes';
import uploadRoutes from './routes/upload.routes';
import serviceRoutes from './routes/service.routes';
import testimonialRoutes from './routes/testimonial.routes';
import settingsRoutes from './routes/settings.routes';
import journalRoutes from './routes/journal.routes';
import aboutRoutes from './routes/about.routes';

// Import email verification
import { verifyEmailConfig } from './services/email.service';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy hop (Nginx reverse proxy)
// This is critical for express-rate-limit and HTTPS secure cookies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for file uploads
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  'https://yzbconstruction.com',
  'https://www.yzbconstruction.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Fail-safe: during development, allow origin to prevent CORS issues
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookie'],
  optionsSuccessStatus: 200,
}));

// Preflight options handling
app.options('*', cors() as any);

// Body parsing middleware (support large JSON and media payloads up to 2GB)
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: true, limit: '2gb' }));
app.use(cookieParser());

// Serve uploaded files statically
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/about', aboutRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify SMTP connection in background
  verifyEmailConfig().catch((err) => {
    console.error('SMTP verification error:', err);
  });
});

// Configure Node.js HTTP Server timeouts for large video & media uploads (0 disables timeout entirely)
server.timeout = 0; // Disable socket inactivity timeout
server.requestTimeout = 0; // Disable request reading timeout (prevents 408 Request Timeout)
server.keepAliveTimeout = 3600000; // 1 hour keepalive
server.headersTimeout = 3601000; // 1 hour + 1 second (must be higher than keepAliveTimeout)

export default app;
