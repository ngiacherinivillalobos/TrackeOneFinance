import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { colors } from '../theme/modernTheme';
import { Card, cardService } from '../services/cardService';
import CardTransactions from '../components/CardTransactions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cards-tabpanel-${index}`}
      aria-labelledby={`cards-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<Omit<Card, 'id'>>({
    name: '',
    card_number: '',
    expiry_date: '',
    brand: '',
    closing_day: 15, // Valor padrão
    due_day: 10 // Valor padrão
  });

  const loadData = async () => {
    try {
      const data = await cardService.list();
      setCards(data);
      
      // Se não há cartão selecionado e há cartões disponíveis, seleciona o primeiro
      if (!selectedCard && data.length > 0) {
        setSelectedCard(data[0]);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCard(null);
    setFormData({ 
      name: '', 
      card_number: '', 
      expiry_date: '', 
      brand: '',
      closing_day: 15, // Valor padrão
      due_day: 10 // Valor padrão
    });
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      card_number: card.card_number || '',
      expiry_date: card.expiry_date || '',
      brand: card.brand || '',
      closing_day: card.closing_day || 15, // Usar o valor do cartão ou padrão
      due_day: card.due_day || 10 // Usar o valor do cartão ou padrão
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
      try {
        await cardService.delete(id);
        
        // Se o cartão excluído era o selecionado, limpar a seleção
        if (selectedCard?.id === id) {
          setSelectedCard(undefined);
        }
        
        await loadData();
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await cardService.update(editingCard.id!, formData);
      } else {
        await cardService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setTabValue(1); // Muda para a aba de transações
  };

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            icon={<CreditCardIcon />} 
            label="Cartões" 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<ReceiptIcon />} 
            label="Transações" 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
            disabled={!selectedCard}
          />
        </Tabs>
      </Box>

      {/* Tab Panel - Cartões */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Gerenciar Cartões
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Novo Cartão
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.gray[50] }}>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vencimento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bandeira</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vence</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cards.map((card) => (
                <TableRow 
                  key={card.id} 
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: selectedCard?.id === card.id ? colors.primary[50] : 'inherit',
                    '&:hover': {
                      bgcolor: selectedCard?.id === card.id ? colors.primary[100] : colors.gray[50]
                    }
                  }}
                  onClick={() => handleCardSelect(card)}
                >
                  <TableCell>{card.name}</TableCell>
                  <TableCell>{card.card_number ? `**** **** **** ${card.card_number.slice(-4)}` : '-'}</TableCell>
                  <TableCell>{card.expiry_date || '-'}</TableCell>
                  <TableCell>{card.brand || '-'}</TableCell>
                  <TableCell>{card.closing_day || '-'}</TableCell>
                  <TableCell>{card.due_day || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(card);
                      }}
                      sx={{ color: colors.primary[600] }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(card.id!);
                      }}
                      sx={{ color: colors.error[600] }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {cards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Nenhum cartão cadastrado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab Panel - Transações */}
      <TabPanel value={tabValue} index={1}>
        <CardTransactions selectedCard={selectedCard} />
      </TabPanel>

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome"
              type="text"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Número do Cartão"
              type="text"
              fullWidth
              value={formData.card_number}
              onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Data de Vencimento"
              type="text"
              placeholder="MM/AAAA"
              fullWidth
              value={formData.expiry_date}
              onChange={(e) => {
                // Formatação automática para MM/AAAA
                let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
                if (value.length >= 2) {
                  value = value.substring(0, 2) + '/' + value.substring(2, 6);
                }
                setFormData({ ...formData, expiry_date: value });
              }}
              inputProps={{
                maxLength: 7, // MM/AAAA = 7 caracteres
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Dia de Fechamento"
              type="number"
              fullWidth
              value={formData.closing_day}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir campo vazio ou valores numéricos válidos
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                  setFormData({ ...formData, closing_day: value === '' ? 15 : parseInt(value) });
                }
              }}
              inputProps={{
                min: 1,
                max: 31
              }}
              helperText="Dia do mês em que a fatura é fechada (1-31)"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Dia de Vencimento"
              type="number"
              fullWidth
              value={formData.due_day}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir campo vazio ou valores numéricos válidos
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                  setFormData({ ...formData, due_day: value === '' ? 10 : parseInt(value) });
                }
              }}
              inputProps={{
                min: 1,
                max: 31
              }}
              helperText="Dia do mês em que a fatura vence (1-31)"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Bandeira"
              type="text"
              fullWidth
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}