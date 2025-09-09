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
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  TrendingDown as DiscountIcon,
  TrendingUp as InterestIcon,
  AccountBalance
} from '@mui/icons-material';
import { bankAccountService, BankAccount } from '../services/bankAccountService';
import { cardService, Card } from '../services/cardService';
import { getLocalDateString } from '../utils/dateUtils';

export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'Despesa' | 'Receita' | 'Investimento';
}

export interface PaymentData {
  payment_date: string;
  paid_amount: number;
  payment_type: 'bank_account' | 'credit_card';
  bank_account_id?: number;
  card_id?: number;
  observations?: string;
  discount?: number;
  interest?: number;
}

interface PaymentFormData extends PaymentData {
  paid_amount_display: string;
}

interface PaymentDialogProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
  isBatchMode?: boolean;
  selectedTransactionIds?: number[];
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  transaction,
  onClose,
  onConfirm,
  isBatchMode = false,
  selectedTransactionIds = []
}) => {
  // Estados para listas
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_date: getLocalDateString(),
    paid_amount: 0,
    paid_amount_display: '',
    payment_type: 'bank_account',
    bank_account_id: undefined,
    card_id: undefined,
    observations: ''
  });

  // Estado para diferença de valor
  const [valueDifference, setValueDifference] = useState({
    amount: 0,
    type: '' as '' | 'discount' | 'interest'
  });

  // Carregar dados quando o dialog abrir
  useEffect(() => {
    if (open && transaction) {
      loadData();
      resetForm();
    }
  }, [open, transaction]);

  // Calcular diferença quando valor pago mudar (apenas para modo individual)
  useEffect(() => {
    if (transaction && formData.paid_amount > 0 && !isBatchMode) {
      const difference = transaction.amount - formData.paid_amount;
      
      if (difference > 0) {
        // Valor pago menor que previsto = desconto
        setValueDifference({
          amount: difference,
          type: 'discount'
        });
      } else if (difference < 0) {
        // Valor pago maior que previsto = juros
        setValueDifference({
          amount: Math.abs(difference),
          type: 'interest'
        });
      } else {
        // Valores iguais
        setValueDifference({
          amount: 0,
          type: ''
        });
      }
    } else if (isBatchMode) {
      // Em modo lote, não calcular diferenças
      setValueDifference({ amount: 0, type: '' });
    }
  }, [transaction, formData.paid_amount, isBatchMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bankAccountsData, cardsData] = await Promise.all([
        bankAccountService.list(),
        cardService.list()
      ]);
      
      setBankAccounts(bankAccountsData);
      setCards(cardsData);

      // Definir conta padrão se houver
      if (bankAccountsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          bank_account_id: bankAccountsData[0].id
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (transaction) {
      // Garantir que o amount seja um número antes de chamar toFixed
      const amountValue = typeof transaction.amount === 'number' ? transaction.amount : 
                         (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) || 0 : 0);
      const displayValue = isBatchMode ? '' : amountValue.toFixed(2).replace('.', ',');
      setFormData({
        payment_date: getLocalDateString(),
        paid_amount: isBatchMode ? 0 : amountValue,
        paid_amount_display: displayValue,
        payment_type: 'bank_account',
        bank_account_id: undefined,
        card_id: undefined,
        observations: ''
      });
    }
    setValueDifference({ amount: 0, type: '' });
  };

  const handlePaymentTypeChange = (type: 'bank_account' | 'credit_card') => {
    setFormData(prev => ({
      ...prev,
      payment_type: type,
      bank_account_id: type === 'bank_account' ? (bankAccounts[0]?.id || undefined) : undefined,
      card_id: type === 'credit_card' ? (cards[0]?.id || undefined) : undefined
    }));
  };

  const handleSubmit = async () => {
    if (!isBatchMode && !transaction?.id) {
      alert('ID da transação é obrigatório');
      return;
    }

    if (isBatchMode && selectedTransactionIds.length === 0) {
      alert('Nenhuma transação selecionada para pagamento em lote');
      return;
    }

    // Validações
    if (!formData.payment_date) {
      alert('Data de pagamento é obrigatória');
      return;
    }

    // Em modo lote, o valor pago não é validado pois cada transação mantém seu valor original
    if (!isBatchMode && formData.paid_amount <= 0) {
      alert('Valor pago deve ser maior que zero');
      return;
    }

    if (formData.payment_type === 'bank_account' && !formData.bank_account_id) {
      alert('Selecione uma conta bancária');
      return;
    }

    if (formData.payment_type === 'credit_card' && !formData.card_id) {
      alert('Selecione um cartão de crédito');
      return;
    }

    setSubmitting(true);
    try {
      // Extrair apenas os campos necessários para PaymentData
      const paymentData: PaymentData = {
        payment_date: formData.payment_date,
        paid_amount: formData.paid_amount,
        payment_type: formData.payment_type,
        bank_account_id: formData.bank_account_id,
        card_id: formData.card_id,
        observations: formData.observations,
        discount: valueDifference.type === 'discount' ? valueDifference.amount : undefined,
        interest: valueDifference.type === 'interest' ? valueDifference.amount : undefined
      };
      
      await onConfirm(paymentData);
      
      // Fechar o diálogo apenas após a confirmação bem-sucedida
      onClose();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!transaction) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: transaction.transaction_type === 'Receita' 
          ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' // Green gradient for income
          : transaction.transaction_type === 'Despesa'
          ? 'linear-gradient(135deg, #f44336 0%, #c62828 100%)' // Red gradient for expense  
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Default blue gradient for investment
        color: 'white',
        borderRadius: '8px 8px 0 0',
        m: 0
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AccountBalance sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {isBatchMode ? 'Pagamento em Lote' : 'Marcar como Pago'}
            </Typography>
          </Box>
          {!isBatchMode && (
            <Chip 
              label={transaction.transaction_type}
              sx={{
                bgcolor: transaction.transaction_type === 'Receita' ? 'rgba(76, 175, 80, 0.2)' : 
                        transaction.transaction_type === 'Despesa' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                color: 'white',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 2, 
        bgcolor: 'white',
        borderRadius: '0 0 8px 8px'
      }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={300}>
            <CircularProgress size={50} sx={{ mb: 2, color: '#667eea' }} />
            <Typography variant="body1" color="text.secondary">
              Carregando informações...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Seção de Informações da Transação */}
            <Paper elevation={0} sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ 
                mb: 1.5, 
                color: '#334155',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#3b82f6' 
                }} />
                Informações da Transação
              </Typography>
              
              {isBatchMode ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e40af' }}>
                    {selectedTransactionIds.length} transações selecionadas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cada transação manterá seu valor original. Apenas a forma de pagamento, tipo e data serão aplicados a todas.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e40af' }}>
                    {transaction.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Valor:</strong> {formatCurrency(transaction.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Data:</strong> {(() => {
                        // Tratar a data de forma consistente entre ambientes
                        try {
                          if (transaction.transaction_date.includes('T')) {
                            // Formato ISO completo
                            const date = new Date(transaction.transaction_date);
                            return date.toLocaleDateString('pt-BR');
                          } else {
                            // Formato YYYY-MM-DD
                            // Usar Date.parse para garantir consistência entre ambientes
                            const date = new Date(transaction.transaction_date + 'T00:00:00');
                            // Ajustar para o fuso horário local sem converter para UTC
                            return date.toLocaleDateString('pt-BR');
                          }
                        } catch (error) {
                          // Fallback para formato bruto se houver erro
                          return transaction.transaction_date;
                        }
                      })()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Seção de Dados do Pagamento */}
            <Paper elevation={0} sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: '#334155',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#10b981' 
                }} />
                Dados do Pagamento
              </Typography>
              
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)'
                },
                gap: 2
              }}>
                {/* Data de Pagamento */}
                <Box>
                  <TextField
                    fullWidth
                    label="Data de Pagamento"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                </Box>

                {/* Valor Pago - apenas em modo individual */}
                {!isBatchMode && (
                  <Box>
                    <TextField
                      fullWidth
                      label="Valor Pago"
                      type="text"
                      value={formData.paid_amount_display}
                      onChange={(e) => {
                        // Permite apenas números, vírgula e ponto
                        const value = e.target.value.replace(/[^0-9.,]/g, '');
                        setFormData(prev => ({ ...prev, paid_amount_display: value }));
                      }}
                      onFocus={(e) => {
                        // Converter para formato de edição (sem formatação de milhares)
                        const value = e.target.value;
                        if (value) {
                          // Remove formatação e mantém apenas números e vírgula
                          const parseBrazilianNumber = (str: string): number => {
                            str = str.trim();
                            if (!str.includes(',')) {
                              return parseFloat(str.replace(/\./g, '')) || 0;
                            }
                            const parts = str.split(',');
                            const integerPart = parts[0].replace(/\./g, '');
                            const decimalPart = parts[1] || '00';
                            const americanFormat = integerPart + '.' + decimalPart;
                            return parseFloat(americanFormat) || 0;
                          };
                          
                          const numericValue = parseBrazilianNumber(value);
                          if (!isNaN(numericValue)) {
                            // Converte para formato editável (sem pontos de milhar)
                            const editableValue = numericValue.toFixed(2).replace('.', ',');
                            setFormData(prev => ({ 
                              ...prev, 
                              paid_amount_display: editableValue,
                              paid_amount: numericValue
                            }));
                          }
                        }
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
                            setFormData(prev => ({ 
                              ...prev, 
                              paid_amount_display: formattedValue,
                              paid_amount: numericValue
                            }));
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1, color: '#059669', fontWeight: 600 }}>R$</Typography>
                      }}
                      placeholder="0,00"
                      helperText="Use vírgula para decimais (ex: 1666,00)"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Diferença de Valor - apenas em modo individual */}
            {!isBatchMode && valueDifference.type && (
              <Alert 
                severity={valueDifference.type === 'discount' ? 'success' : 'warning'}
                icon={valueDifference.type === 'discount' ? <DiscountIcon /> : <InterestIcon />}
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: 20
                  }
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {valueDifference.type === 'discount' ? '💰 Desconto Aplicado' : '📈 Juros Calculados'}: {formatCurrency(valueDifference.amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {valueDifference.type === 'discount' && 'Valor pago menor que o previsto'}
                  {valueDifference.type === 'interest' && 'Valor pago maior que o previsto'}
                </Typography>
              </Alert>
            )}

            {/* Seção de Forma de Pagamento */}
            <Paper elevation={0} sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: '#334155',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#8b5cf6' 
                }} />
                Forma de Pagamento
              </Typography>
              
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)'
                },
                gap: 2
              }}>
                <Box>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Pagamento</InputLabel>
                    <Select
                      value={formData.payment_type}
                      label="Tipo de Pagamento"
                      onChange={(e) => handlePaymentTypeChange(e.target.value as 'bank_account' | 'credit_card')}
                      sx={{
                        borderRadius: 2,
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea'
                        }
                      }}
                    >
                      <MenuItem value="bank_account">
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 0.5 }}>
                          <BankIcon sx={{ color: '#059669' }} />
                          <Typography>Conta Bancária</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="credit_card">
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 0.5 }}>
                          <CardIcon sx={{ color: '#dc2626' }} />
                          <Typography>Cartão de Crédito</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Seleção de Conta/Cartão */}
                <Box>
                  {formData.payment_type === 'bank_account' ? (
                    <FormControl fullWidth required>
                      <InputLabel>Conta Bancária</InputLabel>
                      <Select
                        value={formData.bank_account_id || ''}
                        label="Conta Bancária"
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: Number(e.target.value) }))}
                        sx={{
                          borderRadius: 2,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          }
                        }}
                      >
                        {bankAccounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            <Typography>
                              {account.name}
                              {account.account_number && (
                                <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                                  ({account.account_number})
                                </Typography>
                              )}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <FormControl fullWidth required>
                      <InputLabel>Cartão de Crédito</InputLabel>
                      <Select
                        value={formData.card_id || ''}
                        label="Cartão de Crédito"
                        onChange={(e) => setFormData(prev => ({ ...prev, card_id: Number(e.target.value) }))}
                        sx={{
                          borderRadius: 2,
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea'
                          }
                        }}
                      >
                        {cards.map((card) => (
                          <MenuItem key={card.id} value={card.id}>
                            <Typography>
                              {card.name}
                              {card.brand && (
                                <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                                  ({card.brand})
                                </Typography>
                              )}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Seção de Observações */}
            <Paper elevation={0} sx={{ 
              p: 2, 
              bgcolor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: '#334155',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#f59e0b' 
                }} />
                Observações
              </Typography>
              
              <TextField
                fullWidth
                label="Informações adicionais"
                multiline
                rows={2}
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Digite aqui informações adicionais sobre este pagamento..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        gap: 2,
        justifyContent: 'flex-end'
      }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          variant="outlined"
          size="large"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            borderColor: '#d1d5db',
            color: '#6b7280',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#9ca3af',
              bgcolor: '#f9fafb'
            }
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || submitting}
          variant="contained"
          size="large"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)'
            },
            '&:disabled': {
              background: '#d1d5db'
            }
          }}
        >
          {submitting ? 'Processando...' : '✓ Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;