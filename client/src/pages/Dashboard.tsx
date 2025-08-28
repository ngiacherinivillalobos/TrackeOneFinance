import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CreditCard,
  AttachMoney,
  Timeline,
  CalendarToday,
  Assessment,
} from '@mui/icons-material';
import { ModernHeader, ModernStatsCard, ModernSection, ModernCard } from '../components/modern/ModernComponents';
import { colors, gradients } from '../theme/modernTheme';

interface WeeklyBalance {
  startDate: string;
  endDate: string;
  balance: number;
  spent: number;
  remaining: number;
}

interface MonthSummary {
  income: number;
  expenses: number;
  savings: number;
  expectedBalance: number;
  received: number;
  paid: number;
  toPay: number;
  toReceive: number;
}

export default function Dashboard() {
  const [weeklyBalances, setWeeklyBalances] = useState<WeeklyBalance[]>([]);
  const [monthSummary, setMonthSummary] = useState<MonthSummary>({
    income: 15250.00,
    expenses: 8430.50,
    savings: 6819.50,
    expectedBalance: 6819.50,
    received: 12100.00,
    paid: 7850.25,
    toPay: 2580.25,
    toReceive: 3150.00,
  });

  useEffect(() => {
    // Dados de exemplo mais realistas
    setWeeklyBalances([
      {
        startDate: '2025-08-01',
        endDate: '2025-08-07',
        balance: 15000,
        spent: 1850.75,
        remaining: 13149.25,
      },
      {
        startDate: '2025-08-08',
        endDate: '2025-08-14',
        balance: 13149.25,
        spent: 2240.30,
        remaining: 10908.95,
      },
      {
        startDate: '2025-08-15',
        endDate: '2025-08-21',
        balance: 10908.95,
        spent: 1890.45,
        remaining: 9018.50,
      },
      {
        startDate: '2025-08-22',
        endDate: '2025-08-28',
        balance: 9018.50,
        spent: 2449.00,
        remaining: 6569.50,
      },
    ]);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage <= 50) return colors.success[500];
    if (percentage <= 80) return colors.warning[500];
    return colors.error[500];
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <ModernHeader
        title="Dashboard Financeiro"
        subtitle="Visão geral das suas finanças pessoais"
        breadcrumbs={[
          { label: 'TrackeOne Finance' },
          { label: 'Dashboard' }
        ]}
      />

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3,
        mb: 3
      }}>
        {/* Cards de Estatísticas */}
        <Box>
          <ModernStatsCard
            title="Receitas do Mês"
            value={formatCurrency(monthSummary.income)}
            subtitle="Total de entradas"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            color="success"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Despesas do Mês"
            value={formatCurrency(monthSummary.expenses)}
            subtitle="Total de gastos"
            icon={<TrendingDown sx={{ fontSize: 28 }} />}
            color="error"
            trend={{ value: 5.2, isPositive: false }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Atual"
            value={formatCurrency(monthSummary.expectedBalance)}
            subtitle="Disponível"
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="primary"
            trend={{ value: 8.3, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Economias"
            value={formatCurrency(monthSummary.savings)}
            subtitle="Meta: R$ 8.000"
            icon={<AttachMoney sx={{ fontSize: 28 }} />}
            color="warning"
            trend={{ value: 15.7, isPositive: true }}
          />
        </Box>
      </Box>

      {/* Main content sections */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'repeat(2, 1fr)'
        },
        gap: 3,
        mb: 3
      }}>
        {/* Seção de Resumo Mensal */}
        <Box>
          <ModernSection
            title="Resumo Mensal"
            subtitle="Controle financeiro detalhado"
            icon={<Assessment sx={{ fontSize: 24 }} />}
            headerGradient
          >
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 3
            }}>
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Recebido
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(monthSummary.received)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(monthSummary.received / monthSummary.income) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.success[100],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: colors.success[500],
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Pago
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(monthSummary.paid)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(monthSummary.paid / monthSummary.expenses) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.error[100],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(monthSummary.paid, monthSummary.expenses),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    A Receber
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(monthSummary.toReceive)}
                    </Typography>
                    <Chip
                      label="Pendente"
                      size="small"
                      sx={{
                        bgcolor: colors.warning[100],
                        color: colors.warning[700],
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    A Pagar
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(monthSummary.toPay)}
                    </Typography>
                    <Chip
                      label="Vencendo"
                      size="small"
                      sx={{
                        bgcolor: colors.error[100],
                        color: colors.error[700],
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </ModernSection>
        </Box>

        {/* Meta de Economia */}
        <Box>
          <ModernCard
            title="Meta de Economia"
            subtitle="Progresso até o final do mês"
            icon={<Timeline sx={{ fontSize: 24 }} />}
            gradient="success"
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Meta: R$ 8.000,00
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {((monthSummary.savings / 8000) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(monthSummary.savings / 8000) * 100}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.success[100],
                  '& .MuiLinearProgress-bar': {
                    background: gradients.success,
                    borderRadius: 6,
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={700} color={colors.success[700]}>
                  {formatCurrency(monthSummary.savings)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Economizado até agora
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight={600}>
                  {formatCurrency(8000 - monthSummary.savings)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Restante para meta
                </Typography>
              </Box>
            </Box>
          </ModernCard>
        </Box>
      </Box>

      {/* Weekly Balance Table */}
      <Box>
          <ModernSection
            title="Controle Semanal"
            subtitle="Acompanhamento detalhado por semana"
            icon={<CalendarToday sx={{ fontSize: 24 }} />}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo Inicial</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Gasto na Semana</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo Final</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weeklyBalances.map((week, index) => {
                    const spentPercentage = (week.spent / week.balance) * 100;
                    const isHighSpending = spentPercentage > 20;
                    
                    return (
                      <TableRow 
                        key={week.startDate}
                        sx={{
                          '&:hover': {
                            backgroundColor: colors.primary[50],
                          },
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {new Date(week.startDate).toLocaleDateString('pt-BR')} - {new Date(week.endDate).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Semana {index + 1}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(week.balance)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={isHighSpending ? colors.error[600] : 'inherit'}
                          >
                            {formatCurrency(week.spent)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(week.remaining)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={isHighSpending ? 'Alto Gasto' : 'Controlado'}
                            size="small"
                            sx={{
                              bgcolor: isHighSpending ? colors.error[100] : colors.success[100],
                              color: isHighSpending ? colors.error[700] : colors.success[700],
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </ModernSection>
        </Box>
    </Box>
  );
}
