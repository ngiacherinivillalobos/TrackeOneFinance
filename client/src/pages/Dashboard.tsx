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
} from '@mui/icons-material';
import { ModernHeader, ModernStatsCard, ModernSection, ModernCard } from '../components/modern/ModernComponents';
import { colors, gradients } from '../theme/modernTheme';
import api from '../lib/axios';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { savingsGoalService, SavingsGoal } from '../services/savingsGoalService';
import { createSafeDate, formatToBrazilianDate } from '../utils/dateUtils';

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
  type: 'expense' | 'income' | 'investment';
  transaction_type?: 'Despesa' | 'Receita' | 'Investimento'; // Campo mapeado/transformado
  is_paid: boolean;
  payment_status_id?: number;
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
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashFlowRecords, setCashFlowRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
      }
      // Se não houver filtro específico e nem usuário com centro de custo, não enviar o parâmetro
      // para que o backend retorne todos os centros de custo
      
      console.log('Carregando transações com params:', params);
      
      // Sempre buscar todas as transações vencidas, independentemente da data
      let overdueTransactions: any[] = [];
      
      try {
        console.log('Buscando transações vencidas...');
        const overdueParams: any = {
          dateFilterType: 'all', // Sempre buscar todas as datas
          payment_status_id: 'overdue', // Status "Vencido" - usar string como no Controle Mensal
        };
        
        // Adicionar filtro de centro de custo se houver
        if (params.cost_center_id) {
          overdueParams.cost_center_id = params.cost_center_id;
        }
        
        const overdueResponse = await api.get(`/transactions/filtered?${new URLSearchParams(overdueParams)}`);
        console.log('Transações vencidas encontradas:', overdueResponse.data);
        
        if (overdueResponse.data && Array.isArray(overdueResponse.data)) {
          // Para "Todo o período", incluir todas as transações vencidas
          // Para períodos específicos, filtrar transações vencidas por data
          if (startDate && endDate) {
            // Se estivermos filtrando por período específico, filtrar transações vencidas por data
            // Mas manter todas as transações vencidas (não filtrar por data)
            overdueTransactions = overdueResponse.data.filter((t: any) => 
              t.payment_status_id === 374 // Apenas transações vencidas (ID correto é 374)
            );
          } else {
            // Para "Todo o período", incluir todas as transações vencidas
            overdueTransactions = overdueResponse.data.filter((t: any) => 
              t.payment_status_id === 374 // Apenas transações vencidas (ID correto é 374)
            );
          }
          
          // Garantir que as transações vencidas não estão marcadas como pagas
          overdueTransactions = overdueTransactions.filter((t: any) => {
            // Verificar se a transação está realmente vencida (não paga)
            return t.payment_status_id === 374; // ID 374 = Vencido
          });
          
          console.log('Transações vencidas filtradas:', overdueTransactions);
        }
      } catch (error) {
        console.error('Erro ao buscar transações vencidas:', error);
      }
      
      // Buscar transações do período selecionado
      let periodTransactions: any[] = [];
      
      try {
        // Se não estivermos filtrando apenas por vencidos, buscar também as transações do período
        const periodParams: any = {
          dateFilterType,
          ...Object.fromEntries(Object.entries(params).filter(([key, value]) => {
            return value !== undefined && value !== '';
          }))
        };
        
        // Adicionar parâmetros específicos de data
        if (dateFilterType === 'month') {
          periodParams.month = currentDate.getMonth();
          periodParams.year = currentDate.getFullYear();
        } else if (dateFilterType === 'year') {
          periodParams.year = currentDate.getFullYear();
        } else if (dateFilterType === 'custom') {
          if (startDate) periodParams.customStartDate = startDate;
          if (endDate) periodParams.customEndDate = endDate;
        }
        
        console.log("Parâmetros da requisição para transações do período:", periodParams);
        
        const periodResponse = await api.get(`/transactions/filtered?${new URLSearchParams(periodParams)}`);
        console.log("Resposta da API para transações do período:", periodResponse.data);
        
        periodTransactions = periodResponse.data;
      } catch (error) {
        console.error('Erro ao carregar transações do período:', error);
        periodTransactions = [];
      }
      
      // Combinar transações vencidas com transações do período
      // Remover duplicatas baseadas no ID
      const allTransactionsMap = new Map();
      
      // Adicionar transações vencidas
      overdueTransactions.forEach((t: any) => {
        allTransactionsMap.set(t.id, t);
      });
      
      // Adicionar transações do período
      periodTransactions.forEach((t: any) => {
        allTransactionsMap.set(t.id, t);
      });
      
      const combinedTransactions = Array.from(allTransactionsMap.values());
      
      // Mapear os dados para incluir informações do centro de custo e tipo correto
      const mappedTransactions = combinedTransactions.map((transaction: any) => {
        // Mapear transaction_type (português) para type (inglês)
        let type: 'expense' | 'income' | 'investment' = 'expense';
        if (transaction.transaction_type === 'Receita') type = 'income';
        else if (transaction.transaction_type === 'Investimento') type = 'investment';
        else if (transaction.transaction_type === 'Despesa') type = 'expense';
        
        return {
          ...transaction,
          type, // Adicionar o campo type correto
          cost_center: transaction.cost_center_name ? {
            id: transaction.cost_center_id,
            name: transaction.cost_center_name,
            number: transaction.cost_center_number
          } : null,
          // Converter o campo is_paid baseado no payment_status_id
          is_paid: transaction.payment_status_id === 2
        };
      });
      
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

  // Carregar dados das contas bancárias
  const loadBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts/balances');
      setBankAccounts(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  // Carregar dados do fluxo de caixa
  const loadCashFlow = async () => {
    try {
      const response = await api.get('/cash-flow');
      setCashFlowRecords(response.data);
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    }
  };

  // Adicionar ao useEffect para carregar todos os dados
  useEffect(() => {
    loadTransactions();
    loadBankAccounts();
    loadCashFlow();
  }, [currentDate, selectedCostCenter, dateFilterType, refreshTrigger]);

  // Auto-refresh a cada 30 segundos para capturar mudanças (como estornos)
  useEffect(() => {
    const interval = setInterval(() => {
      // Só atualiza se a página estiver visível
      if (document.visibilityState === 'visible') {
        setRefreshTrigger(prev => prev + 1);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []); // Array de dependências vazio para evitar looping

  const calculateDashboardData = (transactionsData: Transaction[], currentParams: any) => {
    console.log('Calculando dashboard data com transactions:', transactionsData);
    console.log('Current params:', currentParams);
    
    // Função auxiliar para converter valores para número
    const getSafeAmount = (amount: any): number => {
      if (typeof amount === 'number') return amount;
      if (typeof amount === 'string') {
        const parsed = parseFloat(amount);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    // Calcular totais por tipo de transação para o período filtrado (TODAS as transações, independente do status)
    const totalReceitas = transactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const totalDespesas = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const totalInvestimentos = transactionsData
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    // Calcular saldo previsto (Receitas - Despesas - Investimentos)
    const saldoPrevisto = totalReceitas - totalDespesas - totalInvestimentos;
    
    // Calcular saldo previsto do próximo mês
    // Vamos calcular com base no mês seguinte ao período atual
    let saldoPrevistoProximoMes = 0;
    
    // Se estivermos filtrando por mês, calcular o próximo mês
    if (dateFilterType === 'month') {
      // Para calcular corretamente o próximo mês, precisamos buscar as transações do próximo mês
      // Por enquanto, vamos manter o cálculo atual como placeholder
      saldoPrevistoProximoMes = totalReceitas - totalDespesas - totalInvestimentos;
    }
    
    // Se estivermos filtrando por ano, usar o mesmo cálculo
    if (dateFilterType === 'year') {
      saldoPrevistoProximoMes = totalReceitas - totalDespesas - totalInvestimentos;
    }
    
    // Se estivermos filtrando por "Todo o período", usar o mesmo cálculo
    if (dateFilterType === 'all') {
      saldoPrevistoProximoMes = totalReceitas - totalDespesas - totalInvestimentos;
    }
    
    // Calcular saldo atual real considerando:
    // 1. Saldo Inicial das contas bancárias
    // 2. + Receitas com status "Pago"
    // 3. - Despesas com status "Pago"
    // 4. - Investimentos com status "Pago"
    // 5. +/- Transações do fluxo de caixa (TODAS)

    // 1. Saldo inicial das contas bancárias
    const saldoInicialBancos = bankAccounts.reduce((sum, account) => 
      sum + getSafeAmount(account.initial_balance), 0);

    // 2. Receitas pagas do controle mensal
    const receitasPagasControle = transactionsData
      .filter(t => t.type === 'income' && t.payment_status_id === 2)
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

    // 3. Despesas pagas do controle mensal
    const despesasPagasControle = transactionsData
      .filter(t => t.type === 'expense' && t.payment_status_id === 2)
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

    // 4. Investimentos pagos do controle mensal
    const investimentosPagosControle = transactionsData
      .filter(t => t.type === 'investment' && t.payment_status_id === 2)
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);

    // 5. Total do fluxo de caixa - TODAS as transações (subtrair despesas, somar receitas)
    const totalFluxoCaixa = cashFlowRecords.reduce((sum, record) => {
      const amount = getSafeAmount(record.amount);
      if (record.record_type === 'Despesa') {
        return sum - amount;
      } else if (record.record_type === 'Receita') {
        return sum + amount;
      }
      return sum;
    }, 0);

    // Saldo atual real = Saldo Inicial + Receitas Pagas - Despesas Pagas - Investimentos Pagos + Fluxo de Caixa
    const saldoAtualReal = saldoInicialBancos + receitasPagasControle - despesasPagasControle - investimentosPagosControle + totalFluxoCaixa;
    
    // Calcular "A Receber" e "Recebido" com base em transações de receita
    const receitasPagas = transactionsData
      .filter(t => t.type === 'income' && t.payment_status_id === 2)
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const receitasNaoPagas = transactionsData
      .filter(t => t.type === 'income' && (t.payment_status_id === 1 || t.payment_status_id === 374))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    // Calcular "A Pagar" e "Pago" com base em transações de despesa apenas (não incluir investimentos)
    const despesasPagas = transactionsData
      .filter(t => t.type === 'expense' && t.payment_status_id === 2)
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const despesasNaoPagas = transactionsData
      .filter(t => t.type === 'expense' && (t.payment_status_id === 1 || t.payment_status_id === 374))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    const totalPago = despesasPagas; // Apenas despesas pagas
    const totalAPagar = despesasNaoPagas; // Despesas não pagas (em aberto + vencidas)
    
    console.log('=== Cálculo dos totalizadores ===');
    console.log('Total de receitas:', totalReceitas);
    console.log('Total de despesas:', totalDespesas);
    console.log('Total de investimentos:', totalInvestimentos);
    console.log('Receitas pagas:', receitasPagas);
    console.log('Receitas não pagas:', receitasNaoPagas);
    console.log('Despesas pagas:', despesasPagas);
    console.log('Despesas não pagas:', despesasNaoPagas);
    console.log('Total pago:', totalPago);
    console.log('=== DEBUG SALDO ATUAL ===');
    console.log('Todas as transações:', transactionsData.length);
    console.log('Total receitas (TODAS):', totalReceitas);
    console.log('Total despesas (TODAS):', totalDespesas);
    console.log('Total investimentos (TODAS):', totalInvestimentos);
    console.log('Saldo previsto (todas as transações):', saldoPrevisto);
    console.log('Saldo previsto próximo mês:', saldoPrevistoProximoMes);
    console.log('=== Cálculo Saldo Atual Real ===');
    console.log('Saldo inicial bancos:', saldoInicialBancos);
    console.log('Receitas pagas (controle):', receitasPagasControle);
    console.log('Despesas pagas (controle):', despesasPagasControle);
    console.log('Investimentos pagos (controle):', investimentosPagosControle);
    console.log('Total fluxo de caixa:', totalFluxoCaixa);
    console.log('Saldo atual real (final):', saldoAtualReal);
    console.log('==============================');
    
    // Calcular total de investimentos de todos os períodos (sem filtro de data) que estão pagos
    loadTotalInvestmentsPaid(currentParams.cost_center_id);
    
    // Atualizar estado com os novos valores
    const newMonthSummary = {
      income: totalReceitas,
      expenses: totalDespesas,
      savings: totalInvestimentos, // Agora mostra todos os investimentos do período, independentemente do status
      expectedBalance: saldoPrevisto,
      expectedBalanceNextMonth: saldoPrevistoProximoMes, // Novo campo para saldo previsto do próximo mês
      currentBalance: saldoAtualReal, // Novo campo para saldo atual real
      received: receitasPagas,
      paid: totalPago,
      toPay: totalAPagar,
      toReceive: receitasNaoPagas
    };
    
    console.log('Novo monthSummary:', newMonthSummary);
    setMonthSummary(newMonthSummary);
    
    // Calcular dados para o gráfico semanal
    calculateWeeklyBalances(transactionsData);
  };
  
  // Função para carregar o total de investimentos pagos de todos os períodos (Meta de Economia)
  const loadTotalInvestmentsPaid = async (costCenterId: number | string | null) => {
    try {
      // Buscar todos os investimentos pagos, independentemente do período
      const params: any = {
        transaction_type: 'Investimento',
        payment_status_id: 2 // Apenas investimentos com status "Pago"
      };
      
      // Adicionar filtro de centro de custo se selecionado
      if (costCenterId) {
        params.cost_center_id = costCenterId;
      }
      
      console.log('Carregando total de investimentos pagos com params:', params);
      const response = await api.get('/transactions/filtered', { params });
      console.log('Response investimentos pagos:', response.data);
      
      const totalInvestimentosPagos = response.data
        .reduce((sum: number, t: any) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0);
          return sum + amount;
        }, 0);
      
      console.log('Total investimentos pagos calculado:', totalInvestimentosPagos);
      setTotalInvestmentsPaid(totalInvestimentosPagos);
    } catch (error) {
      console.error('Erro ao carregar total de investimentos pagos:', error);
      setTotalInvestmentsPaid(0);
    }
  };
  
  const calculateWeeklyBalances = (transactionsData: Transaction[]) => {
    // Função auxiliar para converter valores para número
    const getSafeAmount = (amount: any): number => {
      if (typeof amount === 'number') return amount;
      if (typeof amount === 'string') {
        const parsed = parseFloat(amount);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
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
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
          
        const previousExpenses = previousWeekTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
          
        const previousInvestments = previousWeekTransactions
          .filter(t => t.type === 'investment')
          .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
          
        balance = previousIncome - previousExpenses - previousInvestments;
      }
      
      // Filtrar transações desta semana
      const weekTransactions = transactionsData.filter(t => {
        const transactionDate = parseISO(t.transaction_date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
      
      // Calcular gastos da semana (despesas + investimentos)
      const spent = weekTransactions
        .filter(t => t.type === 'expense' || t.type === 'investment')
        .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
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
    expectedBalanceNextMonth: 0, // Novo campo
    currentBalance: 0, // Novo campo
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

  // Função para forçar refresh dos dados (útil após estornos)
  const refreshDashboard = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Expor a função globalmente para uso em outros componentes
  (window as any).refreshDashboard = refreshDashboard;

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
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)'
        },
        gap: 3,
        mb: 3
      }}>
        {/* Cards de Estatísticas */}
        <Box>
          <ModernStatsCard
            title="Saldo Previsto"
            value={formatCurrency(monthSummary.expectedBalance)}
            subtitle="Baseado no período"
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="secondary"
            trend={{ value: 0, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Previsto Próximo Mês"
            value={formatCurrency(monthSummary.expectedBalanceNextMonth)}
            subtitle="Projeção do próximo mês"
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="primary"
            trend={{ value: 0, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Atual"
            value={formatCurrency(monthSummary.currentBalance)}
            subtitle="Contas + Fluxo + Transações"
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="primary"
            trend={{ value: 0, isPositive: monthSummary.currentBalance >= 0 }}
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
                        backgroundColor: '#BD362E', // Vermelho fixo para "Pago"
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
            subtitle={savingsGoal && savingsGoal.target_date ? `Prazo: ${formatToBrazilianDate(createSafeDate(savingsGoal.target_date))}` : "Progresso até o final do mês"}
            icon={<InvestmentIcon sx={{ fontSize: 24, color: '#1976d2' }} />}
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