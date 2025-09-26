import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { colors } from '../../theme/modernTheme';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
  height?: number;
  loading?: boolean;
}

// Cores padrão para os gráficos - do valor mais alto ao mais baixo
const DEFAULT_COLORS = [
  '#be1704', // Valor mais alto - vermelho escuro
  '#ef3620', // Segundo maior - vermelho médio
  '#fa6351', // Terceiro maior - vermelho claro
  '#f7a40c', // Quarto maior - laranja
  '#f7bd53', // Valor mais baixo - laranja claro
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Box sx={{
        bgcolor: 'white',
        p: 1.5,
        borderRadius: 1,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: `1px solid ${colors.gray[200]}`
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700] }}>
          {data.name}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.gray[600] }}>
          R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function PieChart({ title, data, height = 300, loading = false }: PieChartProps) {
  // Ordenar dados do maior para o menor valor - forçar ordenação numérica
  const sortedData = [...(data || [])].sort((a, b) => Number(b.value) - Number(a.value));
  
  console.log(`Dados recebidos para ${title}:`, data);
  console.log(`Dados ordenados para ${title}:`, sortedData);
  
  // Adicionar cores aos dados se não tiverem
  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }));

  if (loading) {
    return (
      <Card sx={{ 
        height: height + 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${colors.gray[200]}`
      }}>
        <Typography variant="body2" color="text.secondary">
          Carregando dados...
        </Typography>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ 
        height: height + 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${colors.gray[200]}`
      }}>
        <Typography variant="body2" color="text.secondary">
          Nenhum dado disponível
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      border: `1px solid ${colors.gray[200]}`,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      height: height + 140
    }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: colors.gray[700],
            textAlign: 'center',
            fontSize: '1rem'
          }}
        >
          {title}
        </Typography>
        
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius="70%"
                paddingAngle={2}
                dataKey="value"
              >
                {dataWithColors.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Legenda customizada que mantém a ordem */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          gap: 1,
          pt: 2,
          fontSize: '11px',
          color: colors.gray[600]
        }}>
          {dataWithColors.map((item, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              mb: 0.5
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: item.color
              }} />
              <Typography variant="caption" sx={{ fontSize: '11px', lineHeight: 1.4 }}>
                {item.name} R$ {item.value.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}