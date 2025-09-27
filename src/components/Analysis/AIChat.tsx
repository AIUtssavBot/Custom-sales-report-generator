import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
// Import the interfaces from your existing file
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  open: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<string>;
  chatHistory: AIChatMessage[];
  isLoading: boolean;
}

const AIChat: React.FC<AIChatProps> = ({
  open,
  onClose,
  onSendMessage,
  chatHistory,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format message content with basic markdown support
  const formatMessageContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];

    const flushCurrentList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <Box key={`list-${elements.length}`} sx={{ my: 1 }}>
            <List dense sx={{ py: 0 }}>
              {currentListItems.map((item, idx) => (
                <ListItem key={idx} sx={{ py: 0.25, pl: 2 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, mr: 1.5, color: 'text.secondary', mt: 0.75 }} />
                  <Typography variant="body2" component="span">
                    {formatInlineText(item)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        );
        currentListItems = [];
      }
    };

    const formatInlineText = (text: string) => {
      // Handle bold text **text** or *text*
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Typography key={idx} component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {part.slice(2, -2)}
            </Typography>
          );
        } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return (
            <Typography key={idx} component="span" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
              {part.slice(1, -1)}
            </Typography>
          );
        } else if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <Chip 
              key={idx} 
              label={part.slice(1, -1)} 
              size="small" 
              variant="outlined"
              sx={{ mx: 0.5, height: 20, fontSize: '0.75rem' }}
            />
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Handle numbered lists (1., 2., etc.)
      if (/^\d+\.\s+/.test(trimmedLine)) {
        const item = trimmedLine.replace(/^\d+\.\s+/, '');
        currentListItems.push(item);
        return;
      }

      // Handle bullet points (-, *, •)
      if (/^[-\*•]\s+/.test(trimmedLine)) {
        const item = trimmedLine.replace(/^[-\*•]\s+/, '');
        currentListItems.push(item);
        return;
      }

      // Flush any pending list before processing other content
      flushCurrentList();

      // Handle headings
      if (trimmedLine.startsWith('###')) {
        elements.push(
          <Typography key={index} variant="h6" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' }}>
            {formatInlineText(trimmedLine.replace(/^#+\s*/, ''))}
          </Typography>
        );
      } else if (trimmedLine.startsWith('##')) {
        elements.push(
          <Typography key={index} variant="h5" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' }}>
            {formatInlineText(trimmedLine.replace(/^#+\s*/, ''))}
          </Typography>
        );
      } else if (trimmedLine.startsWith('#')) {
        elements.push(
          <Typography key={index} variant="h4" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' }}>
            {formatInlineText(trimmedLine.replace(/^#+\s*/, ''))}
          </Typography>
        );
      }
      // Handle empty lines
      else if (trimmedLine === '') {
        elements.push(<Box key={index} sx={{ height: 8 }} />);
      }
      // Handle regular paragraphs
      else {
        elements.push(
          <Typography key={index} variant="body1" paragraph sx={{ mb: 1, lineHeight: 1.6 }}>
            {formatInlineText(trimmedLine)}
          </Typography>
        );
      }
    });

    // Flush any remaining list items
    flushCurrentList();

    return elements;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || localLoading) return;

    const currentMessage = message;
    setMessage('');
    setLocalLoading(true);
    setError(null);

    try {
      console.log('Sending message to AI:', currentMessage);
      const response = await onSendMessage(currentMessage);
      console.log('AI response received:', response);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '70vh', maxHeight: 600 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6">AI Data Assistant</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Chat Messages */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          minHeight: 0
        }}>
          {/* Error display */}
          {error && (
            <Box sx={{ mb: 2 }}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {error}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {chatHistory.length === 0 && !error ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}>
              <SmartToyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Welcome to AI Data Assistant!
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ mb: 3 }}>
                Ask me anything about your data. I can help you:
              </Typography>
              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="body2">• Analyze patterns and trends</Typography>
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="body2">• Suggest visualizations</Typography>
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="body2">• Identify data quality issues</Typography>
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="body2">• Recommend analysis approaches</Typography>
                </ListItem>
              </List>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {chatHistory.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 2,
                    p: 0
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    minWidth: 40
                  }}>
                    {msg.role === 'user' ? (
                      <PersonIcon 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          borderRadius: '50%', 
                          p: 0.5,
                          fontSize: 32
                        }} 
                      />
                    ) : (
                      <SmartToyIcon 
                        sx={{ 
                          bgcolor: 'secondary.main', 
                          color: 'white', 
                          borderRadius: '50%', 
                          p: 0.5,
                          fontSize: 32
                        }} 
                      />
                    )}
                  </Box>
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      bgcolor: msg.role === 'user' 
                        ? 'primary.light' 
                        : 'background.paper',
                      color: msg.role === 'user' 
                        ? 'primary.contrastText' 
                        : 'text.primary',
                      borderRadius: 2,
                      wordBreak: 'break-word',
                      border: msg.role === 'assistant' ? 1 : 0,
                      borderColor: msg.role === 'assistant' ? 'divider' : 'transparent'
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <Box sx={{ 
                        '& > *:first-of-type': { mt: 0 },
                        '& > *:last-child': { mb: 0 }
                      }}>
                        {formatMessageContent(msg.content)}
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 1, 
                        opacity: 0.7,
                        textAlign: msg.role === 'user' ? 'right' : 'left'
                      }}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
              
              {/* Loading indicator */}
              {(localLoading || isLoading) && (
                <ListItem sx={{ justifyContent: 'flex-start', p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyIcon 
                      sx={{ 
                        bgcolor: 'secondary.main', 
                        color: 'white', 
                        borderRadius: '50%', 
                        p: 0.5,
                        fontSize: 32
                      }} 
                    />
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </ListItem>
              )}
            </List>
          )}
          <div ref={messagesEndRef} />
        </Box>
      </DialogContent>

      <Divider />

      {/* Message Input */}
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask me about your data..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={localLoading || isLoading}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!message.trim() || localLoading || isLoading}
            sx={{ 
              minWidth: 48,
              height: 40,
              borderRadius: 3
            }}
          >
            {(localLoading || isLoading) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AIChat;