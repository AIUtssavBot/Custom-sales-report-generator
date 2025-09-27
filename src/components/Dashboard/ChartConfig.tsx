import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  title: string;
  xAxis: string;
  yAxis: string[];
  colorBy?: string;
  showLegend: boolean;
  showGrid: boolean;
}

interface ChartConfigProps {
  columns: Array<{ name: string; type: string }>;
  onAddChart: (config: ChartConfig) => void;
  onClose: () => void;
}

const chartTypes = [
  { type: 'bar', label: 'Bar Chart', icon: <BarChartIcon />, color: '#1976d2' },
  { type: 'line', label: 'Line Chart', icon: <LineChartIcon />, color: '#388e3c' },
  { type: 'pie', label: 'Pie Chart', icon: <PieChartIcon />, color: '#f57c00' },
  { type: 'scatter', label: 'Scatter Plot', icon: <ScatterPlotIcon />, color: '#7b1fa2' },
  { type: 'area', label: 'Area Chart', icon: <TimelineIcon />, color: '#d32f2f' },
];

const ChartConfig: React.FC<ChartConfigProps> = ({ columns, onAddChart, onClose }) => {
  const [chartType, setChartType] = useState<string>('bar');
  const [title, setTitle] = useState<string>('');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string[]>([]);
  const [colorBy, setColorBy] = useState<string>('');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const numericColumns = columns.filter(col => col.type === 'numeric');
  const categoricalColumns = columns.filter(col => col.type === 'categorical' || col.type === 'text');

  const handleAddChart = () => {
    if (!title || !xAxis || yAxis.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const config: ChartConfig = {
      id: `chart_${Date.now()}`,
      type: chartType as any,
      title,
      xAxis,
      yAxis,
      colorBy: colorBy || undefined,
      showLegend,
      showGrid
    };

    onAddChart(config);
    onClose();
  };

  const handleYAxisChange = (value: string) => {
    if (yAxis.includes(value)) {
      setYAxis(yAxis.filter(item => item !== value));
    } else {
      setYAxis([...yAxis, value]);
    }
  };

  return (
    <Paper elevation={8} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Configure Chart</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {/* Chart Type Selection */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Chart Type</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {chartTypes.map((type) => (
              <Chip
                key={type.type}
                icon={type.icon}
                label={type.label}
                onClick={() => setChartType(type.type)}
                color={chartType === type.type ? 'primary' : 'default'}
                variant={chartType === type.type ? 'filled' : 'outlined'}
                sx={{ 
                  borderColor: type.color,
                  '&:hover': { backgroundColor: `${type.color}20` }
                }}
              />
            ))}
          </Box>
        </Grid>

        {/* Chart Title */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Chart Title</InputLabel>
            <Select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              label="Chart Title"
            >
              <MenuItem value="Sales Analysis">Sales Analysis</MenuItem>
              <MenuItem value="Revenue Trends">Revenue Trends</MenuItem>
              <MenuItem value="Data Distribution">Data Distribution</MenuItem>
              <MenuItem value="Performance Metrics">Performance Metrics</MenuItem>
              <MenuItem value="Custom Chart">Custom Chart</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* X-Axis Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>X-Axis</InputLabel>
            <Select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              label="X-Axis"
            >
              {categoricalColumns.map((col) => (
                <MenuItem key={col.name} value={col.name}>
                  {col.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Y-Axis Selection */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Y-Axis (Select multiple)</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {numericColumns.map((col) => (
              <Chip
                key={col.name}
                label={col.name}
                onClick={() => handleYAxisChange(col.name)}
                color={yAxis.includes(col.name) ? 'primary' : 'default'}
                variant={yAxis.includes(col.name) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Grid>

        {/* Color By (Optional) */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Color By (Optional)</InputLabel>
            <Select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value)}
              label="Color By (Optional)"
            >
              <MenuItem value="">None</MenuItem>
              {categoricalColumns.map((col) => (
                <MenuItem key={col.name} value={col.name}>
                  {col.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Chart Options */}
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Show Legend</InputLabel>
            <Select
              value={showLegend ? 'true' : 'false'}
              onChange={(e) => setShowLegend(e.target.value === 'true')}
              label="Show Legend"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Show Grid</InputLabel>
            <Select
              value={showGrid ? 'true' : 'false'}
              onChange={(e) => setShowGrid(e.target.value === 'true')}
              label="Show Grid"
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleAddChart} variant="contained">
              Add Chart
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ChartConfig;
