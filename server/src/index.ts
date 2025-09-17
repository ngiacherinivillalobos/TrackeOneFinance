import express from 'express';
import cors from 'cors';
import router from './routes/index';

const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'TrackeOne Finance API is running', version: '1.0.0' });
});

// API Routes with prefix
app.use('/api', router);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
