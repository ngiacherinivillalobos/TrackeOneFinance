import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { subcategoryService, type Subcategory } from '../services/subcategoryService';
import { categoryService, type Category } from '../services/categoryService';

export default function Subcategories() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState<Omit<Subcategory, 'id'>>({
    name: '',
    category_id: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading categories and subcategories...');
      const [subcategoriesData, categoriesData] = await Promise.all([
        subcategoryService.list(),
        categoryService.list()
      ]);
      console.log('Loaded subcategories:', subcategoriesData);
      console.log('Loaded categories:', categoriesData);
      setSubcategories(subcategoriesData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
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
    setEditingSubcategory(null);
    setFormData({ name: '', category_id: 0 });
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({ name: subcategory.name, category_id: subcategory.category_id });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      try {
        await subcategoryService.delete(id);
        await loadData();
      } catch (error: any) {
        console.error('Error deleting subcategory:', error);
        setError('Erro ao excluir subcategoria: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubcategory) {
        await subcategoryService.update(editingSubcategory.id!, formData);
      } else {
        await subcategoryService.create(formData);
      }
      await loadData();
      handleClose();
    } catch (error: any) {
      console.error('Error saving subcategory:', error);
      setError('Erro ao salvar subcategoria: ' + (error.response?.data?.error || error.message));
    }
  };

  // Função para obter o nome da categoria pelo ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Nova Subcategoria
        </Button>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subcategories.map((subcategory) => (
                <TableRow key={subcategory.id}>
                  <TableCell>{subcategory.name}</TableCell>
                  <TableCell>
                    {getCategoryName(subcategory.category_id)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(subcategory)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(subcategory.id!)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}</DialogTitle>
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
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.category_id}
                label="Categoria"
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
              >
                <MenuItem value={0} disabled>
                  Selecione uma categoria
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name} <span style={{ color: 'rgba(0, 0, 0, 0.6)', fontStyle: 'italic', fontSize: '0.85em', marginLeft: '8px' }}>({category.source_type})</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" color="primary" disabled={!formData.name || !formData.category_id}>
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}