import { useState, useEffect } from 'react';
import { createSafeDate } from '../utils/dateUtils';
import { format } from 'date-fns';
import api from '../lib/axios';
import { transactionService, PaymentData, Transaction as ServiceTransaction } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Interfaces
interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
  is_paid: boolean;
  is_recurring?: boolean;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  contact?: { id: number; name: string; };
  category?: { id: number; name: string; };
  subcategory?: { id: number; name: string; };
  cost_center?: { id: number; name: string; number?: string; };
  original_cost_center_id?: number;
  original_contact_id?: number;
}

interface Category {
  id: number;
  name: string;
  source_type: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

interface Contact {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

interface PaymentStatus {
  id: number;
  name: string;
}

interface Filters {
  transaction_type: string[];
  payment_status_id: string[];
  category_id: string[];
  subcategory_id: string;
  contact_id: string[];
  cost_center_id: string[];
}

export default function useMonthlyControl() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilterType, setDateFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>(() => {
    const defaultFilters: Filters = {
      transaction_type: [],
      payment_status_id: ['unpaid', 'overdue'],
      category_id: [],
      subcategory_id: '',
      contact_id: [],
      cost_center_id: []
    };
    if (user?.cost_center_id) {
      defaultFilters.cost_center_id = [user.cost_center_id.toString()];
    }
    return defaultFilters;
  });

  const [orderBy, setOrderBy] = useState<string>('transaction_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [newTransactionMenuAnchor, setNewTransactionMenuAnchor] = useState<HTMLElement | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState<boolean>(false);
  const [batchActionsAnchor, setBatchActionsAnchor] = useState<HTMLElement | null>(null);

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    transaction_type: 'Despesa' as 'Despesa' | 'Receita' | 'Investimento',
    is_recurring: false,
    recurrence_type: 'mensal' as 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | 'personalizada',
    recurrence_count: 1 as number | string,
    recurrence_interval: 1,
    recurrence_weekday: 1,
    is_paid: false,
    is_installment: false,
    total_installments: 1 as number | string
  });

