import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import mainRouter from './routes'; // Importa o roteador principal

const app = express();

app.use(cors());
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

const PORT = process.env.PORT || 3001;


// Initialize database and start server
const start = async () => {
  try {
    await initializeDatabase();
    await runMigrations();
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
