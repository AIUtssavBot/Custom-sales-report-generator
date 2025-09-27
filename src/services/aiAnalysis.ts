import { DataColumn, DatasetInfo } from '../types';

interface Trend {
  dateColumn: string;
  valueColumn: string;
  trendDirection: string;
  percentChange: string;
  seasonality: boolean;
}

interface Correlation {
  columns: string[];
  strength: number;
  direction: string;
}

interface Insight {
  timeTrends: Trend[];
  correlations: Correlation[];
  outliers: Record<string, any>;
  recommendations: Array<{
    type: string;
    message: string;
  }>;
}

/**
 * AI Analysis Service
 * Provides intelligent insights and pattern recognition for datasets
 */

// Detect trends in time series data
export const detectTimeTrends = (data: any[], dateColumn: string, valueColumn: string): any => {
  if (!data || data.length < 5) return null;

  try {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a[dateColumn]);
      const dateB = new Date(b[dateColumn]);
      return dateA.getTime() - dateB.getTime();
    });

    // Extract values for analysis
    const values = sortedData.map(item => Number(item[valueColumn]));
    
    // Calculate moving average (3-point)
    const movingAvg = values.map((val, idx, arr) => {
      if (idx < 1 || idx >= arr.length - 1) return null;
      return (arr[idx - 1] + val + arr[idx + 1]) / 3;
    });

    // Detect trend direction
    let trendDirection = 'stable';
    const firstQuarter = values.slice(0, Math.floor(values.length / 4));
    const lastQuarter = values.slice(Math.floor(values.length * 3 / 4));
    
    const firstAvg = firstQuarter.reduce((sum, val) => sum + val, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, val) => sum + val, 0) / lastQuarter.length;
    
    const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    if (percentChange > 10) trendDirection = 'increasing';
    else if (percentChange < -10) trendDirection = 'decreasing';

    // Detect seasonality (simple approach)
    let seasonality = false;
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i-1]);
    }
    
    // Check for alternating signs in differences (simple seasonality check)
    let signChanges = 0;
    for (let i = 1; i < diffs.length; i++) {
      if ((diffs[i] > 0 && diffs[i-1] < 0) || (diffs[i] < 0 && diffs[i-1] > 0)) {
        signChanges++;
      }
    }
    
    if (signChanges > diffs.length * 0.4) {
      seasonality = true;
    }

    return {
      trendDirection,
      percentChange: percentChange.toFixed(2),
      seasonality,
      movingAverage: movingAvg.filter(val => val !== null)
    };
  } catch (error) {
    console.error("Error detecting time trends:", error);
    return null;
  }
};

// Find correlations between columns
export const findCorrelations = (data: any[], columns: Record<string, DataColumn>): any[] => {
  if (!data || data.length === 0) return [];
  
  const numericColumns = Object.values(columns).filter(col => col.type === 'numeric');
  const correlations = [];
  
  // For each pair of numeric columns
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i].name;
      const col2 = numericColumns[j].name;
      
      // Extract values, filtering out missing data
      const pairs = data.filter(row => 
        row[col1] !== null && row[col1] !== undefined && 
        row[col2] !== null && row[col2] !== undefined
      ).map(row => ({
        x: Number(row[col1]),
        y: Number(row[col2])
      }));
      
      if (pairs.length < 5) continue; // Skip if not enough data points
      
      // Calculate Pearson correlation coefficient
      const n = pairs.length;
      const sumX = pairs.reduce((sum, pair) => sum + pair.x, 0);
      const sumY = pairs.reduce((sum, pair) => sum + pair.y, 0);
      const sumXY = pairs.reduce((sum, pair) => sum + pair.x * pair.y, 0);
      const sumX2 = pairs.reduce((sum, pair) => sum + pair.x * pair.x, 0);
      const sumY2 = pairs.reduce((sum, pair) => sum + pair.y * pair.y, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      if (denominator === 0) continue; // Skip if division by zero
      
      const correlation = numerator / denominator;
      
      // Only include significant correlations
      if (Math.abs(correlation) > 0.5) {
        correlations.push({
          columns: [col1, col2],
          correlation: correlation.toFixed(2),
          strength: Math.abs(correlation) > 0.8 ? 'strong' : 'moderate',
          direction: correlation > 0 ? 'positive' : 'negative'
        });
      }
    }
  }
  
  // Sort by correlation strength (absolute value)
  return correlations.sort((a, b) => Math.abs(Number(b.correlation)) - Math.abs(Number(a.correlation)));
};

