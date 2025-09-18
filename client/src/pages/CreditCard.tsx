import { useState, useEffect } from 'react';
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
import { ModernHeader, ModernCard } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import { cardService, Card as CardType } from '../services/cardService';
import { CreditCardTransactionForm } from '../components/CreditCardTransactionForm';

interface CreditCard extends CardType {
  type?: string;
  limit_amount?: string;
  closing_day?: number;
  due_day?: number;
}

// Atualizar interface para refletir a estrutura real
interface CreditCardTransaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  installments?: number;
  category?: string;
  card_id: number;
}

export default function CreditCard() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Atualizar função para carregar transações
  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Implementar lógica real para carregar transações
      // Por enquanto, vamos deixar vazio pois precisamos entender melhor a estrutura
      console.log('Carregando transações...');
      // Exemplo de como carregar transações (descomentar quando tiver a API pronta)
      /*
      const transactionsData = await transactionService.list();
      setTransactions(transactionsData);
      */
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar transações quando o componente montar
    loadTransactions();
  }, []);

  // Atualizar função para lidar com o envio do formulário
  const handleTransactionSubmit = () => {
    // Recarregar dados após salvar transação
    loadTransactions();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const cardsData = await cardService.list();
        // Mapear os dados para o formato esperado pelo frontend
        const mappedCards = cardsData.map(card => ({
          ...card,
          type: card.brand || 'Crédito',
          limit_amount: '0'
          // Remover os valores fixos e usar os valores reais do backend
          // closing_day: 15,
          // due_day: 10
        }));
        setCards(mappedCards);
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    };
    
    loadData();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.gray[50] }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', md: '1400px' }, mx: 'auto' }}>
        {/* Modern Header */}
        <ModernHeader
          title="Cartões de Crédito"
          subtitle="Gerencie seus cartões e transações de crédito"
          breadcrumbs={[
            { label: 'TrackeOne Finance' },
            { label: 'Cartões de Crédito' }
          ]}
          actions={(
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowTransactionForm(true)}
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

        {/* Credit Cards Summary - Totalizadores */}
        {cards.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.gray[900] }}>
              Total de Cartões: {cards.length}
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: 2
            }}>
              {cards.map((card) => (
                <ModernCard key={card.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.gray[900] }}>
                        {card.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                        {card.brand || 'Crédito'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {card.closing_day && (
                        <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                          Fecha: {card.closing_day}
                        </Typography>
                      )}
                      {card.due_day && (
                        <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                          Vence: {card.due_day}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ModernCard>
              ))}
            </Box>
          </Box>
        )}

        {/* Transactions */}
        <Paper sx={{ 
          borderRadius: 2,
          border: `1px solid ${colors.gray[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${colors.gray[200]}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[900] }}>
              Transações
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.gray[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Descrição</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: colors.gray[700] }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Parcelas</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Cartão</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.gray[700] }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} sx={{ '&:hover': { bgcolor: colors.gray[50] } }}>
                    <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">R$ {(typeof transaction.amount === 'number' ? transaction.amount : 
                           (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) || 0 : 0))
                           .toFixed(2)}</TableCell>
                    <TableCell>{transaction.installments}x</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      {cards.find((card) => card.id === transaction.card_id)?.name}
                    </TableCell>
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
      
      {/* Formulário de Transação */}
      <CreditCardTransactionForm
        open={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={handleTransactionSubmit}
      />
    </Box>
  );
}
