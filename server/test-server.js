const express = require('express');
const app = express();

app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test server is working!', timestamp: new Date().toISOString() });
});

// Simple transactions route
app.get('/api/transactions', (req, res) => {
  res.json([
    {
      id: 1,
      description: 'Test transaction',
      amount: 100,
      type: 'expense',
      created_at: new Date().toISOString()
    }
  ]);
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
