import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip
} from '@mui/material';
import { bankAccountBalanceService, BankAccountBalance } from '../services/bankAccountBalanceService';

const BankAccountsBalance: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountsWithBalances();
  }, []);

  const loadAccountsWithBalances = async () => {
    try {
      setLoading(true);
      const data = await bankAccountBalanceService.getBankAccountsWithBalances();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar saldos das contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'success';
    if (balance < 0) return 'error';
    return 'default';
  };

  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Saldos das Contas Bancárias
        </Typography>
        <Typography>Carregando...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Saldos das Contas Bancárias
        </Typography>
        <Chip 
          label={`Total: ${formatCurrency(totalBalance)}`}
          color={getBalanceColor(totalBalance)}
          variant="outlined"
          size="medium"
        />
      </Box>
      
      {accounts.length === 0 ? (
        <Typography color="textSecondary">
          Nenhuma conta bancária cadastrada.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Conta</TableCell>
                <TableCell align="right">Saldo Inicial</TableCell>
                <TableCell align="right">Movimentações</TableCell>
                <TableCell align="right">Saldo Atual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {account.name}
                      </Typography>
                      {account.bank_name && (
                        <Typography variant="caption" color="textSecondary">
                          {account.bank_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(account.initial_balance)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      color={account.total_movements >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(account.total_movements)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={formatCurrency(account.current_balance)}
                      color={getBalanceColor(account.current_balance)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default BankAccountsBalance;