// Identify outliers in numeric columns
export const identifyOutliers = (data: any[], columns: Record<string, DataColumn>): any => {
  const outlierInfo: Record<string, any> = {};
  
  Object.values(columns)
    .filter(col => col.type === 'numeric')
    .forEach(column => {
      const colName = column.name;
      const values = data
        .map(row => row[colName])
        .filter(val => val !== null && val !== undefined)
        .map(val => Number(val));
      
      if (values.length < 5) return; // Skip if not enough data
      
      // Calculate quartiles and IQR
      const sorted = [...values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      
      // Define outlier boundaries
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      // Find outliers
      const outliers = data.filter(row => {
        const val = Number(row[colName]);
        return val < lowerBound || val > upperBound;
      });
      
      if (outliers.length > 0) {
        outlierInfo[colName] = {
          count: outliers.length,
          percentage: ((outliers.length / data.length) * 100).toFixed(2),
          boundaries: { lower: lowerBound, upper: upperBound },
          examples: outliers.slice(0, 5) // First 5 examples
        };
      }
    });
  
  return outlierInfo;
};

// Generate insights and recommendations
export const generateInsights = (data: any[], datasetInfo: DatasetInfo): Insight => {
  if (!data || data.length === 0 || !datasetInfo) {
    return {
      timeTrends: [],
      correlations: [],
      outliers: {},
      recommendations: []
    };
  }
  
  const insights: Insight = {
    timeTrends: [],
    correlations: [],
    outliers: {},
    recommendations: []
  };
  
  // Find date columns
  const dateColumns = Object.values(datasetInfo.columns)
    .filter(col => col.type === 'datetime')
    .map(col => col.name);
  
  // Find numeric columns
  const numericColumns = Object.values(datasetInfo.columns)
    .filter(col => col.type === 'numeric')
    .map(col => col.name);
  
  // Find correlations
  insights.correlations = findCorrelations(data, Object.fromEntries(
    datasetInfo.columns.map(col => [col.name, col])
  ));
  
  // Find time trends if date columns exist
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    dateColumns.forEach(dateCol => {
      numericColumns.forEach(numCol => {
        const trend = detectTimeTrends(data, dateCol, numCol);
        if (trend) {
          insights.timeTrends.push({
            dateColumn: dateCol,
            valueColumn: numCol,
            ...trend
          });
        }
      });
    });
  }
  
  // Find outliers
  insights.outliers = identifyOutliers(data, Object.fromEntries(
    datasetInfo.columns.map(col => [col.name, col])
  ));
  
  // Generate recommendations
  if (insights.correlations.length > 0) {
    insights.recommendations.push({
      type: 'correlation',
      message: `Consider creating a scatter plot to visualize the strong correlation between ${insights.correlations[0].columns[0]} and ${insights.correlations[0].columns[1]}.`
    });
  }
  
  if (insights.timeTrends.length > 0) {
    const significantTrend = insights.timeTrends.find(trend => 
      Math.abs(parseFloat(trend.percentChange)) > 20
    );
    
    if (significantTrend) {
      insights.recommendations.push({
        type: 'trend',
        message: `There's a significant ${significantTrend.trendDirection} trend (${significantTrend.percentChange}%) in ${significantTrend.valueColumn} over time. Consider creating a line chart with moving averages to visualize this trend.`
      });
    }
    
    // Add recommendation for seasonal data if detected
    const seasonalTrend = insights.timeTrends.find(trend => trend.seasonality);
    if (seasonalTrend) {
      insights.recommendations.push({
        type: 'seasonality',
        message: `Seasonal patterns detected in ${seasonalTrend.valueColumn}. Consider decomposing the time series to analyze seasonal components.`
      });
    }
  }
  
  const columnsWithOutliers = Object.keys(insights.outliers);
  if (columnsWithOutliers.length > 0) {
    insights.recommendations.push({
      type: 'outliers',
      message: `${columnsWithOutliers.join(', ')} contain${columnsWithOutliers.length === 1 ? 's' : ''} significant outliers. Consider using box plots to visualize the distribution.`
    });
  }
  
  return insights;
};

// Main function to analyze dataset
export const analyzeDataset = (data: any[], datasetInfo: DatasetInfo): any => {
  return {
    insights: generateInsights(data, datasetInfo),
    timestamp: new Date().toISOString()
  };
};