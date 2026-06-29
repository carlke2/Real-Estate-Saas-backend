import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import propertiesRoutes from './routes/properties.js';
import inquiriesRoutes from './routes/inquiries.js';
import verificationRoutes from './routes/verification.js';
import favoritesRoutes from './routes/favorites.js';
import adminRoutes from './routes/admin.js';
import savedSearchRoutes from './routes/savedSearch.js';
import uploadRoutes from './routes/upload.js';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import PrismaService from '@prisma/client';

const { Pool } = pg;
const { PrismaClient } = PrismaService as any;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', savedSearchRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📝 API docs: http://0.0.0.0:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
