import React from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface Category {
  id: number;
  name: string;
  source_type: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

interface Contact {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
  number?: string;
}

interface PaymentStatus {
  id: number;
  name: string;
}

interface Filters {
  transaction_type: string[];
  payment_status_id: string[];
  category_id: string[];
  subcategory_id: string;
  contact_id: string[];
  cost_center_id: string[];
}

interface FiltersSectionProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  categories: Category[];
  subcategories: Subcategory[];
  contacts: Contact[];
  costCenters: CostCenter[];
  paymentStatuses: PaymentStatus[];
  handleClearFilters: () => void;
  moreFiltersOpen: boolean;
  setMoreFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  filters,
  setFilters,
  categories,
  subcategories,
  contacts,
  costCenters,
  paymentStatuses,
  handleClearFilters,
  moreFiltersOpen,
  setMoreFiltersOpen
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleFilterChange = (filterKey: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 2, 
      mb: 3,
    }}>
      {/* Filtros principais */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isSmallScreen ? 'column' : 'row', 
        gap: 2, 
        flexWrap: 'wrap'
      }}>
        {/* Tipo de Transação */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            multiple
            value={filters.transaction_type}
            onChange={(e) => handleFilterChange('transaction_type', e.target.value as string[])}
            input={<OutlinedInput label="Tipo" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {['Despesa', 'Receita', 'Investimento'].map((type) => (
              <MenuItem key={type} value={type}>
                <Checkbox checked={filters.transaction_type.indexOf(type) > -1} />
                <ListItemText primary={type} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status de Pagamento */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filters.payment_status_id}
            onChange={(e) => handleFilterChange('payment_status_id', e.target.value as string[])}
            input={<OutlinedInput label="Status" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const status = paymentStatuses.find(s => s.id.toString() === value);
                  return (
                    <Chip key={value} label={status?.name || value} size="small" />
                  );
                })}
              </Box>
            )}
          >
            {paymentStatuses.map((status) => (
              <MenuItem key={status.id} value={status.id.toString()}>
                <Checkbox checked={filters.payment_status_id.indexOf(status.id.toString()) > -1} />
                <ListItemText primary={status.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Categoria */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            multiple
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value as string[])}
            input={<OutlinedInput label="Categoria" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const category = categories.find(c => c.id.toString() === value);
                  return (
                    <Chip key={value} label={category?.name || value} size="small" />
                  );
                })}
              </Box>
            )}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id.toString()}>
                <Checkbox checked={filters.category_id.indexOf(category.id.toString()) > -1} />
                <ListItemText primary={category.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botões de ação */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            Limpar
          </Button>
          <IconButton
            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            size="small"
          >
            <ExpandMoreIcon 
              sx={{ 
                transform: moreFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} 
            />
          </IconButton>
        </Box>
      </Box>

      {/* Filtros adicionais (expansíveis) */}
      {moreFiltersOpen && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isSmallScreen ? 'column' : 'row', 
          gap: 2, 
          flexWrap: 'wrap',
          p: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          bgcolor: 'rgba(0, 0, 0, 0.02)'
        }}>
          {/* Subcategoria */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Subcategoria</InputLabel>
            <Select
              value={filters.subcategory_id}
              onChange={(e) => handleFilterChange('subcategory_id', e.target.value)}
              input={<OutlinedInput label="Subcategoria" />}
            >
              <MenuItem value="">
                <em>Todas</em>
              </MenuItem>
              {subcategories.map((subcategory) => (
                <MenuItem key={subcategory.id} value={subcategory.id.toString()}>
                  {subcategory.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Contato */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Contato</InputLabel>
            <Select
              multiple
              value={filters.contact_id}
              onChange={(e) => handleFilterChange('contact_id', e.target.value as string[])}
              input={<OutlinedInput label="Contato" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const contact = contacts.find(c => c.id.toString() === value);
                    return (
                      <Chip key={value} label={contact?.name || value} size="small" />
                    );
                  })}
                </Box>
              )}
            >
              {contacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id.toString()}>
                  <Checkbox checked={filters.contact_id.indexOf(contact.id.toString()) > -1} />
                  <ListItemText primary={contact.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Centro de Custo */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Centro de Custo</InputLabel>
            <Select
              multiple
              value={filters.cost_center_id}
              onChange={(e) => handleFilterChange('cost_center_id', e.target.value as string[])}
              input={<OutlinedInput label="Centro de Custo" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const costCenter = costCenters.find(cc => cc.id.toString() === value);
                    return (
                      <Chip 
                        key={value} 
                        label={costCenter ? (costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name) : value} 
                        size="small" 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {costCenters.map((costCenter) => (
                <MenuItem key={costCenter.id} value={costCenter.id.toString()}>
                  <Checkbox checked={filters.cost_center_id.indexOf(costCenter.id.toString()) > -1} />
                  <ListItemText 
                    primary={costCenter.number ? `${costCenter.number} - ${costCenter.name}` : costCenter.name} 
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
};