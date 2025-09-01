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
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ModernHeader } from '../components/modern/ModernComponents';
import { colors, gradients, shadows } from '../theme/modernTheme';
import { cardService } from '../services/cardService';

interface CreditCard {
  id: number;
  name: string;
  type: string;
  limit_amount: string; // Vem como string do banco de dados
  closing_day: number;
  due_day: number;
}

interface CreditCardTransaction {
  id: number;
  date: string;
  description: string;
  amount: number | string;
  installments: number;
  category: string;
  cardId: number;
}

export default function CreditCard() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cardsData = await cardService.list();
        // Mapear os dados para o formato esperado pelo frontend
        const mappedCards = cardsData.map(card => ({
          id: card.id!,
          name: card.name,
          type: card.brand || card.type || 'Crédito',
          limit_amount: card.limit_amount || '0',
          closing_day: card.closing_day || 15,
          due_day: card.due_day || 10
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

        {/* Credit Cards Summary */}
        {cards.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 2
            }}>
              {cards.map((card) => (
                <Card key={card.id} sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${colors.gray[200]}`,
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  '&:hover': {
                    boxShadow: shadows.md,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: colors.gray[900] }}>
                      {card.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600], mb: 1 }}>
                      Limite: R$ {parseFloat(card.limit_amount || '0').toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600], mb: 1 }}>
                      Disponível: R$ {parseFloat(card.limit_amount || '0').toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600], mb: 1 }}>
                      Fechamento: Dia {card.closing_day}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                      Vencimento: Dia {card.due_day}
                    </Typography>
                  </CardContent>
                </Card>
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
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">R$ {(typeof transaction.amount === 'number' ? transaction.amount : 
                           (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) || 0 : 0))
                           .toFixed(2)}</TableCell>
                    <TableCell>{transaction.installments}x</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      {cards.find((card) => card.id === transaction.cardId)?.name}
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
    </Box>
  );
}