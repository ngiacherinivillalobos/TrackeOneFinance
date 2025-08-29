import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Chip,
  Fab,
  Snackbar,
  Alert,
  Tab,
  Tabs,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  ArrowDropDown as ArrowDropDownIcon,
  TrendingDown as ExpenseIcon,
  TrendingUp as IncomeIcon,
  AccountBalance as InvestmentIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { Transaction, transactionService } from '../services/transactionService';
import { Category, categoryService } from '../services/categoryService';
import { CategoryType, categoryTypeService } from '../services/categoryTypeService';
import { PaymentStatus, paymentStatusService } from '../services/paymentStatusService';
import { Contact, contactService } from '../services/contactService';
import { CostCenter, costCenterService } from '../services/costCenterService';
import { Subcategory, subcategoryService } from '../services/subcategoryService';
import api from '../services/api';

export default function Transactions() {
  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  
  // Estados de controle de diálogo
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<string>('Despesa');
  const [newTransactionMenuAnchorEl, setNewTransactionMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    category_type_id: '',
    only_pending: false
  });

  // Estado do formulário
  const [formData, setFormData] = useState({
    id: 0,
    descricao: '',
    valor: '',
    data_vencimento: '',
    data_pagamento: '',
    category_id: '',
    subcategory_id: '',
    payment_status_id: '',
    contact_id: '',
    cost_center_id: '',
    observacoes: '',
    tipo: 'Despesa',
    recorrencia: 'Nenhuma',
    quantidade_parcelas: 1
  });

  // Estados de notificação
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);

  // Carregamento de dados inicial
  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadSubcategories();
    loadCategoryTypes();
    loadPaymentStatuses();
    loadContacts();
    loadCostCenters();
  }, []);

  // Recarregar transações quando filtros mudam
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  // Funções de carregamento
  const loadTransactions = async () => {
    try {
      // Enviar filtro de mês como query param
      const params = new URLSearchParams();
      if (filters.month) {
        params.append('month', filters.month);
      }
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.subcategory_id) params.append('subcategory_id', filters.subcategory_id);
      if (filters.payment_status_id) params.append('payment_status_id', filters.payment_status_id);
      if (filters.contact_id) params.append('contact_id', filters.contact_id);
      if (filters.cost_center_id) params.append('cost_center_id', filters.cost_center_id);
      if (filters.category_type_id) params.append('category_type_id', filters.category_type_id);
      if (filters.only_pending) params.append('only_pending', 'true');

      const data = await transactionService.list(params);
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.list();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadSubcategories = async () => {
    try {
      const data = await subcategoryService.list();
      setSubcategories(data);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    }
  };

  const loadCategoryTypes = async () => {
    try {
      const data = await categoryTypeService.list();
      setCategoryTypes(data);
    } catch (error) {
      console.error('Erro ao carregar tipos de categoria:', error);
    }
  };

  const loadPaymentStatuses = async () => {
    try {
      const data = await paymentStatusService.list();
      setPaymentStatuses(data);
    } catch (error) {
      console.error('Erro ao carregar status de pagamento:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactService.list();
      setContacts(data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const loadCostCenters = async () => {
    try {
      const data = await costCenterService.list();
      setCostCenters(data);
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
    }
  };

  // Funções de controle de filtros
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      month: new Date().toISOString().slice(0, 7),
      category_id: '',
      subcategory_id: '',
      payment_status_id: '',
      contact_id: '',
      cost_center_id: '',
      category_type_id: '',
      only_pending: false
    });
  };

  // Funções de controle de menu
  const handleNewTransactionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNewTransactionMenuAnchorEl(event.currentTarget);
  };

  const handleNewTransactionMenuClose = () => {
    setNewTransactionMenuAnchorEl(null);
  };

  // Funções de controle de diálogo
  const handleOpenNewTransaction = (type: string) => {
    setNewTransactionType(type);
    setFormData({
      id: 0,
      descricao: '',
      valor: '',
      data_vencimento: '',
      data_pagamento: '',
      category_id: '',
      subcategory_id: '',
      payment_status_id: '',
      contact_id: '',
      cost_center_id: '',
      observacoes: '',
      tipo: type,
      recorrencia: 'Nenhuma',
      quantidade_parcelas: 1
    });
    setEditingTransaction(null);
    setOpen(true);
    handleNewTransactionMenuClose();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      id: transaction.id ?? 0,
      descricao: transaction.description ?? '',
      valor: transaction.amount?.toString() ?? '',
      data_vencimento: transaction.transaction_date?.split('T')[0] ?? '',
      data_pagamento: '',
      category_id: transaction.category_id?.toString() ?? '',
      subcategory_id: transaction.subcategory_id?.toString() ?? '',
      payment_status_id: transaction.payment_status_id?.toString() ?? '',
      contact_id: transaction.contact_id?.toString() ?? '',
      cost_center_id: transaction.cost_center_id?.toString() ?? '',
      observacoes: '',
      tipo: transaction.transaction_type ?? 'Despesa',
      recorrencia: 'Nenhuma',
      quantidade_parcelas: 1
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTransaction(null);
  };

  // Função para calcular totais
  const calculateTotals = (): {
    totalDespesas: number;
    totalReceitas: number;
    totalInvestimentos: number;
    totalVencidos: number;
    totalVencemHoje: number;
    totalAVencer: number;
    totalPagos: number;
    saldoPeriodo: number;
  } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totals = {
      totalDespesas: 0,
      totalReceitas: 0,
      totalInvestimentos: 0,
      totalVencidos: 0,
      totalVencemHoje: 0,
      totalAVencer: 0,
      totalPagos: 0,
      saldoPeriodo: 0
    };

    transactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      const dataVencimento = new Date(transaction.transaction_date);
      dataVencimento.setHours(0, 0, 0, 0);
      const isPago = transaction.payment_status_name === 'Pago';
      // Totais por tipo
      if (transaction.transaction_type === 'Despesa') {
        totals.totalDespesas += amount;
      } else if (transaction.transaction_type === 'Receita') {
        totals.totalReceitas += amount;
      } else if (transaction.transaction_type === 'Investimento') {
        totals.totalInvestimentos += amount;
      }
      // Totais por status/vencimento
      if (isPago) {
        totals.totalPagos += amount;
      } else {
        if (dataVencimento < today) {
          totals.totalVencidos += amount;
        } else if (dataVencimento.getTime() === today.getTime()) {
          totals.totalVencemHoje += amount;
        } else {
          totals.totalAVencer += amount;
        }
      }
    });
    totals.saldoPeriodo = totals.totalReceitas - totals.totalDespesas - totals.totalInvestimentos;
    return totals;
  };

  // Função de submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionData = {
        description: formData.descricao,
        amount: parseFloat(formData.valor),
        transaction_type: ['Despesa', 'Receita', 'Investimento'].includes(formData.tipo)
          ? formData.tipo as 'Despesa' | 'Receita' | 'Investimento'
          : 'Despesa',
        transaction_date: formData.data_vencimento,
        is_recurring: false,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined,
        payment_status_id: formData.payment_status_id ? parseInt(formData.payment_status_id) : undefined,
        contact_id: formData.contact_id ? parseInt(formData.contact_id) : undefined,
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : undefined,
        // outros campos opcionais conforme interface Transaction
      };

      if (editingTransaction && typeof editingTransaction.id === 'number') {
        await transactionService.update(editingTransaction.id, transactionData);
        setSnackbar({
          open: true,
          message: 'Transação atualizada com sucesso!',
          severity: 'success'
        });
      } else {
        await transactionService.create(transactionData);
        setSnackbar({
          open: true,
          message: 'Transação criada com sucesso!',
          severity: 'success'
        });
      }

      handleClose();
      loadTransactions();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar transação',
        severity: 'error'
      });
    }
  };

  // Função para deletar transação
  const handleDeleteTransaction = async (id: number) => {
    if (typeof id === 'number' && window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await transactionService.delete(id);
        setSnackbar({
          open: true,
          message: 'Transação excluída com sucesso!',
          severity: 'success'
        });
        loadTransactions();
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao excluir transação',
          severity: 'error'
        });
      }
    }
  };

  // Função para duplicar transação
  const handleDuplicateTransaction = (transaction: Transaction) => {
    setFormData({
      id: 0,
      descricao: transaction.description ?? '',
      valor: transaction.amount?.toString() ?? '',
      data_vencimento: '',
      data_pagamento: '',
      category_id: transaction.category_id?.toString() ?? '',
      subcategory_id: transaction.subcategory_id?.toString() ?? '',
      payment_status_id: transaction.payment_status_id?.toString() ?? '',
      contact_id: transaction.contact_id?.toString() ?? '',
      cost_center_id: transaction.cost_center_id?.toString() ?? '',
      observacoes: '',
      tipo: transaction.transaction_type ?? 'Despesa',
      recorrencia: 'Nenhuma',
      quantidade_parcelas: 1
    });
    setEditingTransaction(null);
    setOpen(true);
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a365d' }}>
            Controle Mensal - Transações
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleNewTransactionMenuOpen}
              startIcon={<AddIcon />}
              endIcon={<ArrowDropDownIcon />}
            >
              Novo registro
            </Button>
            <Menu
              anchorEl={newTransactionMenuAnchorEl}
              open={Boolean(newTransactionMenuAnchorEl)}
              onClose={handleNewTransactionMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleOpenNewTransaction('Despesa')}>
                <ListItemIcon>
                  <ExpenseIcon sx={{ color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText>Despesa</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOpenNewTransaction('Receita')}>
                <ListItemIcon>
                  <IncomeIcon sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText>Receita</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleOpenNewTransaction('Investimento')}>
                <ListItemIcon>
                  <InvestmentIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText>Investimento</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a365d' }}>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ minWidth: 200, flex: '1 1 auto' }}>
              <TextField
                label="Mês"
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ minWidth: 200, flex: '1 1 auto' }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 200, flex: '1 1 auto' }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.payment_status_id}
                  onChange={(e) => handleFilterChange('payment_status_id', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 200, flex: '1 1 auto' }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                fullWidth
                sx={{ height: '40px' }}
              >
                Limpar Filtros
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Totalizadores */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {/* Totalizadores principais mais discretos */}
            <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Despesas
              </Typography>
              <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'normal', fontSize: '1rem' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalDespesas)}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Receitas
              </Typography>
              <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'normal', fontSize: '1rem' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalReceitas)}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px', textAlign: 'center', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Investimentos
              </Typography>
              <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'normal', fontSize: '1rem' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalInvestimentos)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            {/* Totalizadores de status mais visíveis */}
            <Box sx={{ 
              flex: '1 1 200px',
              textAlign: 'center', 
              p: 2, 
              bgcolor: '#ffebee', 
              borderRadius: 2,
              border: '2px solid #f44336'
            }}>
              <Typography variant="body1" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                Vencidos
              </Typography>
              <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalVencidos)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 200px',
              textAlign: 'center', 
              p: 2, 
              bgcolor: '#fff3e0', 
              borderRadius: 2,
              border: '2px solid #ff9800'
            }}>
              <Typography variant="body1" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                Vencem Hoje
              </Typography>
              <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalVencemHoje)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 200px',
              textAlign: 'center', 
              p: 2, 
              bgcolor: '#e3f2fd', 
              borderRadius: 2,
              border: '2px solid #2196f3'
            }}>
              <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                A Vencer
              </Typography>
              <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalAVencer)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 200px',
              textAlign: 'center', 
              p: 2, 
              bgcolor: '#e8f5e8', 
              borderRadius: 2,
              border: '2px solid #4caf50'
            }}>
              <Typography variant="body1" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                Pagos
              </Typography>
              <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.totalPagos)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: '1 1 200px',
              textAlign: 'center', 
              p: 2, 
              bgcolor: totals.saldoPeriodo >= 0 ? '#e8f5e8' : '#ffebee', 
              borderRadius: 2,
              border: `2px solid ${totals.saldoPeriodo >= 0 ? '#4caf50' : '#f44336'}`
            }}>
              <Typography variant="body1" sx={{ 
                color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                fontWeight: 'bold' 
              }}>
                Saldo do Período
              </Typography>
              <Typography variant="h5" sx={{ 
                color: totals.saldoPeriodo >= 0 ? '#388e3c' : '#d32f2f', 
                fontWeight: 'bold' 
              }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totals.saldoPeriodo)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabela de transações */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Vencimento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#1a365d' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: transaction.transaction_type === 'Despesa' ? '#f44336' : 
                                   transaction.transaction_type === 'Receita' ? '#4caf50' : '#2196f3',
                            fontWeight: 'bold'
                          }}
                        >
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{transaction.category_name ?? ''}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.payment_status_name ?? ''}
                          size="small"
                          sx={{
                            bgcolor: transaction.payment_status_name === 'Pago' ? '#e8f5e8' : '#ffebee',
                            color: transaction.payment_status_name === 'Pago' ? '#388e3c' : '#d32f2f'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.transaction_type}
                          size="small"
                          sx={{
                            bgcolor: transaction.transaction_type === 'Despesa' ? '#ffebee' : 
                                     transaction.transaction_type === 'Receita' ? '#e8f5e8' : '#e3f2fd',
                            color: transaction.transaction_type === 'Despesa' ? '#d32f2f' : 
                                   transaction.transaction_type === 'Receita' ? '#388e3c' : '#1976d2'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditTransaction(transaction)}
                          sx={{ color: '#1976d2' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicateTransaction(transaction)}
                          sx={{ color: '#ed6c02' }}
                        >
                          <FileCopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => typeof transaction.id === 'number' && handleDeleteTransaction(transaction.id)}
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>
      </Box>

      {/* Dialog para criar/editar transação */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 'bold', color: '#1a365d' }}>
            {editingTransaction ? 'Editar Transação' : `Nova ${newTransactionType}`}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                label="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                fullWidth
                required
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TextField
                    label="Valor"
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    fullWidth
                    required
                    inputProps={{ step: "0.01" }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TextField
                    label="Data de Vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <FormControl fullWidth required>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      label="Categoria"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.payment_status_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_status_id: e.target.value }))}
                      label="Status"
                    >
                      {paymentStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
