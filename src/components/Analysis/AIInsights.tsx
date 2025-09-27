import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { AIInsight } from '../../services/geminiAI';

interface AIInsightsProps {
  insights: AIInsight[];
  loading: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights, loading }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUpIcon color="primary" />;
      case 'pattern':
        return <PsychologyIcon color="secondary" />;
      case 'anomaly':
        return <WarningIcon color="warning" />;
      case 'recommendation':
        return <LightbulbIcon color="success" />;
      default:
        return <AssessmentIcon color="info" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'primary';
      case 'pattern':
        return 'secondary';
      case 'anomaly':
        return 'warning';
      case 'recommendation':
        return 'success';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI-Powered Insights
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              AI is analyzing your data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <PsychologyIcon color="primary" />
          <Typography variant="h6">AI-Powered Insights</Typography>
          <Chip label={`${insights.length} insights`} size="small" color="primary" />
        </Box>

        <Grid container spacing={2}>
          {insights.map((insight, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  height: '100%',
                  borderLeft: 4,
                  borderLeftColor: `${getInsightColor(insight.type)}.main`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getInsightIcon(insight.type)}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {insight.title}
                  </Typography>
                  <Chip
                    label={insight.type}
                    size="small"
                    color={getInsightColor(insight.type) as any}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {insight.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Confidence:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={insight.confidence * 100}
                      sx={{ width: 60, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(insight.confidence * 100)}%
                    </Typography>
                  </Box>

                  {insight.actionable && (
                    <Chip
                      label="Actionable"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>

                {insight.relatedColumns && insight.relatedColumns.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Related Columns:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {insight.relatedColumns.map((column, idx) => (
                        <Chip
                          key={idx}
                          label={column}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
