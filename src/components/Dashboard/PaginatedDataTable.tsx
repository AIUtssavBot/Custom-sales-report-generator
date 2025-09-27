import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface PaginatedDataTableProps {
  data: any[];
  columns: Array<{ name: string; type: string }>;
  title?: string;
}

const PaginatedDataTable: React.FC<PaginatedDataTableProps> = ({ 
  data, 
  columns, 
  title = "Data Preview" 
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.slice(0, 5).map(col => col.name)
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleColumn = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const exportData = () => {
    const csvContent = [
      selectedColumns.join(','),
      ...paginatedData.map(row =>
        selectedColumns.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export Data">
            <IconButton onClick={exportData} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search and Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Columns:
          </Typography>
          {columns.map((column) => (
            <Chip
              key={column.name}
              label={column.name}
              onClick={() => toggleColumn(column.name)}
              color={selectedColumns.includes(column.name) ? 'primary' : 'default'}
              variant={selectedColumns.includes(column.name) ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Data Table */}
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectedColumns.map((columnName) => {
                const column = columns.find(col => col.name === columnName);
                return (
                  <TableCell key={columnName}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {columnName}
                      {column && (
                        <Chip 
                          label={column.type} 
                          size="small" 
                          color={
                            column.type === 'numeric' ? 'primary' :
                            column.type === 'categorical' ? 'secondary' :
                            column.type === 'datetime' ? 'success' : 'default'
                          }
                        />
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow 
                key={index}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { 
                    backgroundColor: 'action.hover' 
                  },
                  transition: 'background-color 0.2s ease-in-out'
                }}
              >
                {selectedColumns.map((columnName) => (
                  <TableCell key={columnName}>
                    {row[columnName] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
        }
      />
    </Paper>
  );
};

export default PaginatedDataTable;
