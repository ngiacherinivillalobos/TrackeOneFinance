import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import mainRouter from './routes'; // Importa o roteador principal

const app = express();

app.use(cors({
  origin: '*', // Permite qualquer origem em ambiente de desenvolvimento/teste
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Adiciona headers para garantir que CORS funcione
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
app.use(express.json());

// Rota de teste
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Server is working!' });
});

// Rota de teste do Cash Flow diretamente
app.get('/api/cash-flow-test', (req: Request, res: Response) => {
  res.json({ message: 'Cash Flow direct route working!' });
});

// Monta o roteador principal
app.use('/api', mainRouter);

// Middleware para lidar com rotas não encontradas
app.use((req: Request, res: Response, next: NextFunction) => {
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
    // await runMigrations(); // Comentado pois as migrações agora são feitas via script
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();