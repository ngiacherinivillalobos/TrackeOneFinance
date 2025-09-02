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
  Autocomplete,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  IconButton,
  Checkbox,
  FormControlLabel,
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
  FilterList as FilterIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  TrendingDown as ExpenseIcon,
  ShowChart as InvestmentIcon,
  ShowChart,
} from '@mui/icons-material';
import { ModernHeader, ModernStatsCard, ModernSection, ModernCard } from '../components/modern/ModernComponents';
import { colors, gradients } from '../theme/modernTheme';
import api from '../services/api';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { savingsGoalService, SavingsGoal } from '../services/savingsGoalService';

interface WeeklyBalance {
  startDate: string;
  endDate: string;
  balance: number;
  spent: number;
  remaining: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
  is_paid: boolean;
  cost_center_id?: number;
  cost_center?: {
    id: number;
    name: string;
    number?: string;
  };
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  // Responsividade
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados para filtros
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [dateFilterType, setDateFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para dados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para exibição
  const [weeklyBalances, setWeeklyBalances] = useState<WeeklyBalance[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);

  // Carregar centros de custo
  useEffect(() => {
    const loadCostCenters = async () => {
      try {
        const response = await api.get('/cost-centers');
        setCostCenters(response.data);
        
        // Se o usuário tiver um centro de custo associado, selecioná-lo automaticamente
        if (user?.cost_center_id) {
          const userCostCenter = response.data.find((cc: CostCenter) => cc.id === user.cost_center_id);
          if (userCostCenter) {
            setSelectedCostCenter(userCostCenter);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar centros de custo:', error);
      }
    };
    
    const loadSavingsGoal = async () => {
      try {
        const goal = await savingsGoalService.get();
        setSavingsGoal(goal);
      } catch (error) {
        console.error('Erro ao carregar meta de economia:', error);
      }
    };
    
    loadCostCenters();
    loadSavingsGoal();
  }, [user]);
  
  // Carregar transações com base nos filtros
  useEffect(() => {
    loadTransactions();
  }, [currentDate, selectedCostCenter, dateFilterType]);
  
  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Calcular início e fim do período com base no tipo de filtro
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (dateFilterType === 'month') {
        startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
        endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      } else if (dateFilterType === 'year') {
        startDate = format(new Date(currentDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(currentDate.getFullYear(), 11, 31), 'yyyy-MM-dd');
      } else if (dateFilterType === 'all') {
        // Para "Todo o período", não aplicar filtros de data
        startDate = undefined;
        endDate = undefined;
      }
      
      // Parâmetros para a requisição
      const params: any = {
      };
      
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      
      // Adicionar filtro de centro de custo se selecionado
      // Se não houver centro de custo selecionado, mas o usuário tem um associado, usar o do usuário
      if (selectedCostCenter) {
        params.cost_center_id = selectedCostCenter.id;
      } else if (user?.cost_center_id) {
        // Se o usuário tem um centro de custo associado, usar o dele por padrão
        params.cost_center_id = user.cost_center_id;
      } else {
        // Se não houver filtro específico e nem usuário com centro de custo, mostrar todos
        params.cost_center_id = 'all';
      }
      
      console.log('Carregando transações com params:', params);
      const response = await api.get('/transactions', { params });
      console.log('Resposta da API para transações:', response.data);
      
      // Mapear os dados para incluir informações do centro de custo
      const mappedTransactions = response.data.map((transaction: any) => ({
        ...transaction,
        cost_center: transaction.cost_center_name ? {
          id: transaction.cost_center_id,
          name: transaction.cost_center_name,
          number: transaction.cost_center_number
        } : null
      }));
      
      console.log('Transações mapeadas:', mappedTransactions);
      setTransactions(mappedTransactions);
      
      // Calcular dados para o dashboard após carregar as transações
      calculateDashboardData(mappedTransactions, params);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateDashboardData = (transactionsData: Transaction[], currentParams: any) => {
    console.log('Calculando dashboard data com transactions:', transactionsData);
    console.log('Current params:', currentParams);
    
    // Calcular totais por tipo de transação para o período filtrado (considerando apenas a data, não o status)
    const totalReceitas = transactionsData
      .filter(t => t.transaction_type === 'Receita')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const totalDespesas = transactionsData
      .filter(t => t.transaction_type === 'Despesa')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const totalInvestimentos = transactionsData
      .filter(t => t.transaction_type === 'Investimento')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
    
    // Calcular saldo atual (Receitas - Despesas - Investimentos)
    const saldoAtual = totalReceitas - totalDespesas - totalInvestimentos;
    
    // Calcular "A Receber" e "Recebido" com base em transações de receita
    const receitasPagas = transactionsData
      .filter(t => t.transaction_type === 'Receita' && t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const receitasNaoPagas = transactionsData
      .filter(t => t.transaction_type === 'Receita' && !t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
    
    // Calcular "A Pagar" e "Pago" com base em transações de despesa e investimento
    const despesasPagas = transactionsData
      .filter(t => t.transaction_type === 'Despesa' && t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const despesasNaoPagas = transactionsData
      .filter(t => t.transaction_type === 'Despesa' && !t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const investimentosPagos = transactionsData
      .filter(t => t.transaction_type === 'Investimento' && t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
    const investimentosNaoPagos = transactionsData
      .filter(t => t.transaction_type === 'Investimento' && !t.is_paid)
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
    
    const totalPago = despesasPagas + investimentosPagos;
    const totalAPagar = despesasNaoPagas + investimentosNaoPagos;
    
    console.log('Investimentos pagos no período filtrado:', investimentosPagos);
    
    // Calcular total de investimentos de todos os períodos (sem filtro de data) que estão pagos
    loadTotalInvestmentsPaid(currentParams.cost_center_id);
    
    // Atualizar estado com os novos valores
    setMonthSummary({
      income: totalReceitas,
      expenses: totalDespesas,
      savings: totalInvestimentos, // Agora mostra todos os investimentos do período, independentemente do status
      expectedBalance: saldoAtual,
      received: receitasPagas,
      paid: totalPago,
      toPay: totalAPagar,
      toReceive: receitasNaoPagas
    });
    
    // Calcular dados para o gráfico semanal
    calculateWeeklyBalances(transactionsData);
  };
  
  // Função para carregar o total de investimentos pagos de todos os períodos
  const loadTotalInvestmentsPaid = async (costCenterId: number | string | null) => {
    try {
      const params: any = {
        transaction_type: 'Investimento',
        is_paid: true // Apenas investimentos pagos
      };
      
      // Adicionar filtro de centro de custo se selecionado
      // Só adiciona o filtro se não for 'all' (que significa todos os centros de custo)
      if (costCenterId && costCenterId !== 'all') {
        params.cost_center_id = costCenterId;
      }
      
      console.log('Carregando investimentos pagos com params:', params);
      const response = await api.get('/transactions', { params });
      console.log('Resposta da API para investimentos pagos:', response.data);
      
      const totalInvestimentosPagos = response.data
        .reduce((sum: number, t: any) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);
      
      console.log('Total investimentos pagos calculado:', totalInvestimentosPagos);
      // Atualizar o estado com o total de investimentos pagos
      setTotalInvestmentsPaid(totalInvestimentosPagos);
    } catch (error) {
      console.error('Erro ao carregar total de investimentos pagos:', error);
    }
  };
  
  const calculateWeeklyBalances = (transactionsData: Transaction[]) => {
    // Criar semanas do mês
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para começar na segunda-feira da semana que contém o primeiro dia do mês
    const firstDayOfWeek = firstDay.getDay(); // 0 = domingo, 1 = segunda, etc.
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)); // Ajustar para segunda-feira
    
    const weeklyData: WeeklyBalance[] = [];
    
    // Criar dados para cada semana
    for (let week = 0; week < 5; week++) { // Máximo de 5 semanas
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Garantir que não ultrapasse o último dia do mês
      if (weekStart > lastDay) break;
      
      // Calcular saldo inicial (acumulado até a semana anterior)
      let balance = 0;
      if (week === 0) {
        // Para a primeira semana, usar saldo acumulado até o mês anterior
        balance = 0; // Simplificação para este exemplo
      } else {
        // Calcular saldo acumulado até esta semana
        const previousWeekTransactions = transactionsData.filter(t => {
          const transactionDate = parseISO(t.transaction_date);
          return transactionDate < weekStart;
        });
        
        const previousIncome = previousWeekTransactions
          .filter(t => t.transaction_type === 'Receita')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const previousExpenses = previousWeekTransactions
          .filter(t => t.transaction_type === 'Despesa')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const previousInvestments = previousWeekTransactions
          .filter(t => t.transaction_type === 'Investimento')
          .reduce((sum, t) => sum + t.amount, 0);
          
        balance = previousIncome - previousExpenses - previousInvestments;
      }
      
      // Filtrar transações desta semana
      const weekTransactions = transactionsData.filter(t => {
        const transactionDate = parseISO(t.transaction_date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
      
      // Calcular gastos da semana (despesas + investimentos)
      const spent = weekTransactions
        .filter(t => t.transaction_type === 'Despesa' || t.transaction_type === 'Investimento')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular saldo restante
      const remaining = balance - spent;
      
      weeklyData.push({
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        balance,
        spent,
        remaining
      });
    }
    
    setWeeklyBalances(weeklyData);
  };
  
  const [monthSummary, setMonthSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    expectedBalance: 0,
    received: 0,
    paid: 0,
    toPay: 0,
    toReceive: 0,
  });
  
  const [totalInvestmentsPaid, setTotalInvestmentsPaid] = useState(0);

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
  
  // Funções para navegação entre meses
  const handlePreviousPeriod = () => {
    if (dateFilterType === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (dateFilterType === 'year') {
      setCurrentDate(prev => subMonths(prev, 12));
    }
  };
  
  const handleNextPeriod = () => {
    if (dateFilterType === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (dateFilterType === 'year') {
      setCurrentDate(prev => addMonths(prev, 12));
    }
  };
  
  const handleClearFilters = () => {
    setSelectedCostCenter(null);
    setDateFilterType('month');
    // Remover showAllCenters pois não estamos mais usando esse estado
  };
  
  // Formatar o nome do período
  const formatPeriod = (date: Date) => {
    if (dateFilterType === 'month') {
      return format(date, 'MMMM yyyy', { locale: ptBR });
    } else if (dateFilterType === 'year') {
      return format(date, 'yyyy', { locale: ptBR });
    }
    return '';
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

      {/* Filtros - Estilo igual ao Controle Mensal */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        mb: 3,
        border: `1px solid ${colors.gray[200]}`,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        transition: 'all 0.3s ease'
      }}>
        {/* Main Filters Row */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 1.5, md: 2 },
          alignItems: 'center',
          mb: showFilters ? 2 : 0
        }}>
          {/* Period Type Selector */}
          <FormControl size="small" sx={{ minWidth: 120, flex: '0 0 auto' }}>
            <InputLabel sx={{ fontSize: '0.875rem' }}>Período</InputLabel>
            <Select
              value={dateFilterType}
              label="Período"
              onChange={(e) => setDateFilterType(e.target.value as 'month' | 'year' | 'custom' | 'all')}
              sx={{ 
                bgcolor: '#FFFFFF',
                borderRadius: 1.5,
                fontSize: '0.875rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[300],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                  borderWidth: 1
                }
              }}
            >
              <MenuItem value="month">Mês</MenuItem>
              <MenuItem value="year">Ano</MenuItem>
              <MenuItem value="all">Todo o período</MenuItem>
            </Select>
          </FormControl>

          {/* Period Navigation */}
          {(dateFilterType === 'month' || dateFilterType === 'year') && (
            <>
              <IconButton onClick={handlePreviousPeriod} size="small">
                <ChevronLeftIcon />
              </IconButton>
              
              <Typography variant="h6" sx={{ minWidth: 120, textAlign: 'center' }}>
                {formatPeriod(currentDate)}
              </Typography>
              
              <IconButton onClick={handleNextPeriod} size="small">
                <ChevronRightIcon />
              </IconButton>
            </>
          )}

          {/* Cost Center Filter */}
          <Autocomplete
            options={costCenters}
            getOptionLabel={(option) => `${option.name}${option.number ? ` (${option.number})` : ''}`}
            value={selectedCostCenter}
            onChange={(event, newValue) => {
              setSelectedCostCenter(newValue);
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Centro de Custo" 
                size="small"
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[300]
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                      borderWidth: 1
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            )}
            sx={{ flex: 1, maxWidth: 300 }}
          />
          
          <IconButton 
            onClick={handleClearFilters}
            size="small"
            sx={{ 
              bgcolor: colors.gray[200],
              '&:hover': { bgcolor: colors.gray[300] }
            }}
          >
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

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
            trend={{ value: 0, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Despesas do Mês"
            value={formatCurrency(monthSummary.expenses)}
            subtitle="Total de gastos"
            icon={<TrendingDown sx={{ fontSize: 28 }} />}
            color="error"
            trend={{ value: 0, isPositive: false }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Investimentos"
            value={formatCurrency(monthSummary.savings)}
            subtitle="Total investido"
            icon={<InvestmentIcon sx={{ fontSize: 28, color: colors.primary[600] }} />}
            color="warning"
            trend={{ value: 0, isPositive: true }}
            iconBgColor="#E6F2FC"
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Previsto"
            value={formatCurrency(monthSummary.expectedBalance)}
            subtitle="Disponível"
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="primary"
            trend={{ value: 0, isPositive: true }}
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
                    value={monthSummary.income > 0 ? (monthSummary.received / monthSummary.income) * 100 : 0}
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
                    value={monthSummary.expenses > 0 ? (monthSummary.paid / monthSummary.expenses) * 100 : 0}
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

        {/* Meta de Economia - Alterada para ModernSection com gradiente azul */}
        <Box>
          <ModernSection
            title="Meta de Economia"
            subtitle={savingsGoal ? `Prazo: ${format(parseISO(savingsGoal.target_date), 'dd/MM/yyyy', { locale: ptBR })}` : "Progresso até o final do mês"}
            icon={<ShowChart sx={{ fontSize: 24 }} />}
            headerGradient
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Meta: {savingsGoal ? formatCurrency(savingsGoal.target_amount) : 'R$ 8.000,00'}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {savingsGoal && savingsGoal.target_amount > 0 ? 
                    ((monthSummary.savings / savingsGoal.target_amount) * 100).toFixed(1) : '0.0'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={savingsGoal && savingsGoal.target_amount > 0 ? 
                  Math.min((totalInvestmentsPaid / savingsGoal.target_amount) * 100, 100) : 0}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary[100],
                  '& .MuiLinearProgress-bar': {
                    background: gradients.primary,
                    borderRadius: 6,
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={700} color={colors.primary[700]}>
                  {formatCurrency(totalInvestmentsPaid)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Economizado até agora
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight={600}>
                  {savingsGoal ? 
                    formatCurrency(Math.max(0, savingsGoal.target_amount - totalInvestmentsPaid)) : 
                    formatCurrency(Math.max(0, 8000 - totalInvestmentsPaid))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Restante para meta
                </Typography>
              </Box>
            </Box>
          </ModernSection>
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
                    const spentPercentage = week.balance > 0 ? (week.spent / week.balance) * 100 : 0;
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
                              {format(parseISO(week.startDate), 'dd/MM')} - {format(parseISO(week.endDate), 'dd/MM')}
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