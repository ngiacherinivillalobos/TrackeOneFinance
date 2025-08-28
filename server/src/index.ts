import express from 'express';
import cors from 'cors';
import categoriesRoutes from './routes/categories';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use(categoriesRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
