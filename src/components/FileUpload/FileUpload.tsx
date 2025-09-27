import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { processFile } from '../../utils/fileProcessing';
import { setLoading, setError, setRawData, setDatasetInfo } from '../../store/dataSlice';
import { setCurrentView } from '../../store/uiSlice';

interface FileUploadProps {
  onFileProcessed?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const dispatch = useDispatch();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Only accept the first file for now
    if (acceptedFiles.length > 0) {
      setFiles([acceptedFiles[0]]);
      setUploadStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/tab-separated-values': ['.tsv']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      dispatch(setLoading(true));
      setUploadStatus('uploading');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process the file
      const { data, info } = await processFile(files[0]);
      
      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update Redux store
      dispatch(setRawData(data));
      dispatch(setDatasetInfo(info));
      dispatch(setError(null));
      
      // Update status and navigate to analysis view
      setUploadStatus('success');
      setTimeout(() => {
        dispatch(setCurrentView('analysis'));
      }, 1000);
      
    } catch (error) {
      setUploadStatus('error');
      dispatch(setError(error instanceof Error ? error.message : 'An unknown error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleClearFile = () => {
    setFiles([]);
    setUploadProgress(0);
    setUploadStatus('idle');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Business Analytics Dashboard
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
        Upload your data file to begin analysis
      </Typography>
      
      <Paper
        {...getRootProps()}
        elevation={3}
        sx={{
          p: 5,
          mt: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        
        {isDragActive ? (
          <Typography variant="h6">Drop the file here...</Typography>
        ) : (
          <>
            <Typography variant="h6">
              Drag & drop your file here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supported formats: CSV, XLSX, XLS, TSV
            </Typography>
          </>
        )}
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected File:
          </Typography>
          
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <InsertDriveFileIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={file.name} 
                  secondary={`${(file.size / (1024 * 1024)).toFixed(2)} MB`} 
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpload}
              disabled={uploadStatus === 'uploading'}
              fullWidth
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Processing ({uploadProgress}%)
                </>
              ) : 'Analyze Data'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handleClearFile}
              disabled={uploadStatus === 'uploading'}
            >
              Clear
            </Button>
          </Box>
        </Box>
      )}

      {uploadStatus === 'success' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          File processed successfully! Redirecting to analysis...
        </Alert>
      )}

      {uploadStatus === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error processing file. Please try again with a different file.
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;