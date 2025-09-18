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
  }, [currentDate, selectedCostCenter, dateFilterType, refreshTrigger]);
  
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
          payment_status: 'overdue', // Status "Vencido" - usar string como no Controle Mensal
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
              !t.is_paid // Apenas transações não pagas
            );
          } else {
            // Para "Todo o período", incluir todas as transações vencidas
            overdueTransactions = overdueResponse.data.filter((t: any) => 
              !t.is_paid // Apenas transações não pagas
            );
          }
          
          // Garantir que as transações vencidas não estão marcadas como pagas
          overdueTransactions = overdueTransactions.filter((t: any) => {
            // Verificar se a transação está realmente vencida (não paga)
            return !t.is_paid; // Apenas transações não pagas
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
          is_paid: transaction.is_paid
        };
      });
      
      console.log('Transações mapeadas:', mappedTransactions);
      setTransactions(mappedTransactions);
      
      // Calcular dados para o dashboard após carregar as transações
      await calculateDashboardData(mappedTransactions, params);
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
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
      return [];
    }
  };

  // Carregar dados do fluxo de caixa
  const loadCashFlow = async () => {
    try {
      const response = await api.get('/cash-flow');
      setCashFlowRecords(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
      return [];
    }
  };

  // Estados para transações pagas de todos os períodos
  const [allPaidIncome, setAllPaidIncome] = useState(0);
  const [allPaidExpenses, setAllPaidExpenses] = useState(0);
  const [allPaidInvestments, setAllPaidInvestments] = useState(0);
  const [totalInvestmentsPaid, setTotalInvestmentsPaid] = useState(0);
  
  // Estados para controle de carregamento
  const [dataLoading, setDataLoading] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  
  // Adicionar useEffect para monitorar mudanças no totalInvestmentsPaid
  useEffect(() => {
    console.log('totalInvestmentsPaid atualizado:', totalInvestmentsPaid);
  }, [totalInvestmentsPaid]);

  // Carregar todas as transações pagas quando os filtros mudarem
  useEffect(() => {
    const loadAllPaidTransactions = async () => {
      try {
        // Função auxiliar para converter valores para número
        const getSafeAmount = (amount: any): number => {
          if (typeof amount === 'number') return amount;
          if (typeof amount === 'string') {
            const parsed = parseFloat(amount);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        };
        
        // Parâmetros para buscar todas as transações pagas
        const params: any = {
          payment_status: 'paid', // Usar 'paid' para consistência entre ambientes
          dateFilterType: 'all' // Todas as datas
        };
        
        // Adicionar filtro de centro de custo se houver
        if (selectedCostCenter?.id || user?.cost_center_id) {
          params.cost_center_id = selectedCostCenter?.id || user?.cost_center_id;
        }
        
        console.log('Carregando todas as transações pagas com params:', params);
        
        const response = await api.get('/transactions/filtered', { params });
        console.log('Transações pagas encontradas:', response.data.length);
        
        // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
        const paidTransactions = response.data.filter((t: any) => {
          // Verificar se está pago em ambos os ambientes
          const isPaid = t.is_paid || t.payment_status_id === 2;
          return isPaid;
        });
        
        // Separar por tipo e calcular totais
        const income = paidTransactions
          .filter((t: any) => t.transaction_type === 'Receita')
          .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
          
        const expenses = paidTransactions
          .filter((t: any) => t.transaction_type === 'Despesa')
          .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
          
        const investments = paidTransactions
          .filter((t: any) => t.transaction_type === 'Investimento')
          .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
        
        console.log('Totais calculados:', { income, expenses, investments });
        
        // Atualizar os estados
        setAllPaidIncome(income);
        setAllPaidExpenses(expenses);
        setAllPaidInvestments(investments);
        
        // Não recalcular o dashboard aqui, deixar para o useEffect dedicado
      } catch (error) {
        console.error('Erro ao carregar transações pagas:', error);
      }
    };
    
    loadAllPaidTransactions();
  }, [selectedCostCenter, user?.cost_center_id, refreshTrigger]); // Removido transactions das dependências para evitar loops

  // Adicionar ao useEffect para carregar todos os dados
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      setAllDataLoaded(false);
      
      try {
        // Carregar todos os dados em paralelo
        const [bankAccountsData, cashFlowData] = await Promise.all([
          loadBankAccounts(),
          loadCashFlow()
        ]);
        
        // Carregar transações
        await loadTransactions();
        
        // Marcar que todos os dados foram carregados
        setAllDataLoaded(true);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, [currentDate, selectedCostCenter, dateFilterType, refreshTrigger]);

  // useEffect para calcular o dashboard apenas quando todos os dados estiverem carregados
  useEffect(() => {
    if (allDataLoaded && transactions.length > 0) {
      console.log('Calculando dashboard - todos os dados carregados');
      calculateDashboardData(transactions, {
        dateFilterType,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        cost_center_id: selectedCostCenter?.id || user?.cost_center_id || null
      });
    }
  }, [allDataLoaded, transactions, currentDate, selectedCostCenter, user?.cost_center_id, dateFilterType]);

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

  const calculateDashboardData = async (transactionsData: Transaction[], currentParams: any) => {
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
    let saldoPrevistoProximoMes = 0;
    
    // Se estivermos filtrando por mês, calcular com base nas transações do próximo mês
    if (dateFilterType === 'month') {
      // Carregar transações do próximo mês
      const nextMonthTransactions = await loadNextMonthTransactions(currentDate, selectedCostCenter?.id || user?.cost_center_id || null);
      
      // Carregar também transações vencidas do próximo mês
      let nextMonthOverdueTransactions: any[] = [];
      
      try {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const overdueParams: any = {
          dateFilterType: 'all', // Sempre buscar todas as datas
          payment_status_id: 'overdue', // Status "Vencido"
        };
        
        // Adicionar filtro de centro de custo se houver
        if (selectedCostCenter?.id || user?.cost_center_id) {
          overdueParams.cost_center_id = selectedCostCenter?.id || user?.cost_center_id;
        }
        
        const overdueResponse = await api.get(`/transactions/filtered?${new URLSearchParams(overdueParams)}`);
        
        if (overdueResponse.data && Array.isArray(overdueResponse.data)) {
          // Filtrar apenas transações vencidas do próximo mês
          nextMonthOverdueTransactions = overdueResponse.data.filter((t: any) => {
            // Verificar se a transação está vencida e não paga
            // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
            const isPaid = t.is_paid || t.payment_status_id === 2;
            return !isPaid && t.payment_status_id === 3; // ID 3 = Vencido (corrigido)
          });
        }
      } catch (error) {
        console.error('Erro ao buscar transações vencidas do próximo mês:', error);
      }
      
      // Combinar transações do próximo mês com transações vencidas
      const allNextMonthTransactionsMap = new Map();
      
      // Adicionar transações do próximo mês
      nextMonthTransactions.forEach((t: any) => {
        allNextMonthTransactionsMap.set(t.id, t);
      });
      
      // Adicionar transações vencidas do próximo mês
      nextMonthOverdueTransactions.forEach((t: any) => {
        allNextMonthTransactionsMap.set(t.id, t);
      });
      
      const combinedNextMonthTransactions = Array.from(allNextMonthTransactionsMap.values());
      
      // Calcular totais para o próximo mês
      const nextMonthReceitas = combinedNextMonthTransactions
        .filter((t: any) => t.transaction_type === 'Receita')
        .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
        
      const nextMonthDespesas = combinedNextMonthTransactions
        .filter((t: any) => t.transaction_type === 'Despesa')
        .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
        
      const nextMonthInvestimentos = combinedNextMonthTransactions
        .filter((t: any) => t.transaction_type === 'Investimento')
        .reduce((sum: number, t: any) => sum + getSafeAmount(t.amount), 0);
      
      // Calcular saldo previsto do próximo mês
      saldoPrevistoProximoMes = nextMonthReceitas - nextMonthDespesas - nextMonthInvestimentos;
    } else {
      // Para outros tipos de filtro, usar o cálculo padrão
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
    // 2. + TODAS as Receitas com situação PAGA (independentemente do período)
    // 3. - TODAS as Despesas com situação PAGA (independentemente do período)
    // 4. - TODOS os Investimentos com situação PAGA (independentemente do período)
    // 5. + TODAS as transações do fluxo de caixa (independentemente do período)

    // 1. Saldo inicial das contas bancárias
    const saldoInicialBancos = bankAccounts.reduce((sum, account) => 
      sum + getSafeAmount(account.initial_balance), 0);

    // 2. Receitas pagas (TODAS, independentemente do período)
    const receitasPagas = allPaidIncome;

    // 3. Despesas pagas (TODAS, independentemente do período)
    const despesasPagas = allPaidExpenses;

    // 4. Investimentos pagos (TODOS, independentemente do período)
    const investimentosPagos = allPaidInvestments;

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

    // Saldo atual real = Saldo Inicial + TODAS Receitas Pagas - TODAS Despesas Pagas - TODOS Investimentos Pagos + Fluxo de Caixa
    const saldoAtualReal = saldoInicialBancos + receitasPagas - despesasPagas - investimentosPagos + totalFluxoCaixa;
    
    // Calcular "A Receber" e "Recebido" com base em transações de receita
    const receitasPagasPeriodo = transactionsData
      .filter(t => t.type === 'income' && (t.is_paid || t.payment_status_id === 2))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const receitasNaoPagasPeriodo = transactionsData
      .filter(t => t.type === 'income' && !(t.is_paid || t.payment_status_id === 2))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    // Calcular "A Pagar" e "Pago" com base em transações de despesa apenas (não incluir investimentos)
    const despesasPagasPeriodo = transactionsData
      .filter(t => t.type === 'expense' && (t.is_paid || t.payment_status_id === 2))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
      
    const despesasNaoPagasPeriodo = transactionsData
      .filter(t => t.type === 'expense' && !(t.is_paid || t.payment_status_id === 2))
      .reduce((sum, t) => sum + getSafeAmount(t.amount), 0);
    
    const totalPago = despesasPagasPeriodo; // Apenas despesas pagas
    const totalAPagar = despesasNaoPagasPeriodo; // Despesas não pagas (em aberto + vencidas)
    
    console.log('=== Cálculo dos totalizadores ===');
    console.log('Total de receitas:', totalReceitas);
    console.log('Total de despesas:', totalDespesas);
    console.log('Total de investimentos:', totalInvestimentos);
    console.log('Receitas pagas:', receitasPagasPeriodo);
    console.log('Receitas não pagas:', receitasNaoPagasPeriodo);
    console.log('Despesas pagas:', despesasPagasPeriodo);
    console.log('Despesas não pagas:', despesasNaoPagasPeriodo);
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
    console.log('Receitas pagas (TODAS):', receitasPagas);
    console.log('Despesas pagas (TODAS):', despesasPagas);
    console.log('Investimentos pagos (TODOS):', investimentosPagos);
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
      received: receitasPagasPeriodo,
      paid: totalPago,
      toPay: totalAPagar,
      toReceive: receitasNaoPagasPeriodo
    };
    
    console.log('Novo monthSummary:', newMonthSummary);
    setMonthSummary(newMonthSummary);
    
    // REMOVIDO: calculateWeeklyBalances(transactionsData); - Movido para página separada
  };
  
  // Função para carregar o total de investimentos pagos de todos os períodos (Meta de Economia)
  const loadTotalInvestmentsPaid = async (costCenterId: number | string | null) => {
    try {
      console.log('Iniciando loadTotalInvestmentsPaid com costCenterId:', costCenterId);
      
      // Buscar todos os investimentos pagos, independentemente do período
      const params: any = {
        transaction_type: 'investment', // Usar 'investment' em inglês para consistency with API
        payment_status: 'paid', // Corrigir: usar payment_status ao invés de payment_status_id
        dateFilterType: 'all' // Garantir que não há filtro de data
      };
      
      // Adicionar filtro de centro de custo se selecionado
      if (costCenterId) {
        params.cost_center_id = costCenterId;
      }
      
      console.log('Carregando total de investimentos pagos com params:', params);
      
      // Usar o endpoint correto com parâmetros na query string
      const response = await api.get('/transactions/filtered', { params });
      console.log('Response investimentos pagos:', response.data);
      
      // Para manter consistência entre ambientes, verificar ambos os campos is_paid e payment_status_id
      const totalInvestimentosPagos = response.data
        .filter((t: any) => {
          // Verificar se está pago em ambos os ambientes
          const isPaid = t.is_paid || t.payment_status_id === 2;
          console.log(`Transação ${t.id}: is_paid=${t.is_paid}, payment_status_id=${t.payment_status_id}, isPaid=${isPaid}`);
          return isPaid;
        })
        .reduce((sum: number, t: any) => {
          // Garantir que o amount seja um número
          let amount: number;
          if (typeof t.amount === 'string') {
            amount = parseFloat(t.amount.replace(',', '.'));
          } else if (typeof t.amount === 'number') {
            amount = t.amount;
          } else {
            amount = 0;
          }
          console.log(`Adicionando valor ${amount} da transação ${t.id}`);
          return sum + amount;
        }, 0);
      
      console.log('Total investimentos pagos calculado:', totalInvestimentosPagos);
      setTotalInvestmentsPaid(totalInvestimentosPagos);
    } catch (error) {
      console.error('Erro ao carregar total de investimentos pagos:', error);
      setTotalInvestmentsPaid(0);
    }
  };
  
  // Função para carregar transações do próximo mês
  const loadNextMonthTransactions = async (currentDate: Date, costCenterId: number | string | null) => {
    try {
      // Calcular o próximo mês
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      // Parâmetros para buscar transações do próximo mês
      const params: any = {
        dateFilterType: 'month',
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear()
      };
      
      // Adicionar filtro de centro de custo se houver
      if (costCenterId) {
        params.cost_center_id = costCenterId;
      }
      
      console.log('Carregando transações do próximo mês com params:', params);
      
      const response = await api.get('/transactions/filtered', { params });
      console.log('Transações do próximo mês:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar transações do próximo mês:', error);
      return [];
    }
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
  
  const formatCurrency = (value: number) => {
    console.log('Formatando valor:', value);
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
    console.log('Valor formatado:', formatted);
    return formatted;
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
          lg: 'repeat(3, 1fr)'
        },
        gap: 3,
        mb: 3
      }}>
        {/* Cards de Estatísticas */}
        <Box>
          <ModernStatsCard
            title="Saldo Atual"
            value={formatCurrency(monthSummary.currentBalance)}
            subtitle={`Contas + Fluxo + Transações - ${formatPeriod(currentDate)}`}
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="primary"
            trend={{ value: 0, isPositive: monthSummary.currentBalance >= 0 }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Previsto"
            value={formatCurrency(monthSummary.expectedBalance)}
            subtitle={`Baseado no período - ${formatPeriod(currentDate)}`}
            icon={<AccountBalance sx={{ fontSize: 28 }} />}
            color="secondary"
            trend={{ value: 0, isPositive: true }}
          />
        </Box>

        <Box>
          <ModernStatsCard
            title="Saldo Previsto Próximo Mês"
            value={formatCurrency(monthSummary.expectedBalanceNextMonth)}
            subtitle={`Projeção para ${format(addMonths(currentDate, 1), 'MMMM yyyy', { locale: ptBR })}`}
            icon={<Timeline sx={{ fontSize: 28 }} />}
            color="warning"
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ModernSection
            title="Meta de Economia"
            subtitle={savingsGoal && savingsGoal.target_date ? `Prazo: ${formatToBrazilianDate(savingsGoal.target_date)}` : "Progresso até o final do mês"}
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
      {/* REMOVIDO: Controle Semanal movido para página separada */}
    </Box>
  );
}