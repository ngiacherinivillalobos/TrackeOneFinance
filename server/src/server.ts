import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import mainRouter from './routes';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// Configuração extremamente permissiva do CORS para ambiente de desenvolvimento
app.use(cors({
  origin: function(origin, callback) {
    // Permitir qualquer origem
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin']
}));

// Middleware adicional para garantir que o CORS funcione
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responde imediatamente às solicitações OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));

// Middleware de log para debug
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Rota de teste
app.get('/api/test', (req: Request, res: Response) => {
  console.log('📋 Rota de teste chamada');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check endpoint para Docker
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// Monta o roteador principal
app.use('/api', mainRouter);

// Middleware para lidar com rotas não encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
const start = async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Run migrations
    await runMigrations();
    console.log('Migrations applied successfully');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();