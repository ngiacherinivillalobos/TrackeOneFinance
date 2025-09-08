import React from 'react';
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
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'date' | 'email' | 'password';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  placeholder?: string;
  helperText?: string;
}

interface BaseFormProps {
  title: string;
  fields: FieldConfig[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelLabel?: string;
}

export function BaseForm({
  title,
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
  error = null,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
}: BaseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? `Editar ${title}` : `Novo ${title}`}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {fields.map((field) => (
              <Box key={field.name} sx={{ mb: 2 }}>
                {field.type === 'select' ? (
                  <FormControl fullWidth margin="dense" required={field.required}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      value={values[field.name] || ''}
                      label={field.label}
                      onChange={(e) => onChange(field.name, e.target.value)}
                      required={field.required}
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    autoFocus={field.name === fields[0].name}
                    margin="dense"
                    label={field.label}
                    type={field.type || 'text'}
                    fullWidth
                    value={values[field.name] || field.defaultValue || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                    helperText={field.helperText}
                  />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}