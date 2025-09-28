import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { colors } from '../theme/modernTheme';
import { Card, cardService } from '../services/cardService';

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState<Omit<Card, 'id'>>({
    name: '',
    card_number: '',
    expiry_date: '',
    brand: '',
    closing_day: undefined, // Sem valor padrão
    due_day: undefined // Sem valor padrão
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
      closing_day: undefined, // Sem valor padrão
      due_day: undefined // Sem valor padrão
    });
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      card_number: card.card_number || '',
      expiry_date: card.expiry_date || '',
      brand: card.brand || '',
      closing_day: card.closing_day, // Usar exatamente o valor do cartão
      due_day: card.due_day // Usar exatamente o valor do cartão
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
    
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? 'TOKEN_SET' : 'NO_TOKEN');
    
    if (!token) {
      alert('Você precisa estar logado para salvar um cartão');
      window.location.href = '/login';
      return;
    }
    
    try {
      console.log('Saving card data:', formData);
      console.log('Editing card:', editingCard);
      console.log('Token exists:', !!token);
      
      // Validar dados obrigatórios
      if (!formData.name || !formData.name.trim()) {
        alert('Nome do cartão é obrigatório');
        return;
      }
      
      if (!formData.card_number || !formData.card_number.trim()) {
        alert('Número do cartão é obrigatório');
        return;
      }
      
      if (!formData.expiry_date || !formData.expiry_date.trim()) {
        alert('Data de vencimento é obrigatória');
        return;
      }
      
      if (!formData.brand || !formData.brand.trim()) {
        alert('Bandeira do cartão é obrigatória');
        return;
      }
      
      if (!formData.closing_day || formData.closing_day < 1 || formData.closing_day > 31) {
        alert('Dia de fechamento é obrigatório (1-31)');
        return;
      }
      
      if (!formData.due_day || formData.due_day < 1 || formData.due_day > 31) {
        alert('Dia de vencimento é obrigatório (1-31)');
        return;
      }
      
      let result;
      if (editingCard) {
        console.log('Updating card with ID:', editingCard.id);
        result = await cardService.update(editingCard.id!, formData);
        console.log('Update result:', result);
      } else {
        console.log('Creating new card');
        result = await cardService.create(formData);
        console.log('Create result:', result);
      }
      
      await loadData();
      handleClose();
      console.log('Card saved successfully');
    } catch (error: any) {
      console.error('Error saving card:', error);
      
      // Log completo do erro para debug
      console.error('=== ERRO COMPLETO DEBUG ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error stack:', error.stack);
      console.error('=== FIM DEBUG ===');
      
      let errorMessage = 'Erro desconhecido';
      
      if (error.response) {
        // Erro da API
        console.error('API Error Response:', error.response);
        console.error('API Error Data:', error.response.data);
        
        if (error.response.status === 500) {
          console.error('Erro 500 - Detalhes completos:', {
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers,
            config: error.config
          });
          
          // Tentar extrair mensagem específica do erro 500
          if (error.response.data?.details) {
            console.error('Detalhes do backend:', error.response.data.details);
            if (error.response.data.details.includes('value too long')) {
              errorMessage = 'Número do cartão muito longo. Use no máximo 16 dígitos.';
            } else if (error.response.data.details.includes('character varying')) {
              errorMessage = 'Formato inválido no campo. Verifique os dados inseridos.';
            } else if (error.response.data.details.includes('column') && error.response.data.details.includes('does not exist')) {
              errorMessage = 'Erro de estrutura do banco. Entre em contato com suporte.';
            } else {
              errorMessage = `Erro no servidor: ${error.response.data.details}`;
            }
          } else if (error.response.data?.message) {
            errorMessage = `Erro no servidor: ${error.response.data.message}`;
          } else if (error.response.data?.error) {
            errorMessage = `Erro no servidor: ${error.response.data.error}`;
          } else {
            errorMessage = 'Erro interno do servidor. Aguarde alguns minutos e tente novamente.';
          }
        } else {
          errorMessage = error.response.data?.message || error.response.data?.error || `Erro ${error.response.status}`;
        }
        
        if (error.response.status === 401) {
          errorMessage = 'Sessão expirada. Redirecionando para login...';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert(errorMessage);
          window.location.href = '/login';
          return;
        } else if (error.response.status === 403) {
          errorMessage = 'Acesso negado';
        } else if (error.response.status === 404) {
          errorMessage = 'Recurso não encontrado';
        } else if (error.response.status >= 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns momentos.';
        }
      } else if (error.request) {
        // Erro de rede
        console.error('Network Error:', error.request);
        console.error('Request details:', {
          readyState: error.request.readyState,
          status: error.request.status,
          statusText: error.request.statusText,
          responseURL: error.request.responseURL
        });
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = 'Tempo esgotado. Verifique sua conexão e tente novamente.';
        } else if (error.request.status === 0) {
          errorMessage = 'Sem conexão com o servidor. Verifique sua internet.';
        } else {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        }
      } else {
        // Erro de configuração
        console.error('Request Setup Error:', error.message);
        errorMessage = error.message || 'Erro na configuração da requisição';
      }
      
      console.error('Error details:', {
        message: errorMessage,
        originalError: error,
        formData,
        editingCard
      });
      
      // Mostrar erro para o usuário
      alert(`Erro ao salvar cartão: ${errorMessage}`);
    }
  };

  return (
    <Box>
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

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome *"
              type="text"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Número do Cartão *"
              type="text"
              fullWidth
              value={formData.card_number}
              onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Data de Vencimento *"
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
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Dia de Fechamento *"
              type="number"
              fullWidth
              value={formData.closing_day || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir campo vazio ou valores numéricos válidos
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                  setFormData({ ...formData, closing_day: value === '' ? undefined : parseInt(value) });
                }
              }}
              inputProps={{
                min: 1,
                max: 31
              }}
              helperText="Dia do mês em que a fatura é fechada (1-31)"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Dia de Vencimento *"
              type="number"
              fullWidth
              value={formData.due_day || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Permitir campo vazio ou valores numéricos válidos
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                  setFormData({ ...formData, due_day: value === '' ? undefined : parseInt(value) });
                }
              }}
              inputProps={{
                min: 1,
                max: 31
              }}
              helperText="Dia do mês em que a fatura vence (1-31)"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Bandeira *"
              type="text"
              fullWidth
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
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