# 📋 MANUAL DEFINITIVO - FUNCIONALIDADE DE RECORRÊNCIA

## 🚨 **ATENÇÃO: NUNCA MAIS PERDER ESTA FUNCIONALIDADE!**

### 🔧 **COMPONENTES CRÍTICOS QUE DEVEM SER MANTIDOS:**

#### **1. Estados no MonthlyControl.tsx (linhas ~140-180):**
```typescript
const [formData, setFormData] = useState({
  // ... outros campos ...
  is_recurring: false,
  recurrence_type: 'mensal' as 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual' | 'personalizada',
  recurrence_count: 1,
  recurrence_interval: 1,
  recurrence_weekday: 1,
  // ... outros campos ...
});

const [recurrencePreview, setRecurrencePreview] = useState<Array<{
  creation_date: string;
  due_date: string;
  description: string;
  amount: number;
}>>([]);
```

#### **2. useEffect para Preview (linha ~210):**
```typescript
useEffect(() => {
  if (formData.is_recurring && formData.transaction_date && formData.amount) {
    generateRecurrencePreview();
  } else {
    setRecurrencePreview([]);
  }
}, [formData.is_recurring, formData.recurrence_type, formData.recurrence_count, formData.recurrence_interval, formData.recurrence_weekday, formData.transaction_date, formData.amount, formData.description]);
```

#### **3. Função generateRecurrencePreview() (linhas ~215-275):**
```typescript
const generateRecurrencePreview = () => {
  if (!formData.transaction_date || !formData.amount || formData.recurrence_count < 1) {
    setRecurrencePreview([]);
    return;
  }

  const previews: Array<{...}> = [];
  
  // IMPORTANTE: Usar T12:00:00 para evitar problemas de timezone
  const baseDate = new Date(formData.transaction_date + 'T12:00:00');
  const amount = parseFloat(formData.amount.toString().replace(/\./g, '').replace(',', '.')) || parseFloat(formData.amount);

  for (let i = 0; i < formData.recurrence_count; i++) {
    let currentDate = new Date(baseDate);
    
    switch (formData.recurrence_type) {
      case 'semanal':
        if (i === 0) {
          currentDate = new Date(baseDate);
        } else {
          currentDate.setDate(baseDate.getDate() + (i * 7));
        }
        break;
      case 'mensal':
        currentDate.setMonth(baseDate.getMonth() + i);
        break;
      case 'anual':
        currentDate.setFullYear(baseDate.getFullYear() + i);
        break;
      case 'personalizada':
        currentDate.setDate(baseDate.getDate() + (i * (formData.recurrence_interval || 1)));
        break;
    }

    const formattedDate = currentDate.getFullYear() + '-' + 
                         String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(currentDate.getDate()).padStart(2, '0');

    previews.push({
      creation_date: formattedDate,
      due_date: formattedDate,
      description: formData.description || 'Nova transação',
      amount: amount
    });
  }

  setRecurrencePreview(previews);
};
```

