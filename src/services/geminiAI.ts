import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI - Fix API key handling
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
  console.error('Gemini API key is not properly configured');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export interface AIInsight {
  type: 'trend' | 'pattern' | 'anomaly' | 'recommendation' | 'summary';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  relatedColumns?: string[];
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GeminiAIService {
  private model: any;
  private chatHistory: AIChatMessage[] = [];

  constructor() {
    try {
      this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } catch (error) {
      console.error('Failed to initialize Gemini model:', error);
    }
  }

  // Fixed: Generate AI insights from dataset with better error handling and fallback
  async generateDataInsights(data: any[], columns: any[], datasetInfo: any): Promise<AIInsight[]> {
    // Check if API key is available
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('Gemini API not configured, using fallback insights');
      return this.generateFallbackInsights(data, columns, datasetInfo);
    }

    try {
      // Validate inputs
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid or empty data provided');
      }

      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        throw new Error('Invalid or empty columns provided');
      }

      // Prepare data summary for AI - Fixed the unused variable warning
      const dataSummary = this.prepareDataSummary(data, columns, datasetInfo);
      
      // Create a more focused prompt with better structure
      const prompt = `
        Analyze this dataset and provide exactly 5 insights in valid JSON format.
        
        Dataset: ${datasetInfo?.fileName || 'Unknown'}
        Rows: ${data.length}
        Columns: ${columns.length}
        
        Column Types:
        ${columns.map(col => `- ${col.name}: ${col.type}`).join('\n')}
        
        Data Summary:
        ${dataSummary}
        
        Sample Data (first 3 rows):
        ${JSON.stringify(data.slice(0, 3), null, 2)}
        
        Return ONLY a valid JSON array with exactly this structure:
        [
          {
            "type": "trend",
            "title": "Brief insight title",
            "description": "Detailed description of the insight",
            "confidence": 0.85,
            "actionable": true,
            "relatedColumns": ["column1"]
          }
        ]
        
        Focus on: data patterns, quality issues, business opportunities, visualization recommendations.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Enhanced parsing with better error handling
      const insights = this.parseAIResponse(text);
      
      if (insights.length === 0) {
        console.warn('No insights parsed from AI response, using fallback');
        return this.generateFallbackInsights(data, columns, datasetInfo);
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      console.log('Falling back to statistical insights');
      return this.generateFallbackInsights(data, columns, datasetInfo);
    }
  }

  // Enhanced: Generate fallback insights when AI is unavailable
  private generateFallbackInsights(data: any[], columns: any[], datasetInfo: any): AIInsight[] {
    const insights: AIInsight[] = [];
    
    try {
      // Dataset overview insight
      insights.push({
        type: 'summary',
        title: 'Dataset Overview',
        description: `This dataset contains ${data.length.toLocaleString()} records across ${columns.length} columns. The data appears to be well-structured with ${columns.filter(col => col.type === 'numeric').length} numeric columns for analysis.`,
        confidence: 0.9,
        actionable: false
      });

      // Data quality insight
      const missingValues = datasetInfo?.dataQuality?.missingValues || 0;
      const totalCells = data.length * columns.length;
      const qualityPercentage = ((1 - missingValues / totalCells) * 100).toFixed(1);
      
      insights.push({
        type: 'pattern',
        title: 'Data Quality Assessment',
        description: `Data quality is ${qualityPercentage}% with ${missingValues} missing values. ${missingValues === 0 ? 'Excellent data completeness!' : 'Consider data cleaning for missing values.'}`,
        confidence: 0.95,
        actionable: missingValues > 0
      });

      // Numeric columns insight
      const numericColumns = columns.filter(col => col.type === 'numeric');
      if (numericColumns.length > 0) {
        insights.push({
          type: 'recommendation',
          title: 'Statistical Analysis Opportunities',
          description: `Found ${numericColumns.length} numeric columns (${numericColumns.map(col => col.name).join(', ')}). These are excellent candidates for correlation analysis, trend detection, and statistical modeling.`,
          confidence: 0.8,
          actionable: true,
          relatedColumns: numericColumns.map(col => col.name)
        });
      }

      // Categorical columns insight
      const categoricalColumns = columns.filter(col => col.type === 'categorical');
      if (categoricalColumns.length > 0) {
        insights.push({
          type: 'recommendation',
          title: 'Categorical Data Insights',
          description: `Identified ${categoricalColumns.length} categorical columns for segmentation analysis. Consider creating distribution charts and cross-tabulations to understand category relationships.`,
          confidence: 0.75,
          actionable: true,
          relatedColumns: categoricalColumns.map(col => col.name)
        });
      }

      // Time series insight
      const dateColumns = columns.filter(col => col.type === 'datetime');
      if (dateColumns.length > 0) {
        insights.push({
          type: 'trend',
          title: 'Time Series Analysis Potential',
          description: `Detected ${dateColumns.length} date/time columns. This enables time series analysis, trend detection, and seasonal pattern identification. Consider creating time-based visualizations.`,
          confidence: 0.85,
          actionable: true,
          relatedColumns: dateColumns.map(col => col.name)
        });
      }

      // If we don't have enough insights, add a general recommendation
      if (insights.length < 3) {
        insights.push({
          type: 'recommendation',
          title: 'Data Exploration Recommendation',
          description: 'Start with basic exploratory data analysis: create histograms for numeric columns, bar charts for categorical data, and check for outliers and correlations.',
          confidence: 0.7,
          actionable: true
        });
      }

    } catch (error) {
      console.error('Error generating fallback insights:', error);
      // Return at least one basic insight
      insights.push({
        type: 'summary',
        title: 'Dataset Loaded Successfully',
        description: `Your dataset with ${data.length} records has been loaded successfully. Use the dashboard tools to explore and visualize your data.`,
        confidence: 1.0,
        actionable: true
      });
    }

    return insights.slice(0, 5); // Return max 5 insights
  }

  // Enhanced: Chat with AI about the dataset with better error handling
  async chatWithAI(message: string, data: any[], columns: any[], datasetInfo: any): Promise<string> {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return 'AI chat is not available. Please configure your Gemini API key in the environment variables.';
    }

    try {
      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Prepare context about the dataset
      const context = `
        You are a data analyst assistant. Answer questions about this dataset:
        
        Dataset: ${datasetInfo?.fileName || 'Unknown'}
        Records: ${data.length}
        Columns: ${columns.map(col => `${col.name}(${col.type})`).join(', ')}
        
        Recent conversation:
        ${this.chatHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Question: ${message}
        
        Provide a helpful, specific answer about the dataset. Reference actual column names and data when relevant.
      `;

      const result = await this.model.generateContent(context);
      const response = await result.response;
      const aiResponse = response.text();

      // Add AI response to history
      this.chatHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      return aiResponse;
    } catch (error) {
      console.error('Error chatting with AI:', error);
      return 'Sorry, I encountered an error while processing your request. Please try again or check your API configuration.';
    }
  }

  // Clear chat history
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // Get chat history
  getChatHistory(): AIChatMessage[] {
    return [...this.chatHistory]; // Return a copy
  }

  // Fixed: Prepare data summary for AI (removed unused variable warning)
  private prepareDataSummary(data: any[], columns: any[], datasetInfo: any): string {
    const numericColumns = columns.filter(col => col.type === 'numeric');
    const categoricalColumns = columns.filter(col => col.type === 'categorical');
    const dateColumns = columns.filter(col => col.type === 'datetime');

    // Calculate basic statistics for numeric columns
    const numericStats = numericColumns.map(col => {
      const values = data.map(row => row[col.name]).filter(val => val != null && !isNaN(val));
      if (values.length === 0) return `${col.name}: No valid numeric data`;
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return `${col.name}: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}`;
    });

    return `
Dataset Summary:
- Total Records: ${data.length}
- Numeric Columns: ${numericColumns.length} (${numericColumns.map(col => col.name).join(', ')})
- Categorical Columns: ${categoricalColumns.length} (${categoricalColumns.map(col => col.name).join(', ')})
- Date Columns: ${dateColumns.length} (${dateColumns.map(col => col.name).join(', ')})
- Missing Values: ${datasetInfo?.dataQuality?.missingValues || 'Unknown'}
- Duplicate Rows: ${datasetInfo?.dataQuality?.duplicateRows || 'Unknown'}

Numeric Statistics:
${numericStats.join('\n')}
    `;
  }

  // Enhanced: Parse AI response with better error handling
  private parseAIResponse(text: string): AIInsight[] {
    try {
      // Clean the response text
      const cleanText = text.trim();
      
      // Try to find JSON array in the response
      const jsonMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          // Validate each insight object
          return parsed.filter(insight => 
            insight.type && 
            insight.title && 
            insight.description &&
            typeof insight.confidence === 'number'
          ).map(insight => ({
            ...insight,
            confidence: Math.min(Math.max(insight.confidence, 0), 1), // Clamp between 0-1
            actionable: Boolean(insight.actionable)
          }));
        }
      }
      
      // Try to extract insights from structured text
      const lines = cleanText.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        return [{
          type: 'summary',
          title: 'AI Analysis Result',
          description: cleanText.substring(0, 300) + (cleanText.length > 300 ? '...' : ''),
          confidence: 0.7,
          actionable: false
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw AI response:', text);
      return [];
    }
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();