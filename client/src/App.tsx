import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import modernTheme from './theme/modernTheme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MonthlyControl from './pages/MonthlyControl';
import CashFlow from './pages/CashFlow';
import CreditCard from './pages/CreditCard';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/monthly-control" element={<MonthlyControl />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/credit-card" element={<CreditCard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
