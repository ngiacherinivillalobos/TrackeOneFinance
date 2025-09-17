import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  CalendarToday,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  DateRange,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { format, parseISO, addDays, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInDays, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { colors } from '../theme/modernTheme';
import { ModernSection, ModernHeader } from '../components/modern/ModernComponents';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

// Interfaces
interface WeeklyCycle {
  cycleNumber: number;
  periodStart: Date;
  periodEnd: Date;
  totalDays: number;
  weeks: WeekData[];
  totalBudget: number;
}

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  daysInPeriod: number;
  dailyBudget: number;
  weeklyBudget: number;
  actualSpent: number;
  balance: number;
  accumulatedBalance: number; // Novo campo para saldo acumulativo
  transactions: Transaction[];
  status: 'safe' | 'warning' | 'danger';
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  type: 'expense' | 'income' | 'investment';
  is_paid: boolean;
  payment_status_id?: number;
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
  payment_days?: string; // "5,15,20" format
}

// Função para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function WeeklyControl() {
  const { user } = useAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [cycles, setCycles] = useState<WeeklyCycle[]>([]);
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilterType, setDateFilterType] = useState<'month'>('month'); // Fixo como 'month' igual ao controle mensal
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

    loadCostCenters();
  }, [user?.cost_center_id]);

  // Carregar dados quando centro de custo, mês ou ano forem alterados
  useEffect(() => {
    if (selectedCostCenter) {
      loadWeeklyControlData();
    }
  }, [selectedCostCenter, currentDate]);

  // Função para analisar os dias de recebimento
  const parsePaymentDays = (paymentDaysStr?: string): number[] => {
    if (!paymentDaysStr) return [15]; // Default: dia 15
    
    return paymentDaysStr
      .split(',')
      .map(day => parseInt(day.trim()))
      .filter(day => day >= 1 && day <= 31)
      .sort((a, b) => a - b);
  };

  // Função para ajustar data para o último dia útil anterior (APENAS para dias de RECEBIMENTO)
  // LÓGICA PARA PERÍODOS: início ajustado para dia útil, fim SEMPRE dia 14 do próximo mês
  // O FIM do ciclo é sempre o dia anterior ao próximo recebimento (ajustado ou não)
  const adjustToLastBusinessDay = (date: Date): Date => {
    const adjustedDate = new Date(date);
    const dayOfWeek = adjustedDate.getDay(); // 0 = domingo, 6 = sábado
    
    if (dayOfWeek === 0) {
      // Se for domingo, voltar 2 dias (para sexta-feira)
      adjustedDate.setDate(adjustedDate.getDate() - 2);
    } else if (dayOfWeek === 6) {
      // Se for sábado, voltar 1 dia (para sexta-feira)
      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    
    return adjustedDate;
  };

  // Função para calcular períodos de ciclo baseados nos dias de recebimento
  const calculateCyclePeriods = (paymentDays: number[], referenceDate: Date): { start: Date, end: Date, cycleNumber: number }[] => {
    const periods: { start: Date, end: Date, cycleNumber: number }[] = [];
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const currentDay = referenceDate.getDate();
    
    // Ordenar dias de recebimento
    const sortedPaymentDays = [...paymentDays].sort((a, b) => a - b);
    
    console.log('Calculando ciclos para dias de recebimento:', sortedPaymentDays);
    
    // Se há apenas um dia de recebimento, usar lógica anterior
    if (sortedPaymentDays.length === 1) {
      const paymentDay = sortedPaymentDays[0];
      let periodStart: Date;
      let periodEnd: Date;
      
      if (currentDay >= paymentDay) {
        // Período atual: do dia de recebimento até o dia anterior ao próximo recebimento
        const originalStart = new Date(year, month, paymentDay);
        periodStart = adjustToLastBusinessDay(originalStart);
        periodEnd = new Date(year, month + 1, paymentDay - 1);
      } else {
        // Período anterior
        const originalStart = new Date(year, month - 1, paymentDay);
        periodStart = adjustToLastBusinessDay(originalStart);
        periodEnd = new Date(year, month, paymentDay - 1);
      }
      
      periods.push({ start: periodStart, end: periodEnd, cycleNumber: 1 });
      return periods;
    }
    
    // Múltiplos dias de recebimento - criar ciclos individuais
    // Exemplo: dias 5,20 → Ciclo 1: 5-19, Ciclo 2: 20-4
    for (let i = 0; i < sortedPaymentDays.length; i++) {
      const currentPaymentDay = sortedPaymentDays[i];
      const nextPaymentDay = sortedPaymentDays[(i + 1) % sortedPaymentDays.length];
      
      let cycleStart: Date;
      let cycleEnd: Date;
      
      // Início do ciclo: dia de recebimento atual ajustado para dia útil
      const originalStart = new Date(year, month, currentPaymentDay);
      cycleStart = adjustToLastBusinessDay(originalStart);
      
      // Fim do ciclo: dia anterior ao próximo recebimento
      if (nextPaymentDay > currentPaymentDay) {
        // Próximo recebimento no mesmo mês
        cycleEnd = new Date(year, month, nextPaymentDay - 1);
      } else {
        // Próximo recebimento no próximo mês (caso do último ciclo do mês)
        cycleEnd = new Date(year, month + 1, nextPaymentDay - 1);
      }
      
      console.log(`Ciclo ${i + 1}: ${currentPaymentDay} até ${nextPaymentDay - 1} (${cycleStart.getDate()}/${cycleStart.getMonth()+1} - ${cycleEnd.getDate()}/${cycleEnd.getMonth()+1})`);
      
      periods.push({ 
        start: cycleStart, 
        end: cycleEnd, 
        cycleNumber: i + 1 
      });
    }
    
    // Filtrar ciclos para mostrar apenas os relevantes baseados na data atual
    const relevantPeriods = periods.filter(period => {
      const isCurrentOrFuture = period.end >= new Date(year, month, currentDay);
      const isRecentPast = period.start <= new Date(year, month, currentDay + 7); // 7 dias de tolerância
      return isCurrentOrFuture || isRecentPast;
    });
    
    return relevantPeriods.length > 0 ? relevantPeriods : periods;
  };

  // Função para dividir período em semanas (segunda a domingo)
  const divideIntoWeeks = (periodStart: Date, periodEnd: Date): { start: Date, end: Date, daysInPeriod: number }[] => {
    const weeks: { start: Date, end: Date, daysInPeriod: number }[] = [];
    
    // Obter todas as semanas no intervalo
    const weekIntervals = eachWeekOfInterval(
      { start: periodStart, end: periodEnd },
      { weekStartsOn: 1 } // Segunda-feira = 1
    );
    
    weekIntervals.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Calcular os dias que estão realmente dentro do período
      const actualStart = weekStart < periodStart ? periodStart : weekStart;
      const actualEnd = weekEnd > periodEnd ? periodEnd : weekEnd;
      
      const daysInPeriod = differenceInDays(actualEnd, actualStart) + 1;
      
      if (daysInPeriod > 0) {
        weeks.push({
          start: actualStart,
          end: actualEnd,
          daysInPeriod
        });
      }
    });
    
    return weeks;
  };

  // Carregar dados do controle semanal
  const loadWeeklyControlData = async () => {
    if (!selectedCostCenter) return;
    
    setLoading(true);
    try {
      // 1. Calcular saldo previsto usando a mesma lógica do MonthlyControl
      let monthlyBudget = 1400; // Fallback
      
      try {
        // ***** MESMA LÓGICA DO MONTHLYCONTROL PARA SALDO PREVISTO *****
        
        // 1. Buscar transações do período atual (mês)
        const monthlyTransactionsResponse = await api.get('/transactions/filtered', {
          params: {
            dateFilterType: 'month',
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
            cost_center_id: selectedCostCenter.id
          }
        });
        
        const periodTransactions = monthlyTransactionsResponse.data;
        
        // 2. Buscar TODAS as transações para filtrar vencidas
        const allTransactionsForOverdue = await api.get('/transactions/filtered', {
          params: {
            dateFilterType: 'all',
            cost_center_id: selectedCostCenter.id
          }
        });
        
        // 3. Filtrar apenas vencidas (antes de hoje E não pagas)
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const overdueTransactionsFiltered = allTransactionsForOverdue.data.filter((t: any) => {
          const transactionDate = new Date(t.transaction_date);
          transactionDate.setHours(0, 0, 0, 0);
          const isPaid = t.is_paid || t.payment_status_id === 2;
          // Incluir apenas se: data < hoje E não está pago
          return transactionDate < todayDate && !isPaid;
        });
        
        // 4. Combinar período + vencidas para cálculo do saldo (evitando duplicatas)
        const combinedForSaldo = [...periodTransactions];
        overdueTransactionsFiltered.forEach((overdueTransaction: any) => {
          if (!combinedForSaldo.some((t: any) => t.id === overdueTransaction.id)) {
            combinedForSaldo.push(overdueTransaction);
          }
        });
        
        // 5. Calcular saldo previsto usando transações combinadas
        const totalReceitas = combinedForSaldo
          .filter((t: any) => {
            const transactionType = t.transaction_type || 
              (t.type === 'income' ? 'Receita' : 
               t.type === 'expense' ? 'Despesa' : 'Investimento');
            return transactionType === 'Receita';
          })
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
          
        const totalDespesas = combinedForSaldo
          .filter((t: any) => {
            const transactionType = t.transaction_type || 
              (t.type === 'income' ? 'Receita' : 
               t.type === 'expense' ? 'Despesa' : 'Investimento');
            return transactionType === 'Despesa';
          })
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
          
        const totalInvestimentos = combinedForSaldo
          .filter((t: any) => {
            const transactionType = t.transaction_type || 
              (t.type === 'income' ? 'Receita' : 
               t.type === 'expense' ? 'Despesa' : 'Investimento');
            return transactionType === 'Investimento';
          })
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        
        monthlyBudget = totalReceitas - totalDespesas - totalInvestimentos;
        
        console.log('Saldo previsto calculado (período + vencidas não pagas):', {
          totalTransacoesPeriodo: periodTransactions.length,
          totalTransacoesVencidas: overdueTransactionsFiltered.length,
          totalTransacoesCombinadas: combinedForSaldo.length,
          receitas: totalReceitas,
          despesas: totalDespesas,
          investimentos: totalInvestimentos,
          saldoPrevisto: monthlyBudget
        });
        
      } catch (error) {
        console.log('Erro ao buscar dados do controle mensal, usando fallback R$ 1.400,00:', error);
      }

      // 2. Calcular períodos dos ciclos primeiro
      const paymentDays = parsePaymentDays(selectedCostCenter.payment_days);
      const periods = calculateCyclePeriods(paymentDays, currentDate);
      
      // 3. Buscar transações do fluxo de caixa baseado no período completo (menor data início ao maior data fim)
      const allStartDates = periods.map(p => p.start);
      const allEndDates = periods.map(p => p.end);
      const earliestStart = new Date(Math.min(...allStartDates.map(d => d.getTime())));
      const latestEnd = new Date(Math.max(...allEndDates.map(d => d.getTime())));
      
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      console.log('Buscando gastos de todos os ciclos:', 
                  `Início: ${earliestStart.getDate()}/${earliestStart.getMonth()+1} (${dayNames[earliestStart.getDay()]})`,
                  `| Fim: ${latestEnd.getDate()}/${latestEnd.getMonth()+1} (${dayNames[latestEnd.getDay()]})`);
      
      const response = await api.get('/cash-flow', {
        params: {
          cost_center_id: selectedCostCenter.id,
          startDate: earliestStart.toISOString().split('T')[0],
          endDate: latestEnd.toISOString().split('T')[0]
        }
      });
      
      console.log('Transações do fluxo de caixa encontradas:', response.data);
      setTransactionsData(response.data);
      
      // ***** CALCULAR SALDO PREVISTO BASEADO NO NÚMERO DE DIAS DE RECEBIMENTO *****
      const cycleBudgets: number[] = [];
      
      if (periods.length === 1) {
        // ***** CASO 1: UM DIA DE RECEBIMENTO - USAR LÓGICA DO MONTHLYCONTROL *****
        console.log('Ciclo único detectado - usando saldo mensal calculado:', monthlyBudget);
        cycleBudgets.push(monthlyBudget);
        
      } else {
        // ***** CASO 2: MÚLTIPLOS DIAS - CALCULAR SALDO INDIVIDUAL POR CICLO *****
        console.log(`Múltiplos ciclos detectados (${periods.length}) - calculando saldo individual por ciclo`);
        
        for (const period of periods) {
          let cycleBudget = 0;
          
          try {
            // 1. Buscar transações do período deste ciclo específico
            const startDateStr = period.start.toISOString().split('T')[0];
            const endDateStr = period.end.toISOString().split('T')[0];
            
            console.log(`Calculando saldo para Ciclo ${period.cycleNumber}: ${startDateStr} até ${endDateStr}`);
            
            // Buscar transações do período específico do ciclo
            const cycleTransactionsResponse = await api.get('/transactions/filtered', {
              params: {
                dateFilterType: 'period',
                startDate: startDateStr,
                endDate: endDateStr,
                cost_center_id: selectedCostCenter.id
              }
            });
            
            const cycleTransactions = cycleTransactionsResponse.data;
            
            // 2. Buscar transações vencidas (mesma lógica do MonthlyControl)
            const allTransactionsForOverdue = await api.get('/transactions/filtered', {
              params: {
                dateFilterType: 'all',
                cost_center_id: selectedCostCenter.id
              }
            });
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            const overdueTransactionsFiltered = allTransactionsForOverdue.data.filter((t: any) => {
              const transactionDate = new Date(t.date);
              transactionDate.setHours(0, 0, 0, 0);
              const isPaid = t.is_paid || t.payment_status_id === 2;
              return transactionDate < todayDate && !isPaid;
            });
            
            // 3. Combinar período do ciclo + vencidas
            const combinedForCycle = [...cycleTransactions];
            overdueTransactionsFiltered.forEach((overdueTransaction: any) => {
              if (!combinedForCycle.some((t: any) => t.id === overdueTransaction.id)) {
                combinedForCycle.push(overdueTransaction);
              }
            });
            
            // 4. Calcular receitas, despesas e investimentos do ciclo
            const totalReceitas = combinedForCycle
              .filter((t: any) => {
                const transactionType = t.transaction_type || 
                  (t.type === 'income' ? 'Receita' : 
                   t.type === 'expense' ? 'Despesa' : 'Investimento');
                return transactionType === 'Receita';
              })
              .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
              
            const totalDespesas = combinedForCycle
              .filter((t: any) => {
                const transactionType = t.transaction_type || 
                  (t.type === 'income' ? 'Receita' : 
                   t.type === 'expense' ? 'Despesa' : 'Investimento');
                return transactionType === 'Despesa';
              })
              .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
              
            const totalInvestimentos = combinedForCycle
              .filter((t: any) => {
                const transactionType = t.transaction_type || 
                  (t.type === 'income' ? 'Receita' : 
                   t.type === 'expense' ? 'Despesa' : 'Investimento');
                return transactionType === 'Investimento';
              })
              .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
            
            cycleBudget = totalReceitas - totalDespesas - totalInvestimentos;
            
            console.log(`Saldo Ciclo ${period.cycleNumber}:`, {
              receitas: totalReceitas,
              despesas: totalDespesas,
              investimentos: totalInvestimentos,
              saldoPrevisto: cycleBudget
            });
            
          } catch (error) {
            console.log(`Erro ao calcular saldo do Ciclo ${period.cycleNumber}, usando fallback proporcional:`, error);
            cycleBudget = monthlyBudget / periods.length;
          }
          
          cycleBudgets.push(cycleBudget);
        }
      }
      
      // ***** CALCULAR SALDO ACUMULADO ENTRE CICLOS *****
      // Processar ciclos sequencialmente para calcular acumulação
      const calculatedCycles: WeeklyCycle[] = [];
      let accumulatedCycleBalance = 0; // Saldo acumulado entre ciclos
      
      for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
        const period = periods[periodIndex];
        const weeks = divideIntoWeeks(period.start, period.end);
        const totalDays = differenceInDays(period.end, period.start) + 1;
        
        // Saldo do ciclo: orçamento original + saldo acumulado dos ciclos anteriores
        const originalBudget = cycleBudgets[periodIndex];
        const adjustedBudget = originalBudget + accumulatedCycleBalance;
        const dailyBudget = adjustedBudget / totalDays;
        
        console.log(`Ciclo ${period.cycleNumber}:`, {
          orcamentoOriginal: originalBudget,
          saldoAcumuladoAnterior: accumulatedCycleBalance,
          orcamentoAjustado: adjustedBudget
        });
        
        // Filtrar apenas transações de gastos (despesas) do período
        const periodTransactions = response.data.filter((t: any) => {
          const transactionDate = parseISO(t.date);
          const isInPeriod = transactionDate >= period.start && transactionDate <= period.end;
          const isExpense = t.record_type === 'Despesa';
          console.log(`Ciclo ${period.cycleNumber} - Transação:`, t.description, 'Data:', t.date, 'Valor:', t.amount, 'Tipo:', t.record_type, 'No período?', isInPeriod, 'É despesa?', isExpense);
          return isInPeriod && isExpense;
        });
        
        console.log(`Transações filtradas para o Ciclo ${period.cycleNumber}:`, periodTransactions);
        
        const weekData: WeekData[] = [];
        let accumulatedBalance = 0; // Variável para acumular saldo das semanas
        let totalCycleSpent = 0; // Total gasto no ciclo
        
        weeks.forEach((week, weekIndex) => {
          const weeklyBudget = dailyBudget * week.daysInPeriod;
          
          // Filtrar transações desta semana (usar dados do cash-flow)
          const weekTransactions = periodTransactions.filter((t: any) => {
            const transactionDate = parseISO(t.date);
            const isInWeek = transactionDate >= week.start && transactionDate <= week.end;
            console.log('Semana', weekIndex + 1, '- Transação:', t.description, 'Data:', t.date, 'Na semana?', isInWeek);
            return isInWeek;
          });
          
          // Calcular gastos reais da semana (apenas despesas)
          const actualSpent = weekTransactions
            .reduce((sum: number, t: any) => {
              const amount = parseFloat(t.amount.toString()) || 0;
              console.log('Somando gasto:', t.description, amount);
              return sum + amount;
            }, 0);
          
          console.log('Gastos totais da semana', weekIndex + 1, ':', actualSpent);
          
          const balance = weeklyBudget - actualSpent;
          
          // Acumular saldo: saldo desta semana + saldo acumulado das semanas anteriores
          accumulatedBalance += balance;
          
          let status: 'safe' | 'warning' | 'danger' = 'safe';
          if (balance < 0) status = 'danger';
          else if (actualSpent > weeklyBudget * 0.8) status = 'warning';
          
          weekData.push({
            weekNumber: weekIndex + 1,
            weekStart: week.start,
            weekEnd: week.end,
            daysInPeriod: week.daysInPeriod,
            dailyBudget,
            weeklyBudget,
            actualSpent,
            balance,
            accumulatedBalance, // Novo campo com saldo acumulativo
            transactions: weekTransactions,
            status
          });
          
          // Acumular total gasto no ciclo
          totalCycleSpent += actualSpent;
        });
        
        // Calcular saldo final do ciclo para acumular no próximo
        const cycleRealBalance = adjustedBudget - totalCycleSpent;
        
        console.log(`Ciclo ${period.cycleNumber} - Resumo:`, {
          orcamento: adjustedBudget,
          gastoTotal: totalCycleSpent,
          saldoReal: cycleRealBalance
        });
        
        // Acumular saldo positivo para o próximo ciclo
        if (cycleRealBalance > 0) {
          accumulatedCycleBalance += cycleRealBalance;
        }
        
        const cycle = {
          cycleNumber: period.cycleNumber,
          periodStart: period.start,
          periodEnd: period.end,
          totalDays,
          weeks: weekData,
          totalBudget: adjustedBudget
        };
        
        calculatedCycles.push(cycle);
      }
      
      setCycles(calculatedCycles);
    } catch (error) {
      console.error('Erro ao carregar dados do controle semanal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return { bg: colors.success[50], color: colors.success[700], border: colors.success[200] };
      case 'warning': return { bg: colors.warning[50], color: colors.warning[700], border: colors.warning[200] };
      case 'danger': return { bg: colors.error[50], color: colors.error[700], border: colors.error[200] };
      default: return { bg: colors.gray[50], color: colors.gray[700], border: colors.gray[200] };
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', xl: '1600px' }, mx: 'auto' }}>
          {/* Header */}
          <ModernHeader
            title="Controle Semanal"
            subtitle="Controle financeiro baseado nos ciclos de recebimento"
            breadcrumbs={[
              { label: 'TrackeOne Finance' },
              { label: 'Controle Semanal' }
            ]}
          />

          {/* Filtros Modernos - igual ao MonthlyControl */}
          <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: `1px solid ${colors.gray[200]}`,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 1.5, md: 2 },
              alignItems: 'center'
            }}>
              {/* Centro de Custo */}
              <FormControl size="small" sx={{ minWidth: 250, flex: '0 0 auto' }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Centro de Custo</InputLabel>
                <Select
                  value={selectedCostCenter?.id || ''}
                  label="Centro de Custo"
                  onChange={(e) => {
                    const selected = costCenters.find(cc => cc.id === e.target.value);
                    setSelectedCostCenter(selected || null);
                  }}
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
                  {costCenters.map((costCenter) => (
                    <MenuItem key={costCenter.id} value={costCenter.id}>
                      {costCenter.name} {costCenter.number ? `(${costCenter.number})` : ''} 
                      {costCenter.payment_days && (
                        <Chip 
                          size="small" 
                          label={`Dias: ${costCenter.payment_days}`} 
                          sx={{ ml: 1, bgcolor: colors.primary[50], color: colors.primary[600] }}
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Modern Calendar Picker - igual ao MonthlyControl */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
                  size="small"
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '&:hover': { 
                      bgcolor: colors.gray[50],
                      boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                    }
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                
                <Box sx={{ minWidth: 180, flex: '0 0 auto' }}>
                  <DatePicker
                    views={['month', 'year']}
                    label="Mês e Ano"
                    value={currentDate}
                    onChange={(newValue) => newValue && setCurrentDate(newValue)}
                    slotProps={{
                      textField: { 
                        size: 'small',
                        fullWidth: true,
                        sx: { 
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
                        }
                      }
                    }}
                  />
                </Box>
                
                <IconButton 
                  onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
                  size="small"
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    '&:hover': { 
                      bgcolor: colors.gray[50],
                      boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.15)'
                    }
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

        {/* Sem mensagem informativa por enquanto */}

        {/* Loading */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Ciclos */}
        {cycles.map((cycle) => (
          <Box key={cycle.cycleNumber} sx={{ mb: 4 }}>
            <ModernSection
              title={`Ciclo ${cycle.cycleNumber}`}
              subtitle={`${format(cycle.periodStart, 'dd/MM/yyyy', { locale: ptBR })} - ${format(cycle.periodEnd, 'dd/MM/yyyy', { locale: ptBR })} (${cycle.totalDays} dias)`}
              icon={<AccountBalance sx={{ fontSize: 24 }} />}
            >
              {/* Resumo do Ciclo */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(cycle.totalBudget)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Saldo Previsto (Controle Mensal)
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" color="text.primary">
                        {formatCurrency(cycle.totalBudget / cycle.totalDays)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Limite Diário Disponível
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" color="text.primary">
                        {cycle.weeks.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Semanas no Ciclo
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Tabela de Semanas */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Semana</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Dias</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Orçamento</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Gasto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo Semana</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo Acumulado</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycle.weeks.map((week) => {
                      const statusColor = getStatusColor(week.status);
                      
                      return (
                        <TableRow
                          key={week.weekNumber}
                          sx={{
                            '&:hover': {
                              backgroundColor: colors.primary[50],
                            },
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                Semana {week.weekNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {week.transactions.length} transações
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(week.weekStart, 'dd/MM', { locale: ptBR })} - {format(week.weekEnd, 'dd/MM', { locale: ptBR })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(week.weekStart, 'EEEE', { locale: ptBR })} a {format(week.weekEnd, 'EEEE', { locale: ptBR })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {week.daysInPeriod}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(week.weeklyBudget)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(week.dailyBudget)}/dia
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              color={week.status === 'danger' ? 'error.main' : 'inherit'}
                            >
                              {formatCurrency(week.actualSpent)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              color={week.balance < 0 ? 'error.main' : 'success.main'}
                            >
                              {formatCurrency(week.balance)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              color={week.accumulatedBalance < 0 ? 'error.main' : 'success.main'}
                              sx={{
                                fontSize: '0.9rem',
                                bgcolor: week.accumulatedBalance < 0 ? 'error.50' : 'success.50',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1
                              }}
                            >
                              {formatCurrency(week.accumulatedBalance)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                week.status === 'safe' ? 'Controlado' :
                                week.status === 'warning' ? 'Atenção' : 'Excedido'
                              }
                              size="small"
                              sx={{
                                bgcolor: statusColor.bg,
                                color: statusColor.color,
                                fontWeight: 600,
                                border: `1px solid ${statusColor.border}`,
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
        ))}

        {/* Estado vazio */}
        {!selectedCostCenter && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarToday sx={{ fontSize: 64, color: colors.gray[400], mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecione um Centro de Custo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha um centro de custo para visualizar o controle semanal baseado nos dias de recebimento
            </Typography>
          </Box>
        )}

        {selectedCostCenter && cycles.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TrendingUp sx={{ fontSize: 64, color: colors.gray[400], mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum dado encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Não foram encontrados dados para o período selecionado
            </Typography>
          </Box>
        )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}