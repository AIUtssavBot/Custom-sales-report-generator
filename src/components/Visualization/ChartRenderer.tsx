import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ChartConfig } from '../../types';

interface ChartRendererProps {
  config: ChartConfig;
  data: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ChartRenderer: React.FC<ChartRendererProps> = ({ config, data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  // Filter out data points with missing values for the selected axes
  const filteredData = data.filter(item => {
    if (!config.xAxis || !item) return false;
    
    const xAxisValue = item[config.xAxis as keyof typeof item];
    
    if (xAxisValue === undefined || xAxisValue === null) return false;
    
    if (config.type === 'pie') return true;
    
    if (!config.yAxis) return false;
    
    const yAxisValue = item[config.yAxis as keyof typeof item];
    return yAxisValue !== undefined && yAxisValue !== null;
  });

  if (filteredData.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No valid data for selected axes</Typography>
      </Box>
    );
  }

  switch (config.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis as string} name={config.xAxis as string} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={config.yAxis as string} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis as string} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={config.yAxis as string} stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    
    case 'pie':
      // For pie charts, we need to aggregate data by the xAxis value
      const pieData = Object.entries(
        filteredData.reduce((acc: Record<string, number>, item) => {
          if (!config.xAxis) return acc;
          const key = String(item[config.xAxis as keyof typeof item]);
          const value = config.yAxis 
            ? Number(item[config.yAxis as keyof typeof item] || 1) 
            : 1; // If no yAxis specified, count occurrences
          acc[key] = (acc[key] || 0) + value;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={(props: any) => {
                const name = props.name;
                const percent = props.percent || (props.value / props.payload?.value) || 0;
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    
    case 'scatter':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey={config.xAxis as string} name={config.xAxis as string} />
            <YAxis type="number" dataKey={config.yAxis as string} name={config.yAxis as string} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={`${config.xAxis} vs ${config.yAxis}`} data={filteredData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    
    default:
      return (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">Unsupported chart type: {config.type}</Typography>
        </Box>
      );
  }
};

export default ChartRenderer;