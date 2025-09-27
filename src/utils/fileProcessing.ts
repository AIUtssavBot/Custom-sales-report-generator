import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataColumn, DatasetInfo } from '../types';

// Function to parse CSV files
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results: Papa.ParseResult<any>) => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

// Function to parse Excel files
export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// Function to detect data types for each column
export const detectColumnTypes = (data: any[]): Record<string, DataColumn> => {
  if (!data || data.length === 0) return {};

  const sampleSize = Math.min(100, data.length);
  const sample = data.slice(0, sampleSize);
  const columns: Record<string, DataColumn> = {};

  // Get all column names from the first row
  const columnNames = Object.keys(data[0]);

  columnNames.forEach(colName => {
    // Extract values for this column
    const values = sample.map(row => row[colName]).filter(val => val !== null && val !== undefined);
    
    // Count unique and missing values
    const uniqueValues = new Set(values).size;
    const missingCount = sample.length - values.length;
    const missingPercentage = (missingCount / sample.length) * 100;

    // Determine column type
    let type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text' = 'text';
    
    // Check if all values are numbers
    if (values.every(val => typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val))))) {
      type = 'numeric';
    } 
    // Check if all values are booleans or boolean-like
    else if (values.every(val => 
      typeof val === 'boolean' || 
      val === 0 || val === 1 || 
      val === '0' || val === '1' || 
      val === 'true' || val === 'false' || 
      val === 'yes' || val === 'no' || 
      val === 'y' || val === 'n'
    )) {
      type = 'boolean';
    } 
    // Check if all values are valid dates
    else if (values.every(val => !isNaN(Date.parse(String(val))))) {
      type = 'datetime';
    } 
    // If unique values are less than 20% of total and not numeric, likely categorical
    else if (uniqueValues < sampleSize * 0.2 && values.length > 0) {
      type = 'categorical';
    }

    // Create column metadata
    columns[colName] = {
      name: colName,
      type,
      uniqueValues,
      missingValues: missingCount,
      missingPercentage
    };

    // Add statistical measures for numeric columns
    if (type === 'numeric') {
      const numericValues = values.map(v => Number(v));
      columns[colName].min = Math.min(...numericValues);
      columns[colName].max = Math.max(...numericValues);
      columns[colName].mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      columns[colName].median = sorted.length % 2 === 0 
        ? (sorted[middle - 1] + sorted[middle]) / 2 
        : sorted[middle];
      
      // Calculate standard deviation
      const mean = columns[colName].mean as number;
      columns[colName].stdDev = Math.sqrt(
        numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      );
      
      // Calculate quartiles
      columns[colName].quartiles = [
        sorted[Math.floor(sorted.length * 0.25)],
        sorted[Math.floor(sorted.length * 0.5)],
        sorted[Math.floor(sorted.length * 0.75)]
      ];
    }
  });

  return columns;
};

// Function to analyze data quality
export const analyzeDataQuality = (data: any[]): { missingValues: number; duplicateRows: number; outliers: number } => {
  if (!data || data.length === 0) {
    return { missingValues: 0, duplicateRows: 0, outliers: 0 };
  }

  // Count missing values across all columns
  let totalMissingValues = 0;
  data.forEach(row => {
    Object.values(row).forEach(value => {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        totalMissingValues++;
      }
    });
  });

  // Count duplicate rows
  const stringifiedRows = data.map(row => JSON.stringify(row));
  const uniqueRows = new Set(stringifiedRows);
  const duplicateRows = data.length - uniqueRows.size;

  // Simple outlier detection for numeric columns
  let outlierCount = 0;
  const columns = detectColumnTypes(data);
  
  Object.values(columns).forEach(column => {
    if (column.type === 'numeric' && column.quartiles) {
      const iqr = column.quartiles[2] - column.quartiles[0];
      const lowerBound = column.quartiles[0] - 1.5 * iqr;
      const upperBound = column.quartiles[2] + 1.5 * iqr;
      
      data.forEach(row => {
        const value = Number(row[column.name]);
        if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
          outlierCount++;
        }
      });
    }
  });

  return {
    missingValues: totalMissingValues,
    duplicateRows,
    outliers: outlierCount
  };
};

// Main function to process uploaded file
export const processFile = async (file: File): Promise<{ data: any[], info: DatasetInfo }> => {
  let data: any[];
  
  // Parse file based on type
  if (file.name.endsWith('.csv')) {
    data = await parseCSV(file);
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    data = await parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
  
  // Remove empty rows
  data = data.filter(row => Object.values(row).some(val => val !== null && val !== undefined && val !== ''));
  
  // Analyze data
  const columns = detectColumnTypes(data);
  const dataQuality = analyzeDataQuality(data);
  
  // Create dataset info
  const info: DatasetInfo = {
    fileName: file.name,
    fileSize: file.size,
    rowCount: data.length,
    columnCount: Object.keys(columns).length,
    columns: Object.values(columns),
    data: data,
    dataQuality
  };
  
  return { data, info };
};