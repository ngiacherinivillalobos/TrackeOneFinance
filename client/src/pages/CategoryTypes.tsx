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
import { CategoryType, categoryTypeService } from '../services/categoryTypeService';

export default function CategoryTypes() {
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCategoryType, setEditingCategoryType] = useState<CategoryType | null>(null);
  const [formData, setFormData] = useState<Omit<CategoryType, 'id'>>({
    name: ''
  });

  const loadData = async () => {
    try {
      const data = await categoryTypeService.list();
      setCategoryTypes(data);
    } catch (error) {
      console.error('Error loading category types:', error);
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
    setEditingCategoryType(null);
    setFormData({ name: '' });
  };

  const handleEdit = (categoryType: CategoryType) => {
    setEditingCategoryType(categoryType);
    setFormData({ name: categoryType.name });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de registro?')) {
      try {
        await categoryTypeService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting category type:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoryType) {
        await categoryTypeService.update(editingCategoryType.id!, formData);
      } else {
        await categoryTypeService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving category type:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Novo Tipo de Registro
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryTypes.map((categoryType) => (
              <TableRow key={categoryType.id}>
                <TableCell>{categoryType.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(categoryType)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(categoryType.id!)}>
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
          <DialogTitle>{editingCategoryType ? 'Editar Tipo de Registro' : 'Novo Tipo de Registro'}</DialogTitle>
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