#### **4. Campos no Modal (linhas ~1160-1280):**
```jsx
{/* Switches lado a lado */}
<Grid item xs={12}>
  <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
    <FormControlLabel
      control={
        <Switch
          checked={formData.is_recurring}
          onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
          color="primary"
        />
      }
      label="Transação Recorrente"
    />
    <FormControlLabel
      control={
        <Switch
          checked={formData.is_paid}
          onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
          color="success"
        />
      }
      label="Já foi pago/recebido?"
    />
  </Box>
</Grid>

{/* Campos de recorrência condicionais */}
{formData.is_recurring && (
  <Grid item xs={12}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Tipo de Recorrência</InputLabel>
          <Select
            value={formData.recurrence_type}
            onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
            label="Tipo de Recorrência"
          >
            <MenuItem value="semanal">Semanalmente</MenuItem>
            <MenuItem value="mensal">Mensalmente</MenuItem>
            <MenuItem value="anual">Anualmente</MenuItem>
            <MenuItem value="personalizada">A cada X dias</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      {/* Dia da Semana para Semanal */}
      {formData.recurrence_type === 'semanal' && (
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Dia da Semana</InputLabel>
            <Select
              value={formData.recurrence_weekday}
              onChange={(e) => setFormData(prev => ({ ...prev, recurrence_weekday: parseInt(e.target.value as string) }))}
              label="Dia da Semana"
            >
              <MenuItem value={1}>Segunda-feira</MenuItem>
              <MenuItem value={2}>Terça-feira</MenuItem>
              <MenuItem value={3}>Quarta-feira</MenuItem>
              <MenuItem value={4}>Quinta-feira</MenuItem>
              <MenuItem value={5}>Sexta-feira</MenuItem>
              <MenuItem value={6}>Sábado</MenuItem>
              <MenuItem value={0}>Domingo</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
      
      {/* Intervalo para Personalizada */}
      {formData.recurrence_type === 'personalizada' && (
        <Grid item xs={12} sm={4}>
          <TextField
            label="A cada quantos dias"
            type="number"
            value={formData.recurrence_interval || 1}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              setFormData(prev => ({ ...prev, recurrence_interval: Math.max(1, Math.min(365, value)) }));
            }}
            onBlur={(e) => {
              if (!e.target.value || parseInt(e.target.value) < 1) {
                setFormData(prev => ({ ...prev, recurrence_interval: 1 }));
              }
            }}
            fullWidth
            size="small"
            inputProps={{ min: 1, max: 365 }}
          />
        </Grid>
      )}
      
      {/* Quantidade de Vezes */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="Quantidade de Vezes"
          type="number"
          value={formData.recurrence_count}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            setFormData(prev => ({ ...prev, recurrence_count: Math.max(1, Math.min(60, value)) }));
          }}
          onBlur={(e) => {
            if (!e.target.value || parseInt(e.target.value) < 1) {
              setFormData(prev => ({ ...prev, recurrence_count: 1 }));
            }
          }}
          fullWidth
          size="small"
          inputProps={{ min: 1, max: 60 }}
        />
      </Grid>
    </Grid>
  </Grid>
)}
```

#### **5. Preview de Recorrências (linhas ~1285-1320):**
```jsx
{/* Preview de recorrências */}
{formData.is_recurring && recurrencePreview.length > 0 && (
  <Box sx={{ mt: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a365d' }}>
      Recorrências previstas
    </Typography>
    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data de criação</TableCell>
            <TableCell>Data de vencimento</TableCell>
            <TableCell>Lançamento</TableCell>
            <TableCell align="right">Valor (R$)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recurrencePreview.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(item.creation_date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>{new Date(item.due_date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell align="right">
                {item.amount.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
)}
```

#### **6. Submissão com Dados de Recorrência (linha ~440):**
```typescript
const transactionData = {
  // ... outros campos ...
  is_recurring: formData.is_recurring,
  recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
  recurrence_count: formData.is_recurring ? formData.recurrence_count : null,
  recurrence_interval: formData.is_recurring && formData.recurrence_type === 'personalizada' ? formData.recurrence_interval : null,
  recurrence_weekday: formData.is_recurring && formData.recurrence_type === 'semanal' ? formData.recurrence_weekday : null,
  // ... outros campos ...
};
```

### 🛡️ **PROBLEMAS RESOLVIDOS:**

1. **✅ Data de vencimento D-1**: Corrigido usando `T12:00:00` para evitar problemas de timezone
2. **✅ Campo quantidade não pode ser apagado**: Implementado `onBlur` que força valor mínimo 1
3. **✅ Campo intervalo protegido**: Mesma proteção para não permitir valores vazios
4. **✅ Preview funcional**: Cálculo correto das datas de recorrência
5. **✅ Validações**: Valores mínimos e máximos respeitados

### 🔄 **COMO TESTAR:**

1. Clique no FAB (+) e escolha tipo de transação
2. Preencha descrição, valor e data
3. Ative switch "Transação Recorrente"
4. Escolha tipo de recorrência
5. Configure parâmetros específicos
6. Verifique preview das datas
7. Salve e confirme criação

### 💾 **BACKUPS CRIADOS:**

- Projeto completo: `TrackeOneFinance_backup_[TIMESTAMP]_BEFORE_RECURRENCE_FIXES`
- Arquivo específico: `MonthlyControl_[TIMESTAMP]_WORKING.tsx`

### ⚠️ **NUNCA REMOVER:**

- Estados de recorrência no formData
- useEffect para preview
- Função generateRecurrencePreview
- Campos condicionais no modal
- Preview da tabela
- Validações dos campos numéricos

**🎯 SE ALGO QUEBRAR: RESTAURAR DO BACKUP E USAR ESTE MANUAL!**
