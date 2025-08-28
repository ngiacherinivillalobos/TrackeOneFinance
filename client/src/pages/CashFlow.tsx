import { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ModernHeader } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';

interface DailyTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'despesa' | 'receita';
}

interface DailyBalance {
  date: string;
  planned: number;
  actual: number;
  remaining: number;
}

export default function CashFlow() {
  const [dailyTransactions, setDailyTransactions] = useState<DailyTransaction[]>([]);
  const [dailyBalance, setDailyBalance] = useState<DailyBalance[]>([]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
        {/* Modern Header */}
        <ModernHeader
          title="Fluxo de Caixa"
          subtitle="Controle detalhado do fluxo de entrada e saída de recursos"
          breadcrumbs={[
            { label: 'TrackeOne Finance' },
            { label: 'Fluxo de Caixa' }
          ]}
          actions={(
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                background: gradients.primary,
                borderRadius: 1.5,
                boxShadow: shadows.md,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  boxShadow: shadows.lg
                }
              }}
            >
              Nova Transação
            </Button>
          )}
        />

        {/* Daily Balance Summary */}
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: colors.gray[900] }}>
              Saldo Diário
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.gray[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Data</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.gray[700] }}>Planejado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.gray[700] }}>Realizado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.gray[700] }}>Restante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyBalance.map((day) => (
                    <TableRow key={day.date} sx={{ '&:hover': { bgcolor: colors.gray[50] } }}>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">R$ {day.planned.toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {day.actual.toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {day.remaining.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Daily Transactions */}
        <Paper sx={{ 
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${colors.gray[200]}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[900] }}>
              Transações Diárias
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.gray[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Descrição</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: colors.gray[700] }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyTransactions.map((transaction) => (
                  <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: colors.gray[50] } }}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">R$ {transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        sx={{ 
                          color: colors.primary[600],
                          '&:hover': { bgcolor: colors.primary[50] }
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
