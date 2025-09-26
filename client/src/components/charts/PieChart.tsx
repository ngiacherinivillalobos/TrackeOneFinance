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

// Cores padrão para os gráficos
const DEFAULT_COLORS = [
  colors.primary[500],
  colors.secondary[500],
  colors.warning[500],
  colors.error[500],
  colors.success[500],
  colors.gray[400],
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
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
  // Adicionar cores aos dados se não tiverem
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }));

  if (loading) {
    return (
      <Card sx={{ 
        height: height + 120,
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
        height: height + 120,
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
      height: height + 120
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
              <Legend
                verticalAlign="bottom"
                height={60}
                wrapperStyle={{
                  fontSize: '10px',
                  color: colors.gray[500],
                  paddingTop: '4px',
                  lineHeight: '1.2'
                }}
                formatter={(value: string, entry: any) => {
                  const amount = entry.payload?.value || 0;
                  const formattedAmount = amount.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  });
                  return `${value} R$ ${formattedAmount}`;
                }}
                iconType="circle"
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}