  const [recurrencePreview, setRecurrencePreview] = useState<Array<{ creation_date: string; due_date: string; description: string; amount: number; }>>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] = useState<ServiceTransaction | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [batchEditData, setBatchEditData] = useState({ amount: '', description: '', transaction_date: '', contact_id: '', category_id: '', subcategory_id: '', cost_center_id: '' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalReceitas = transactions.filter(t => t.transaction_type === 'Receita').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalDespesas = transactions.filter(t => t.transaction_type === 'Despesa').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalInvestimentos = transactions.filter(t => t.transaction_type === 'Investimento').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const selectedTransactionsData = transactions.filter(t => selectedTransactions.includes(t.id));
  const totalSelectedReceitas = selectedTransactionsData.filter(t => t.transaction_type === 'Receita').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSelectedDespesas = selectedTransactionsData.filter(t => t.transaction_type === 'Despesa').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSelectedInvestimentos = selectedTransactionsData.filter(t => t.transaction_type === 'Investimento').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const isTransactionOverdue = (transaction: Transaction) => {
    if (!transaction.transaction_date || transaction.is_paid) return false;
    const transactionDate = createSafeDate(transaction.transaction_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate < today;
  };

  const vencidos = transactions.filter(t => isTransactionOverdue(t));
  const vencemHoje = transactions.filter(t => {
    if (!t.transaction_date || t.is_paid) return false;
    const transactionDate = createSafeDate(t.transaction_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate.getTime() === today.getTime();
  });
  const aVencer = transactions.filter(t => {
    if (!t.transaction_date || t.is_paid) return false;
    const transactionDate = createSafeDate(t.transaction_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);
    return transactionDate > today;
  });

  const totalVencidos = vencidos.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -Number(t.amount) : Number(t.amount)), 0);
  const totalVencemHoje = vencemHoje.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -Number(t.amount) : Number(t.amount)), 0);
  const totalAVencer = aVencer.reduce((sum, t) => sum + (t.transaction_type === 'Despesa' ? -Number(t.amount) : Number(t.amount)), 0);

  const saldoPeriodo = selectedTransactions.length > 0
    ? totalSelectedReceitas - totalSelectedDespesas - totalSelectedInvestimentos
    : totalReceitas - totalDespesas - totalInvestimentos;

    const loadFilterData = async () => {
        try {
          const [categoriesRes, subcategoriesRes, contactsRes, costCentersRes] = await Promise.all([
            api.get('/categories'),
            api.get('/subcategories'),
            api.get('/contacts'),
            api.get('/cost-centers'),
          ]);
          
          setCategories(categoriesRes.data);
          setSubcategories(subcategoriesRes.data);
          setContacts(contactsRes.data);
          setCostCenters(costCentersRes.data);
        } catch (error) {
          console.error('Erro ao carregar dados dos filtros:', error);
        }
      };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (dateFilterType === 'month') {
                params.append('start_date', format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'));
                params.append('end_date', format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd'));
            } else if (dateFilterType === 'year') {
                params.append('start_date', `${selectedYear}-01-01`);
                params.append('end_date', `${selectedYear}-12-31`);
            } else if (dateFilterType === 'custom' && customStartDate && customEndDate) {
                params.append('start_date', format(customStartDate, 'yyyy-MM-dd'));
                params.append('end_date', format(customEndDate, 'yyyy-MM-dd'));
            }

            if (filters.transaction_type.length > 0) params.append('transaction_type', filters.transaction_type.join(','));
            if (filters.payment_status_id.length > 0) params.append('payment_status', filters.payment_status_id.join(','));
            if (filters.category_id.length > 0) params.append('category_id', filters.category_id.join(','));
            if (filters.subcategory_id) params.append('subcategory_id', filters.subcategory_id);
            if (filters.contact_id.length > 0) params.append('contact_id', filters.contact_id.join(','));
            if (filters.cost_center_id.length > 0) {
                params.append('cost_center_id', filters.cost_center_id.join(','));
            } else if (user?.cost_center_id) {
                params.append('cost_center_id', user.cost_center_id.toString());
            }
            
            const response = await api.get(`/transactions/filtered?${params.toString()}`);
            
            const mappedTransactions = response.data.map((t: any) => ({
                ...t,
                is_paid: t.is_paid === 1 || t.is_paid === true,
                contact: t.contact_name ? { id: t.contact_id, name: t.contact_name } : null,
                category: t.category_name ? { id: t.category_id, name: t.category_name } : null,
                subcategory: t.subcategory_name ? { id: t.subcategory_id, name: t.subcategory_name } : null,
                cost_center: t.cost_center_name ? { id: t.cost_center_id, name: t.cost_center_name, number: t.cost_center_number } : null,
                original_cost_center_id: t.cost_center_id,
                original_contact_id: t.contact_id
            }));

            setTransactions(mappedTransactions);

        } catch (error) {
            console.error('Erro detalhado ao carregar transações:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    loadTransactions();
    loadFilterData();
  }, [currentDate, filters, dateFilterType, customStartDate, customEndDate, selectedYear, user]);

  const generateRecurrencePreview = () => {
    // ... (implementation remains the same)
  };

  useEffect(() => {
    if (formData.is_recurring && formData.transaction_date && formData.amount) {
      generateRecurrencePreview();
    } else {
      setRecurrencePreview([]);
    }
  }, [formData.is_recurring, formData.recurrence_type, formData.recurrence_count, formData.recurrence_interval, formData.recurrence_weekday, formData.transaction_date, formData.amount, formData.description]);

  const handleSelectTransaction = (transactionId: number) => {
    setSelectedTransactions(prev => prev.includes(transactionId) ? prev.filter(id => id !== transactionId) : [...prev, transactionId]);
  };

  const handleSelectAllTransactions = () => {
    setSelectedTransactions(selectedTransactions.length === transactions.length ? [] : transactions.map(t => t.id));
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: number) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedTransactionId(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDuplicateTransaction = async (id: number) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      const duplicated = { ...response.data, id: undefined, transaction_date: new Date().toISOString().split('T')[0], description: response.data.description + ' (cópia)' };
      await api.post('/transactions', duplicated);
      loadTransactions();
      showSnackbar('Transação duplicada com sucesso!', 'success');
    } catch (error) {
      showSnackbar('Erro ao duplicar transação', 'error');
    }
    handleActionMenuClose();
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.delete(`/transactions/${id}`);
        loadTransactions();
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
    handleActionMenuClose();
  };

  const handleMarkAsPaid = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    setSelectedTransactionForPayment({ ...transaction, is_recurring: transaction.is_recurring || false });
    setIsBatchMode(false);
    setPaymentDialogOpen(true);
    handleActionMenuClose();
  };

  const handleBatchMarkAsPaid = () => {
    if (selectedTransactions.length === 0) return;
    setIsBatchMode(true);
    setSelectedTransactionForPayment({ id: 0, description: `Pagamento em lote (${selectedTransactions.length} transações)`, amount: 0, transaction_date: new Date().toISOString().split('T')[0], transaction_type: 'Despesa', is_recurring: false });
    setPaymentDialogOpen(true);
    setBatchActionsAnchor(null);
  };

  const handleBatchDelete = async () => {
    if (selectedTransactions.length === 0 || !window.confirm(`Tem certeza que deseja excluir ${selectedTransactions.length} transação(ões)?`)) return;
    try {
      await Promise.all(selectedTransactions.map(id => api.delete(`/transactions/${id}`)));
      setSelectedTransactions([]);
      loadTransactions();
      showSnackbar(`${selectedTransactions.length} transações excluídas`);
    } catch (error) {
      showSnackbar('Erro ao excluir transações', 'error');
    }
    setBatchActionsAnchor(null);
  };

  const handleBatchEdit = () => {
    if (selectedTransactions.length === 0) return;
    setBatchEditData({ amount: '', description: '', transaction_date: '', contact_id: '', category_id: '', subcategory_id: '', cost_center_id: '' });
    setBatchEditDialogOpen(true);
    setBatchActionsAnchor(null);
  };

  const parseBrazilianNumber = (str: string): number => {
    if (typeof str === 'number') return str;
    str = str.toString().trim();
    if (!str.includes(',')) return parseFloat(str.replace(/\./g, '')) || 0;
    const parts = str.split(',');
    const integerPart = parts[0].replace(/\./g, '');
    const decimalPart = parts[1] || '00';
    return parseFloat(integerPart + '.' + decimalPart) || 0;
  };

  const handleConfirmBatchEdit = async () => {
    try {
      const updateData: any = {};
      if (batchEditData.amount) updateData.amount = parseBrazilianNumber(batchEditData.amount);
      if (batchEditData.description) updateData.description = batchEditData.description;
      if (batchEditData.transaction_date) updateData.transaction_date = batchEditData.transaction_date;
      if (batchEditData.contact_id) updateData.contact_id = parseInt(batchEditData.contact_id);
      if (batchEditData.category_id) updateData.category_id = parseInt(batchEditData.category_id);
      if (batchEditData.subcategory_id) updateData.subcategory_id = parseInt(batchEditData.subcategory_id);
      if (batchEditData.cost_center_id) updateData.cost_center_id = parseInt(batchEditData.cost_center_id);

      if (Object.keys(updateData).length === 0) {
        showSnackbar('Nenhum campo foi preenchido para edição', 'warning');
        return;
      }

      await Promise.all(selectedTransactions.map(id => api.patch(`/transactions/${id}`, updateData)));
      setSelectedTransactions([]);
      setBatchEditDialogOpen(false);
      loadTransactions();
      showSnackbar(`${selectedTransactions.length} transações atualizadas.`);
    } catch (error) {
      showSnackbar('Erro ao editar transações em lote', 'error');
    }
  };

  const handleConfirmPayment = async (paymentData: PaymentData) => {
    try {
      if (isBatchMode) {
        const batchPromises = selectedTransactions.map(async (id) => {
          const transaction = transactions.find(t => t.id === id);
          if (transaction) await transactionService.markAsPaid(id, { ...paymentData, paid_amount: transaction.amount });
        });
        await Promise.all(batchPromises);
        showSnackbar(`${selectedTransactions.length} transações pagas.`, 'success');
        setSelectedTransactions([]);
      } else if (selectedTransactionForPayment?.id) {
        await transactionService.markAsPaid(selectedTransactionForPayment.id, paymentData);
        showSnackbar('Transação paga com sucesso!', 'success');
      }
      loadTransactions();
    } catch (error) {
      showSnackbar('Erro ao processar pagamento', 'error');
      throw error;
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedTransactionForPayment(null);
    setIsBatchMode(false);
  };

  const handleReversePayment = async (id: number) => {
    if (!window.confirm('Deseja estornar este pagamento?')) return;
    try {
      await api.post(`/transactions/${id}/reverse-payment`);
      showSnackbar('Pagamento estornado!', 'success');
      loadTransactions();
    } catch (error) {
      showSnackbar('Erro ao estornar pagamento', 'error');
    }
    handleActionMenuClose();
  };

  const handleBatchReversePayment = async () => {
    const paidTransactions = transactions.filter(t => selectedTransactions.includes(t.id) && t.is_paid);
    if (paidTransactions.length === 0) {
      showSnackbar('Nenhuma transação paga selecionada.', 'warning');
      setBatchActionsAnchor(null);
      return;
    }
    if (!window.confirm(`Deseja estornar ${paidTransactions.length} pagamento(s)?`)) return;
    try {
      await Promise.all(paidTransactions.map(t => api.post(`/transactions/${t.id}/reverse-payment`)));
      setSelectedTransactions([]);
      loadTransactions();
      showSnackbar(`${paidTransactions.length} pagamento(s) estornado(s).`, 'success');
    } catch (error) {
      showSnackbar('Erro ao estornar pagamentos.', 'error');
    }
    setBatchActionsAnchor(null);
  };

  const handleNewTransaction = (type: 'Despesa' | 'Receita' | 'Investimento') => {
    setFormData({
        description: '', amount: '', transaction_date: new Date().toISOString().split('T')[0],
        category_id: '', subcategory_id: '', payment_status_id: '', contact_id: '', cost_center_id: user?.cost_center_id?.toString() || '',
        transaction_type: type, is_recurring: false, recurrence_type: 'mensal', recurrence_count: 1,
        recurrence_interval: 1, recurrence_weekday: 1, is_paid: false, is_installment: false, total_installments: 1
    });
    setEditingTransaction(null);
    setRecurrencePreview([]);
    setTransactionDialogOpen(true);
    setNewTransactionMenuAnchor(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toFixed(2).replace('.', ','),
      transaction_date: transaction.transaction_date.split('T')[0],
      category_id: transaction.category?.id?.toString() || '',
      subcategory_id: transaction.subcategory?.id?.toString() || '',
      payment_status_id: '',
      contact_id: (transaction as any).original_contact_id?.toString() || transaction.contact?.id?.toString() || '',
      cost_center_id: (transaction as any).original_cost_center_id?.toString() || '',
      transaction_type: transaction.transaction_type,
      is_recurring: false, recurrence_type: 'mensal', recurrence_count: 1, recurrence_interval: 1, recurrence_weekday: 1,
      is_paid: transaction.is_paid || false,
      is_installment: transaction.is_installment || false,
      total_installments: transaction.total_installments || 1
    });
    setRecurrencePreview([]);
    setTransactionDialogOpen(true);
    handleActionMenuClose();
  };

  const handleCloseTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const transactionData = {
        description: formData.description,
        amount: parseBrazilianNumber(formData.amount),
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : null,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_count: formData.is_recurring ? formData.recurrence_count : null,
        is_paid: formData.is_paid,
        is_installment: formData.is_installment,
        total_installments: formData.is_installment ? (typeof formData.total_installments === 'string' ? parseInt(formData.total_installments) : 1) : null
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
        showSnackbar('Transação atualizada!');
      } else {
        await api.post('/transactions', transactionData);
        showSnackbar('Transação criada!');
      }
      handleCloseTransactionDialog();
      loadTransactions();
    } catch (error) {
      showSnackbar('Erro ao salvar transação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const descendingComparator = (a: any, b: any, orderBy: string) => {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc' ? (a: any, b: any) => descendingComparator(a, b, orderBy) : (a: any, b: any) => -descendingComparator(a, b, orderBy);
  };

  const sortedTransactions = [...transactions].sort(getComparator(order, orderBy));

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getTransactionTypeColor = (type: string) => ({ Receita: '#4caf50', Despesa: '#f44336', Investimento: '#2196f3' }[type] || '#757575');
  
  const isTransactionDueToday = (transaction: Transaction) => {
    if (!transaction.transaction_date || transaction.is_paid) return false;
    const transactionDate = createSafeDate(transaction.transaction_date);
    return transactionDate.getTime() === today.getTime();
  };

  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.is_paid) return 'Pago';
    if (isTransactionOverdue(transaction)) return 'Vencido';
    return 'Em aberto';
  };

  const getStatusColor = (transaction: Transaction) => {
    if (transaction.is_paid) return { bg: '#e8f5e8', color: '#2e7d32', border: '#4caf50' };
    if (isTransactionOverdue(transaction)) return { bg: '#ffebee', color: '#d32f2f', border: '#f44336' };
    return { bg: '#fff3e0', color: '#f57c00', border: '#ff9800' };
  };

  return {
    transactions, loading, currentDate, setCurrentDate, dateFilterType, setDateFilterType, customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate, selectedYear, setSelectedYear, filters, setFilters, orderBy, order, categories, subcategories,
    contacts, costCenters, selectedTransactions, setSelectedTransactions, actionMenuAnchorEl, selectedTransactionId,
    newTransactionMenuAnchor, moreFiltersOpen, setMoreFiltersOpen, batchActionsAnchor, transactionDialogOpen, setTransactionDialogOpen,
    editingTransaction, formData, setFormData, recurrencePreview, snackbar, setSnackbar, paymentDialogOpen, selectedTransactionForPayment,
    isBatchMode, batchEditDialogOpen, batchEditData, setBatchEditData, totalReceitas, totalDespesas, totalInvestimentos, saldoPeriodo,
    vencidos, vencemHoje, aVencer, totalVencidos, totalVencemHoje, totalAVencer, loadTransactions, handleSelectTransaction,
    handleSelectAllTransactions, handleActionMenuOpen, handleActionMenuClose, handleDuplicateTransaction, handleDeleteTransaction,
    handleMarkAsPaid, handleBatchMarkAsPaid, handleBatchDelete, handleBatchEdit, handleConfirmBatchEdit, handleConfirmPayment,
    handleClosePaymentDialog, handleReversePayment, handleBatchReversePayment, showSnackbar, handleNewTransaction,
    handleEditTransaction, handleCloseTransactionDialog, handleTransactionSubmit, handleSort, sortedTransactions,
    formatCurrency, getTransactionTypeColor, getTransactionStatus, getStatusColor, setNewTransactionMenuAnchor, setBatchActionsAnchor,
    setBatchEditDialogOpen, isTransactionOverdue, isTransactionDueToday,
  };
}
