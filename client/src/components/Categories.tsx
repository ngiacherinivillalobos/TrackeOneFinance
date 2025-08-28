import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
import { Category, categoryService } from '../services/categoryService';
import { CategoryType, categoryTypeService } from '../services/categoryTypeService';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    source_type: ''
  });

  const loadData = async () => {
    try {
      const [categoriesData, typesData] = await Promise.all([
        categoryService.list(),
        categoryTypeService.list()
      ]);
      setCategories(categoriesData);
      setCategoryTypes(typesData);
    } catch (error) {
      console.error('Error loading data:', error);
      // TODO: Adicionar notificação de erro
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = () => {
    if (categoryTypes.length > 0) {
      setFormData(prev => ({ ...prev, source_type: categoryTypes[0].name }));
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', source_type: categoryTypes[0]?.name || '' });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, source_type: category.source_type });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await categoryService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
        // TODO: Adicionar notificação de erro
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id!, formData);
      } else {
        await categoryService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error) {
      console.error('Error saving category:', error);
      // TODO: Adicionar notificação de erro
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Nova Categoria
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.source_type}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(category)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id!)}>
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
          <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
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
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.source_type}
                label="Tipo"
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                required
              >
                {categoryTypes.map((type) => (
                  <MenuItem key={type.id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
