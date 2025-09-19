import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import api from '../lib/axios';
import { cardService, Card } from '../services/cardService';
import { categoryService, Category } from '../services/categoryService';
import { subcategoryService, Subcategory } from '../services/subcategoryService';

interface CreditCardTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  transaction?: any; // Para edição
}

// Adicionar interface para o estado do formulário
interface FormData {
  date: Date;
  description: string;
  amount: string;
  categoryId: string;
  subcategoryId: string;
  cardId: string;
  isInstallment: boolean;
  installments: number | '';
  amountType: 'parcela' | 'total';
}

export function CreditCardTransactionForm({ open, onClose, onSubmit, transaction }: CreditCardTransactionFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    description: '',
    amount: '',
    categoryId: '',
    subcategoryId: '',
    cardId: '',
    isInstallment: false,
    installments: 2, // Valor padrão inicial é 2 parcelas
    amountType: 'parcela', // 'parcela' ou 'total'
  });

  // Carregar cartões, categorias e subcategorias
  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          setLoading(true);
          const [cardsData, categoriesData, subcategoriesData] = await Promise.all([
            cardService.list(),
            categoryService.list(),
            subcategoryService.list()
          ]);
          setCards(cardsData);
          setCategories(categoriesData.filter(cat => cat.source_type === 'Despesa'));
          setSubcategories(subcategoriesData);
          
          // Se estiver editando uma transação, preencher os dados
          if (transaction) {
            console.log('Editando transação:', transaction);
            setFormData({
              date: new Date(transaction.transaction_date),
              description: transaction.description,
              amount: transaction.amount.toString().replace('.', ','),
              categoryId: transaction.category_id?.toString() || '',
              subcategoryId: transaction.subcategory_id?.toString() || '',
              cardId: transaction.card_id?.toString() || '',
              isInstallment: transaction.is_installment || false,
              installments: transaction.total_installments || 2,
              amountType: 'parcela', // Valor padrão
            });
          } else {
            // Resetar para valores padrão
            setFormData({
              date: new Date(),
              description: '',
              amount: '',
              categoryId: '',
              subcategoryId: '',
              cardId: '',
              isInstallment: false,
              installments: 2,
              amountType: 'parcela',
            });
          }
        } catch (err) {
          setError('Erro ao carregar dados');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [open, transaction]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios (sem contato e centro de custo para transações de cartão)
      if (!formData.description || !formData.amount || !formData.categoryId || !formData.cardId) {
        setError('Todos os campos são obrigatórios');
        setLoading(false);
        return;
      }

      // Encontrar o cartão selecionado
      const selectedCard = cards.find(card => card.id === parseInt(formData.cardId));
      
      // Converter dados para o formato da transação
      // Função para converter formato brasileiro para número
      const parseBrazilianNumber = (str: string): number => {
        if (typeof str === 'number') return str;
        
        str = str.toString().trim();
        
        // Se não tem vírgula, trata como número inteiro
        if (!str.includes(',')) {
          // Remove pontos (milhares) e converte
          return parseFloat(str.replace(/\./g, '')) || 0;
        }
        
        // Divide em parte inteira e decimal
        const parts = str.split(',');
        const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
        const decimalPart = parts[1] || '00'; // Parte decimal
        
        // Reconstrói o número no formato americano
        const americanFormat = integerPart + '.' + decimalPart;
        return parseFloat(americanFormat) || 0;
      };
      
      let amount = parseBrazilianNumber(formData.amount);
      
      // Ajustar o valor com base no tipo selecionado
      if (formData.isInstallment && formData.installments !== undefined && formData.installments !== null) {
        // Garantir que installments seja um número
        let installments: number;
        if (formData.installments === '') {
          installments = 2;
        } else {
          // Converter para número, se for string vazia usar 2
          installments = Number(formData.installments) || 2;
        }
        
        if (formData.amountType === 'total') {
          // Se for valor total, dividir pelo número de parcelas
          amount = amount / installments;
        }
        // Se for valor por parcela, manter o valor como está
      }
      
      // Determinar a data correta com base na data de fechamento do cartão
      let transactionDate = new Date(formData.date);
      
      if (selectedCard && selectedCard.closing_day) {
        const transactionDay = transactionDate.getDate();
        
        // Se a data da transação for maior ou igual à data de fechamento,
        // calcular para o próximo mês (próxima fatura)
        // CORREÇÃO: Se o dia for menor que a data de fechamento, é referente à fatura do mês atual
        if (transactionDay >= selectedCard.closing_day) {
          transactionDate.setMonth(transactionDate.getMonth() + 1);
        }
      }

      if (transaction) {
        // Atualizar transação existente
        console.log('Atualizando transação existente:', transaction);
        if (formData.isInstallment) {
          // Para transações parceladas, precisamos atualizar todas as parcelas
          // Primeiro, vamos buscar a transação original para obter informações completas
          const installmentData = {
            description: formData.description,
            amount: amount,
            type: 'expense',
            category_id: parseInt(formData.categoryId),
            subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
            card_id: parseInt(formData.cardId),
            transaction_date: transactionDate.toISOString().split('T')[0],
            is_installment: true,
            total_installments: formData.installments === '' ? 2 : Number(formData.installments),
            installment_number: transaction.installment_number
          };

          console.log('Dados para atualização de parcela:', installmentData);
          await api.put(`/credit-card-transactions/${transaction.id}`, installmentData);
        } else {
          // Atualizar transação única
          const transactionData = {
            description: formData.description,
            amount: amount,
            type: 'expense',
            category_id: parseInt(formData.categoryId),
            subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
            card_id: parseInt(formData.cardId),
            transaction_date: transactionDate.toISOString().split('T')[0],
            is_installment: false
          };

          console.log('Dados para atualização de transação única:', transactionData);
          await api.put(`/credit-card-transactions/${transaction.id}`, transactionData);
        }
      } else {
        // Criar nova transação
        if (formData.isInstallment) {
          // Criar transações parceladas usando o novo endpoint
          const installments = formData.installments === '' ? 2 : (typeof formData.installments === 'string' ? 2 : formData.installments);
          const installmentData = {
            description: formData.description,
            total_amount: formData.amountType === 'total' ? parseBrazilianNumber(formData.amount) : amount * installments,
            total_installments: installments,
            card_id: parseInt(formData.cardId),
            category_id: parseInt(formData.categoryId),
            subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
            transaction_date: transactionDate.toISOString().split('T')[0]
          };

          await api.post('/credit-card-transactions/installments', installmentData);
        } else {
          // Criar transação única usando o novo endpoint
          const transactionData = {
            description: formData.description,
            amount: amount,
            type: 'expense',
            category_id: parseInt(formData.categoryId),
            subcategory_id: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
            card_id: parseInt(formData.cardId),
            transaction_date: transactionDate.toISOString().split('T')[0]
          };

          await api.post('/credit-card-transactions', transactionData);
        }
      }

      onSubmit();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar transação');
      console.error('Erro detalhado ao salvar transação:', err);
      console.error('Dados da requisição:', err.config?.data);
      console.error('Status:', err.response?.status);
      console.error('Dados da resposta:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar subcategorias pela categoria selecionada
  const filteredSubcategories = subcategories.filter(
    sub => formData.categoryId && sub.category_id === parseInt(formData.categoryId)
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          pb: 1,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 'bold',
          color: '#1a365d'
        }}>
          {transaction ? 'Editar Transação' : 'Nova Transação de Cartão de Crédito'}
        </DialogTitle>
        
        <DialogContent sx={{ 
          pt: 2,
          bgcolor: '#FFFFFF'
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? 1.5 : 2
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 2,
              mt: 0.5
            }}>
              {/* Primeira linha - Cartão, Data e Valor */}
              <Box>
                <FormControl fullWidth margin="dense" required size={isMobile ? "small" : "medium"}>
                  <InputLabel>Cartão</InputLabel>
                  <Select
                    value={formData.cardId}
                    label="Cartão"
                    onChange={(e) => handleChange('cardId', e.target.value)}
                    size={isMobile ? "small" : "medium"}
                  >
                    {cards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>
                        {card.name} ({card.brand}) - Fecha dia {card.closing_day || '-'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                  <DatePicker
                    label="Data"
                    value={formData.date}
                    onChange={(newValue) => newValue && handleChange('date', newValue)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: "dense", 
                        required: true,
                        size: isMobile ? "small" : "medium"
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Box>
              
              <Box>
                <TextField
                  label="Valor"
                  type="text"
                  fullWidth
                  margin="dense"
                  value={formData.amount}
                  onChange={(e) => {
                    // Permite apenas números, vírgula e ponto
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    setFormData(prev => ({ ...prev, amount: value }));
                  }}
                  onBlur={(e) => {
                    // Formatar o valor quando perder o foco
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    if (value) {
                      // Função para converter formato brasileiro para número
                      const parseBrazilianNumber = (str: string): number => {
                        // Remove espaços
                        str = str.trim();
                        
                        // Se não tem vírgula, trata como número inteiro
                        if (!str.includes(',')) {
                          // Remove pontos (milhares) e converte
                          return parseFloat(str.replace(/\./g, '')) || 0;
                        }
                        
                        // Divide em parte inteira e decimal
                        const parts = str.split(',');
                        const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
                        const decimalPart = parts[1] || '00'; // Parte decimal
                        
                        // Reconstrói o número no formato americano
                        const americanFormat = integerPart + '.' + decimalPart;
                        return parseFloat(americanFormat) || 0;
                      };
                      
                      const numericValue = parseBrazilianNumber(value);
                      if (!isNaN(numericValue) && numericValue >= 0) {
                        const formattedValue = numericValue.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        setFormData(prev => ({ ...prev, amount: formattedValue }));
                      }
                    }
                  }}
                  onFocus={(e) => {
                    // Converter para formato de edição (sem formatação de milhares)
                    const value = e.target.value;
                    if (value) {
                      // Função para converter formato brasileiro para número
                      const parseBrazilianNumber = (str: string): number => {
                        if (typeof str === 'number') return str;
                        
                        str = str.toString().trim();
                        
                        // Se não tem vírgula, trata como número inteiro
                        if (!str.includes(',')) {
                          // Remove pontos (milhares) e converte
                          return parseFloat(str.replace(/\./g, '')) || 0;
                        }
                        
                        // Divide em parte inteira e decimal
                        const parts = str.split(',');
                        const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
                        const decimalPart = parts[1] || '00'; // Parte decimal
                        
                        // Reconstrói o número no formato americano
                        const americanFormat = integerPart + '.' + decimalPart;
                        return parseFloat(americanFormat) || 0;
                      };
                      
                      const numericValue = parseBrazilianNumber(value);
                      if (!isNaN(numericValue)) {
                        // Converte para formato editável (sem pontos de milhar)
                        const editableValue = numericValue.toFixed(2).replace('.', ',');
                        setFormData(prev => ({ ...prev, amount: editableValue }));
                      }
                    }
                  }}
                  required
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1 }}>R$</Box>
                  }}
                  placeholder="0,00"
                  helperText="Use vírgula para decimais (ex: 1.666,00)"
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
              
              {/* Segunda linha - Descrição (ocupa toda a largura) */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  label="Descrição"
                  fullWidth
                  margin="dense"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  size={isMobile ? "small" : "medium"}
                  multiline
                  rows={2}
                />
              </Box>
              
              {/* Terceira linha - Categoria e Subcategoria */}
              <Box>
                <Autocomplete
                  fullWidth
                  options={categories}
                  getOptionLabel={(option) => option.name || ''}
                  value={categories.find(cat => cat.id?.toString() === formData.categoryId) || null}
                  onChange={(event, newValue) => {
                    handleChange('categoryId', newValue?.id?.toString() || '');
                    // Limpar subcategoria quando a categoria mudar
                    handleChange('subcategoryId', '');
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Categoria" 
                      margin="dense" 
                      required 
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
              
              <Box>
                <Autocomplete
                  fullWidth
                  options={filteredSubcategories}
                  getOptionLabel={(option) => option.name || ''}
                  value={subcategories.find(sub => sub.id?.toString() === formData.subcategoryId) || null}
                  onChange={(event, newValue) => {
                    handleChange('subcategoryId', newValue?.id?.toString() || '');
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Subcategoria" 
                      margin="dense" 
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  size={isMobile ? "small" : "medium"}
                  disabled={!formData.categoryId}
                />
              </Box>
              
              {/* Quarta linha - Compra parcelada e Nº de parcelas */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isInstallment}
                      onChange={(e) => handleChange('isInstallment', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Compra parcelada"
                />
              </Box>
              
              {formData.isInstallment && (
                <>
                  <Box>
                    <TextField
                      label="Nº de parcelas"
                      type="number"
                      fullWidth
                      margin="dense"
                      value={formData.installments === '' ? '' : formData.installments}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir campo vazio ou números positivos
                        if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 99)) {
                          handleChange('installments', value === '' ? '' : parseInt(value));
                        }
                      }}
                      InputProps={{
                        inputProps: { min: 1, max: 99 }
                      }}
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                  
                  {/* Opção de valor total ou por parcela */}
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={formData.amountType}
                        onChange={(e) => handleChange('amountType', e.target.value)}
                      >
                        <MuiFormControlLabel 
                          value="parcela" 
                          control={<Radio />} 
                          label="Valor por parcela" 
                          sx={{ mr: 3 }}
                        />
                        <MuiFormControlLabel 
                          value="total" 
                          control={<Radio />} 
                          label="Valor total" 
                        />
                      </RadioGroup>
                    </FormControl>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={onClose}
            disabled={loading}
            size={isMobile ? "small" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            size={isMobile ? "small" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : (transaction ? 'Atualizar' : 'Salvar')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
