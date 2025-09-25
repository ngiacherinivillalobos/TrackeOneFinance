import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import mainRouter from './routes';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// Configuração correta do CORS para ambiente de produção e desenvolvimento
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3004',
      'https://trackeone-finance.vercel.app',
      'https://ngvtech.com.br'
    ];
    
    // Em desenvolvimento, permitir qualquer origem
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Em produção, verificar se a origem está na lista de permitidas
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.ngvtech.com.br'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Middleware adicional para garantir que o CORS funcione corretamente
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3004',
    'https://trackeone-finance.vercel.app',
    'https://ngvtech.com.br'
  ];
  
  const origin = req.get('Origin');
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.ngvtech.com.br'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, permitir qualquer origem
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Responde imediatamente às solicitações OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
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
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com o banco de dados
    const { db, get } = require('./database/connection').getDatabase();
    
    // Testar conexão com uma query simples
    await get(db, 'SELECT 1 as test');
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
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

    // Modificar para escutar em todos os endereços (IPv4 e IPv6)
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
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