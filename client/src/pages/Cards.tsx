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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Card, cardService } from '../services/cardService';

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState<Omit<Card, 'id'>>({
    name: '',
    card_number: '',
    expiry_date: '',
    brand: ''
  });

  const loadData = async () => {
    try {
      const data = await cardService.list();
      setCards(data);
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
    setFormData({ name: '', card_number: '', expiry_date: '', brand: '' });
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      card_number: card.card_number || '',
      expiry_date: card.expiry_date || '',
      brand: card.brand || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
      try {
        await cardService.delete(id);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Novo Cartão
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Bandeira</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell>{card.name}</TableCell>
                <TableCell>{card.card_number ? `**** **** **** ${card.card_number.slice(-4)}` : '-'}</TableCell>
                <TableCell>{card.expiry_date || '-'}</TableCell>
                <TableCell>{card.brand || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(card)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(card.id!)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
    </div>
  );
}
