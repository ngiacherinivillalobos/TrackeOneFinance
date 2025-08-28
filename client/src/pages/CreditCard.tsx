import { useState } from 'react';
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

interface CreditCard {
  id: number;
  name: string;
  limit: number;
  available: number;
  closingDay: number;
  dueDay: number;
}

interface CreditCardTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  installments: number;
  category: string;
  cardId: number;
}

export default function CreditCard() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);

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
                      Limite: R$ {card.limit.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600], mb: 1 }}>
                      Disponível: R$ {card.available.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600], mb: 1 }}>
                      Fechamento: Dia {card.closingDay}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.gray[600] }}>
                      Vencimento: Dia {card.dueDay}
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
                    <TableCell align="right">R$ {transaction.amount.toFixed(2)}</TableCell>
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
