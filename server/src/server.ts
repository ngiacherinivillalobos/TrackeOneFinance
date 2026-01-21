import express from 'express';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { initializeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import router from './routes/index';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method !== 'GET') {
    console.log('Request body:', req.body);
  }
  next();
});

// Health check endpoints - MUST be before api router to avoid auth middleware
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok' });
});

app.get('/api/health', (req: Request, res: Response) => {
  console.log('API health check endpoint called');
  res.json({ status: 'ok' });
});

// Add API routes
app.use('/api', router);

const PORT = process.env.PORT || 3001;

// Initialize database and start server
const start = async () => {
  try {
    await initializeDatabase();
    await runMigrations();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Categories API available at http://localhost:${PORT}/api/categories`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();