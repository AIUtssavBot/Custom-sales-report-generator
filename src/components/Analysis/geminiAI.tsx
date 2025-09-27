import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with proper error handling
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
  console.warn('Gemini API key is not configured. AI chat will use fallback responses.');
}

const genAI = apiKey && apiKey !== 'YOUR_API_KEY_HERE' ? new GoogleGenerativeAI(apiKey) : null;

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
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!genAI;
    if (this.isConfigured) {
      try {
        this.model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log('Gemini AI model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gemini model:', error);
        this.isConfigured = false;
      }
    } else {
      console.log('Gemini AI not configured, will use fallback responses');
    }
  }

  // Enhanced chat functionality with better error handling
  async chatWithAI(message: string, data: any[], columns: any[], datasetInfo: any): Promise<string> {
    console.log('chatWithAI called with:', { 
      message: message.substring(0, 50) + '...', 
      dataLength: data?.length,
      columnsLength: columns?.length,
      hasDatasetInfo: !!datasetInfo,
      isConfigured: this.isConfigured
    });

    // Validate inputs
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message is required and must be a non-empty string');
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Valid data array is required for AI chat');
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Valid columns array is required for AI chat');
    }

    if (!datasetInfo) {
      throw new Error('Dataset information is required for AI chat');
    }

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    try {
      let aiResponse: string;

      if (this.isConfigured && this.model) {
        // Use Gemini AI
        aiResponse = await this.getGeminiResponse(message, data, columns, datasetInfo);
      } else {
        // Use fallback response
        aiResponse = this.getFallbackResponse(message, data, columns, datasetInfo);
      }

      // Add AI response to history
      this.chatHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      console.log('AI response generated successfully, length:', aiResponse.length);
      return aiResponse;

    } catch (error) {
      console.error('Error in chatWithAI:', error);
      
      // Generate fallback error response
      const errorResponse = `I apologize, but I encountered an error while processing your question: "${error instanceof Error ? error.message : 'Unknown error'}". 

Let me try to help you with what I can see in your data:
- Dataset: ${datasetInfo.fileName || 'Unknown'}
- Records: ${data.length.toLocaleString()}
- Columns: ${columns.map(col => col.name).join(', ')}

Please try rephrasing your question or ask something more specific about your data structure.`;

      this.chatHistory.push({
        role: 'assistant',
        content: errorResponse,
        timestamp: new Date()
      });

      return errorResponse;
    }
  }

  // Get response from Gemini AI
  private async getGeminiResponse(message: string, data: any[], columns: any[], datasetInfo: any): Promise<string> {
    try {
      // Prepare comprehensive context
      const context = this.buildDataContext(data, columns, datasetInfo);
      const conversationContext = this.buildConversationContext();

      const prompt = `
You are an expert data analyst AI assistant. You're helping a user analyze their dataset.

${context}

${conversationContext}

User's current question: "${message}"

Please provide a helpful, specific response that:
1. Directly addresses the user's question
2. References specific columns and data patterns when relevant
3. Provides actionable insights
4. Suggests follow-up questions or analysis steps
5. Uses clear, non-technical language when possible

Response:`;

      console.log('Sending request to Gemini AI...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini AI');
      }

      return text.trim();

    } catch (error) {
      console.error('Gemini AI request failed:', error);
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate fallback response when AI is not available
  private getFallbackResponse(message: string, data: any[], columns: any[], datasetInfo: any): string {
    const lowerMessage = message.toLowerCase();
    
    // Pattern matching for common questions
    if (lowerMessage.includes('column') || lowerMessage.includes('field')) {
      return `Your dataset has ${columns.length} columns: ${columns.map(col => `${col.name} (${col.type})`).join(', ')}. 

The numeric columns (${columns.filter(col => col.type === 'numeric').map(col => col.name).join(', ')}) can be used for statistical analysis and correlations.

The categorical columns (${columns.filter(col => col.type === 'categorical').map(col => col.name).join(', ')}) can be used for grouping and segmentation.`;
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
      const numericCols = columns.filter(col => col.type === 'numeric');
      const dateCols = columns.filter(col => col.type === 'datetime');
      
      return `To identify patterns in your data:

${numericCols.length > 0 ? `• Analyze correlations between numeric columns: ${numericCols.map(col => col.name).join(', ')}` : ''}
${dateCols.length > 0 ? `• Look for time-based trends using date columns: ${dateCols.map(col => col.name).join(', ')}` : ''}
${numericCols.length > 1 ? '• Create scatter plots to visualize relationships between variables' : ''}

Use the dashboard tools to create visualizations and generate statistical insights.`;
    }

    if (lowerMessage.includes('outlier') || lowerMessage.includes('anomal')) {
      const numericCols = columns.filter(col => col.type === 'numeric');
      return `To identify outliers in your data:

${numericCols.length > 0 ? `• Check numeric columns for extreme values: ${numericCols.map(col => col.name).join(', ')}` : ''}
• Use box plots to visualize data distribution
• Generate statistical insights to get outlier analysis

Your dataset has ${data.length} records, so outliers might significantly impact your analysis.`;
    }

    if (lowerMessage.includes('visual') || lowerMessage.includes('chart')) {
      return this.getVisualizationSuggestions(columns, data);
    }

    if (lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      return `Here's an overview of your dataset "${datasetInfo.fileName || 'Unknown'}":

📊 **Dataset Summary**
• Records: ${data.length.toLocaleString()}
• Columns: ${columns.length}
• Data Quality: ${datasetInfo.dataQuality ? `${((1 - datasetInfo.dataQuality.missingValues / (data.length * columns.length)) * 100).toFixed(1)}%` : 'Good'}

📈 **Column Breakdown**
• Numeric: ${columns.filter(col => col.type === 'numeric').length} columns
• Categorical: ${columns.filter(col => col.type === 'categorical').length} columns  
• Date/Time: ${columns.filter(col => col.type === 'datetime').length} columns

💡 **Recommended Next Steps**
• Generate statistical insights for patterns
• Create visualizations for key metrics
• Explore correlations between variables`;
    }

    // Default response
    return `I understand you're asking about "${message}". While I don't have AI capabilities enabled, I can help you explore your dataset:

**Your Data:**
• File: ${datasetInfo.fileName || 'Unknown'}
• ${data.length.toLocaleString()} records across ${columns.length} columns
• Columns: ${columns.slice(0, 5).map(col => col.name).join(', ')}${columns.length > 5 ? '...' : ''}

**Try asking:**
• "What columns do I have?"
• "Show me patterns in the data"
• "What visualizations should I create?"
• "Give me a summary of this dataset"

Or use the dashboard tools to generate statistical insights and create charts!`;
  }

  // Build data context for AI
  private buildDataContext(data: any[], columns: any[], datasetInfo: any): string {
    const numericCols = columns.filter(col => col.type === 'numeric');
    const categoricalCols = columns.filter(col => col.type === 'categorical');
    const dateCols = columns.filter(col => col.type === 'datetime');

    // Calculate basic statistics for numeric columns
    const numericStats = numericCols.slice(0, 3).map(col => {
      const values = data.slice(0, 1000).map(row => row[col.name]).filter(val => val != null && !isNaN(val));
      if (values.length === 0) return `${col.name}: No valid data`;
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return `${col.name}: range ${min.toFixed(2)} to ${max.toFixed(2)}, avg ${avg.toFixed(2)}`;
    });

    return `
DATASET CONTEXT:
File: ${datasetInfo.fileName || 'Unknown'}
Records: ${data.length.toLocaleString()}
Columns: ${columns.length}

COLUMN STRUCTURE:
• Numeric (${numericCols.length}): ${numericCols.map(col => col.name).join(', ')}
• Categorical (${categoricalCols.length}): ${categoricalCols.map(col => col.name).join(', ')}
• Date/Time (${dateCols.length}): ${dateCols.map(col => col.name).join(', ')}

SAMPLE DATA (first 3 rows):
${JSON.stringify(data.slice(0, 3), null, 2)}

NUMERIC STATISTICS:
${numericStats.join('\n')}
`;
  }

  // Build conversation context
  private buildConversationContext(): string {
    const recentMessages = this.chatHistory.slice(-6);
    if (recentMessages.length === 0) return '';

    return `
CONVERSATION HISTORY:
${recentMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
`;
  }

  // Get visualization suggestions
  private getVisualizationSuggestions(columns: any[], data: any[]): string {
    const numericCols = columns.filter(col => col.type === 'numeric');
    const categoricalCols = columns.filter(col => col.type === 'categorical');
    const dateCols = columns.filter(col => col.type === 'datetime');

    let suggestions = "Here are visualization recommendations for your data:\n\n";

    if (numericCols.length >= 2) {
      suggestions += `🔗 **Correlation Analysis**\n• Scatter plots: ${numericCols.slice(0, 2).map(col => col.name).join(' vs ')}\n• Correlation matrix heatmap\n\n`;
    }

    if (dateCols.length > 0 && numericCols.length > 0) {
      suggestions += `📈 **Time Series**\n• Line charts: ${numericCols.slice(0, 2).map(col => col.name).join(', ')} over time\n\n`;
    }

    if (categoricalCols.length > 0) {
      suggestions += `📊 **Categorical Analysis**\n• Bar charts: ${categoricalCols.slice(0, 2).map(col => col.name).join(', ')} distributions\n• Pie charts for proportions\n\n`;
    }

    if (numericCols.length > 0) {
      suggestions += `📉 **Distribution Analysis**\n• Histograms: ${numericCols.slice(0, 2).map(col => col.name).join(', ')}\n• Box plots for outlier detection`;
    }

    return suggestions;
  }

  // Generate AI insights from dataset (existing method, enhanced)
  async generateDataInsights(data: any[], columns: any[], datasetInfo: any): Promise<AIInsight[]> {
    if (!this.isConfigured) {
      console.log('AI not configured, using fallback insights');
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

      const context = this.buildDataContext(data, columns, datasetInfo);
      
      const prompt = `
You are a data analyst AI. Analyze this dataset and provide exactly 5 insights in valid JSON format.

${context}

Return ONLY a valid JSON array with exactly this structure:
[
  {
    "type": "trend|pattern|anomaly|recommendation|summary",
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

  // Generate fallback insights when AI is unavailable
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
      insights.push({
        type: 'summary',
        title: 'Dataset Loaded Successfully',
        description: `Your dataset with ${data.length} records has been loaded successfully. Use the dashboard tools to explore and visualize your data.`,
        confidence: 1.0,
        actionable: true
      });
    }

    return insights.slice(0, 5);
  }

  // Parse AI response with better error handling
  private parseAIResponse(text: string): AIInsight[] {
    try {
      const cleanText = text.trim();
      
      const jsonMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter(insight => 
            insight.type && 
            insight.title && 
            insight.description &&
            typeof insight.confidence === 'number'
          ).map(insight => ({
            ...insight,
            confidence: Math.min(Math.max(insight.confidence, 0), 1),
            actionable: Boolean(insight.actionable)
          }));
        }
      }
      
      if (cleanText.length > 0) {
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

  // Clear chat history
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // Get chat history
  getChatHistory(): AIChatMessage[] {
    return [...this.chatHistory];
  }

  // Check if AI is properly configured
  isAIConfigured(): boolean {
    return this.isConfigured;
  }

  // Get configuration status
  getConfigurationStatus(): { configured: boolean, hasApiKey: boolean, modelReady: boolean } {
    return {
      configured: this.isConfigured,
      hasApiKey: !!apiKey && apiKey !== 'YOUR_API_KEY_HERE',
      modelReady: !!this.model
    };
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();