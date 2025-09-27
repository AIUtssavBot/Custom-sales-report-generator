import React from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area
} from 'recharts';

interface DynamicChartProps {
  config: {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    title: string;
    xAxis: string;
    yAxis: string[];
    colorBy?: string;
    showLegend: boolean;
    showGrid: boolean;
  };
  data: any[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const DynamicChart: React.FC<DynamicChartProps> = ({ config, data, onDelete, onEdit }) => {
  const processData = () => {
    if (!data || data.length === 0) return [];

    if (config.type === 'pie') {
      const valueCounts: Record<string, number> = {};
      data.forEach(row => {
        const value = row[config.xAxis] || 'Unknown';
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });
      
      return Object.entries(valueCounts).slice(0, 10).map(([name, value]) => ({
        name,
        value
      }));
    }

    if (config.type === 'scatter') {
      return data.slice(0, 100).map((row, index) => {
        const dataPoint: any = { index };
        config.yAxis.forEach((yAxis, i) => {
          dataPoint[yAxis] = Number(row[yAxis]) || 0;
        });
        if (config.colorBy) {
          dataPoint[config.colorBy] = row[config.colorBy];
        }
        return dataPoint;
      });
    }

    // For bar, line, and area charts
    const groupedData: Record<string, any> = {};
    
    data.forEach(row => {
      const xValue = row[config.xAxis] || 'Unknown';
      if (!groupedData[xValue]) {
        groupedData[xValue] = { [config.xAxis]: xValue };
      }
      
      config.yAxis.forEach(yAxis => {
        const value = Number(row[yAxis]) || 0;
        if (groupedData[xValue][yAxis]) {
          groupedData[xValue][yAxis] += value;
        } else {
          groupedData[xValue][yAxis] = value;
        }
      });
    });

    return Object.values(groupedData).slice(0, 20);
  };

  const chartData = processData();

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <RechartsTooltip />
            {config.showLegend && <Legend />}
            {config.yAxis.map((yAxis, index) => (
              <Bar 
                key={yAxis} 
                dataKey={yAxis} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <RechartsTooltip />
            {config.showLegend && <Legend />}
            {config.yAxis.map((yAxis, index) => (
              <Line 
                key={yAxis}
                type="monotone" 
                dataKey={yAxis} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <RechartsTooltip />
            {config.showLegend && <Legend />}
            {config.yAxis.map((yAxis, index) => (
              <Area 
                key={yAxis}
                type="monotone" 
                dataKey={yAxis} 
                stackId="1"
                stroke={COLORS[index % COLORS.length]} 
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            {config.showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={config.yAxis[0] || 'x'} />
            <YAxis dataKey={config.yAxis[1] || 'y'} />
            <RechartsTooltip />
            {config.showLegend && <Legend />}
            <Scatter 
              dataKey={config.yAxis[1] || 'y'} 
              fill={COLORS[0]} 
            />
          </ScatterChart>
        );

      default:
        return <Typography>Unsupported chart type</Typography>;
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {config.title}
        </Typography>
        <Box>
          <Tooltip title="Edit Chart">
            <IconButton onClick={() => onEdit(config.id)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Chart">
            <IconButton onClick={() => onDelete(config.id)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DynamicChart;
