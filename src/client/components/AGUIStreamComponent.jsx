import React, { useState, useEffect, useRef } from 'react';
import { useAGUI } from '@ag-ui/react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  LinearProgress, 
  Button, 
  TextField, 
  Chip, 
  Divider, 
  Card, 
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { 
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Save as SaveIcon
} from '@mui/icons-material';

/**
 * AGUIStreamComponent
 * 
 * A React component for AG-UI integration that handles real-time event streaming,
 * agent state visualization, and interactive user inputs.
 * 
 * @param {Object} props - Component props
 * @param {string} props.endpoint - API endpoint for the AG-UI stream
 * @param {string} props.threadId - Thread ID for the stream
 * @param {Object} props.initialState - Initial state for the stream
 * @param {Function} props.onComplete - Callback when the stream completes
 * @param {Function} props.onError - Callback when an error occurs
 * @param {Function} props.onCancel - Callback when the stream is cancelled
 * @param {boolean} props.autoScroll - Whether to automatically scroll to the bottom
 * @param {Object} props.style - Additional styles for the component
 * @param {Object} props.className - Additional CSS classes for the component
 */
const AGUIStreamComponent = ({
  endpoint,
  threadId,
  initialState = {},
  onComplete,
  onError,
  onCancel,
  autoScroll = true,
  style,
  className
}) => {
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = useRef(null);
  
  // State for user input
  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [inputOptions, setInputOptions] = useState([]);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  // State for validation dialog
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationData, setValidationData] = useState(null);
  
  // Use the AG-UI hook to connect to the stream
  const { 
    stream, 
    state, 
    events, 
    isConnected, 
    error: streamError, 
    reconnect 
  } = useAGUI({
    endpoint: endpoint || `/api/stream/${threadId}`,
    threadId,
    initialState,
    autoReconnect: true,
    bufferEvents: true,
    onConnect: () => console.log(`Connected to stream: ${threadId}`),
    onDisconnect: () => console.log(`Disconnected from stream: ${threadId}`),
    onError: (error) => {
      console.error(`Stream error: ${error.message}`);
      if (onError) onError(error);
    }
  });
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);
  
  // Handle stream completion
  useEffect(() => {
    if (state.status === 'complete' && onComplete) {
      onComplete(state.result);
    }
  }, [state.status, state.result, onComplete]);
  
  // Handle user input requests
  useEffect(() => {
    const inputRequestEvent = events.find(
      event => event.type === 'USER_INPUT_REQUEST' && 
      !event.handled
    );
    
    if (inputRequestEvent) {
      // Mark event as handled
      inputRequestEvent.handled = true;
      
      setIsWaitingForInput(true);
      
      // Check if there are options for selection
      if (inputRequestEvent.data.options && inputRequestEvent.data.options.length > 0) {
        setInputOptions(inputRequestEvent.data.options);
        setSelectedOption(inputRequestEvent.data.options[0].value);
      } else {
        setInputOptions([]);
        setSelectedOption('');
      }
      
      // Check if validation is required
      if (inputRequestEvent.data.sap_validation_required) {
        setValidationData(inputRequestEvent.data);
        setShowValidationDialog(true);
      }
    }
  }, [events]);
  
  // Handle stream cancellation
  const handleCancel = async () => {
    try {
      await stream.cancel('Cancelled by user');
      if (onCancel) onCancel();
    } catch (error) {
      console.error(`Error cancelling stream: ${error.message}`);
    }
  };
  
  // Handle user input submission
  const handleSubmitInput = async () => {
    if (!isWaitingForInput) return;
    
    try {
      let inputValue;
      
      // Use selected option if available, otherwise use text input
      if (inputOptions.length > 0) {
        inputValue = { value: selectedOption };
      } else {
        inputValue = { text: userInput };
      }
      
      await stream.sendUserInput(inputValue);
      
      // Reset input state
      setUserInput('');
      setSelectedOption('');
      setIsWaitingForInput(false);
      setInputOptions([]);
    } catch (error) {
      console.error(`Error sending user input: ${error.message}`);
    }
  };
  
  // Handle validation dialog approval
  const handleApproveValidation = async () => {
    try {
      await stream.sendUserInput({ approved: true });
      setShowValidationDialog(false);
      setValidationData(null);
    } catch (error) {
      console.error(`Error approving validation: ${error.message}`);
    }
  };
  
  // Handle validation dialog rejection
  const handleRejectValidation = async () => {
    try {
      await stream.sendUserInput({ approved: false });
      setShowValidationDialog(false);
      setValidationData(null);
    } catch (error) {
      console.error(`Error rejecting validation: ${error.message}`);
    }
  };
  
  // Render agent state indicator
  const renderAgentState = () => {
    switch (state.status) {
      case 'idle':
        return (
          <Chip 
            icon={<InfoIcon />} 
            label="Ready" 
            color="default" 
            variant="outlined" 
          />
        );
      case 'thinking':
        return (
          <Chip 
            icon={<CircularProgress size={16} />} 
            label="Thinking..." 
            color="primary" 
            variant="outlined" 
          />
        );
      case 'running':
        return (
          <Chip 
            icon={<CircularProgress size={16} />} 
            label="Processing..." 
            color="primary" 
            variant="outlined" 
          />
        );
      case 'tool_execution':
        return (
          <Chip 
            icon={<BuildIcon />} 
            label={`Executing ${state.currentStep || 'tool'}`} 
            color="secondary" 
            variant="outlined" 
          />
        );
      case 'waiting_input':
        return (
          <Chip 
            icon={<QuestionAnswerIcon />} 
            label="Waiting for input" 
            color="warning" 
            variant="outlined" 
          />
        );
      case 'complete':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Complete" 
            color="success" 
            variant="outlined" 
          />
        );
      case 'error':
        return (
          <Chip 
            icon={<ErrorIcon />} 
            label="Error" 
            color="error" 
            variant="outlined" 
          />
        );
      case 'cancelled':
        return (
          <Chip 
            icon={<CancelIcon />} 
            label="Cancelled" 
            color="default" 
            variant="outlined" 
          />
        );
      default:
        return (
          <Chip 
            icon={<InfoIcon />} 
            label={state.status || 'Unknown'} 
            color="default" 
            variant="outlined" 
          />
        );
    }
  };
  
  // Render progress indicator
  const renderProgress = () => {
    if (state.status === 'complete' || state.status === 'error' || state.status === 'cancelled') {
      return null;
    }
    
    return (
      <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={state.progress || 0} 
          color={state.status === 'error' ? 'error' : 'primary'} 
        />
        {state.currentStep && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {state.currentStep}
          </Typography>
        )}
      </Box>
    );
  };
  
  // Render event message
  const renderEventMessage = (event) => {
    switch (event.type) {
      case 'TEXT_MESSAGE_CONTENT':
        return (
          <Box 
            key={event.id} 
            sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: event.source === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: 1
            }}
          >
            <Typography variant="body1">
              {event.data.text}
            </Typography>
          </Box>
        );
      
      case 'TOOL_CALL_START':
        return (
          <Box 
            key={event.id} 
            sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: '#fff8e1',
              borderRadius: 1,
              border: '1px dashed #ffd54f'
            }}
          >
            <Typography variant="body2" color="textSecondary">
              <BuildIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Executing tool: {event.data.tool} 
              {event.data.server && ` on ${event.data.server}`}
            </Typography>
          </Box>
        );
      
      case 'TOOL_CALL_END':
        return (
          <Box 
            key={event.id} 
            sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: '#e8f5e9',
              borderRadius: 1,
              border: '1px dashed #a5d6a7'
            }}
          >
            <Typography variant="body2" color="textSecondary">
              <CheckCircleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Tool execution complete
            </Typography>
          </Box>
        );
      
      case 'ERROR':
        return (
          <Box 
            key={event.id} 
            sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: '#ffebee',
              borderRadius: 1,
              border: '1px solid #ef9a9a'
            }}
          >
            <Typography variant="body2" color="error">
              <ErrorIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Error: {event.data.error}
            </Typography>
          </Box>
        );
      
      case 'USER_INPUT_REQUEST':
        return (
          <Box 
            key={event.id} 
            sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: '#e8eaf6',
              borderRadius: 1,
              border: '1px solid #c5cae9'
            }}
          >
            <Typography variant="body2" color="primary">
              <QuestionAnswerIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {event.data.question || 'Please provide input:'}
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  // Render user input form
  const renderUserInputForm = () => {
    if (!isWaitingForInput) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        
        {inputOptions.length > 0 ? (
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Select an option</InputLabel>
            <Select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              label="Select an option"
            >
              {inputOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type your response..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmitInput();
              }
            }}
          />
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSubmitInput}
            disabled={inputOptions.length > 0 ? !selectedOption : !userInput}
          >
            Send
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render validation dialog
  const renderValidationDialog = () => {
    if (!validationData) {
      return null;
    }
    
    return (
      <Dialog 
        open={showValidationDialog} 
        onClose={() => setShowValidationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm SAP Operation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please review and approve the following operation:
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 2, mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {validationData.operation || 'SAP Operation'}
              </Typography>
              
              {validationData.sap_data && (
                <List dense>
                  {Object.entries(validationData.sap_data).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemIcon sx={{ minWidth: '40px' }}>
                        <InfoIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={key.replace(/_/g, ' ')} 
                        secondary={value?.toString() || 'N/A'} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          
          <Typography variant="body2" color="textSecondary">
            This operation will update data in SAP Sales Cloud.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleRejectValidation} 
            color="error"
            startIcon={<CancelIcon />}
          >
            Reject
          </Button>
          <Button 
            onClick={handleApproveValidation} 
            color="primary" 
            variant="contained"
            startIcon={<CheckCircleIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render connection status
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip 
            icon={<ErrorIcon />} 
            label="Disconnected" 
            color="error" 
            variant="outlined" 
            size="small"
          />
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={reconnect}
            sx={{ ml: 1 }}
          >
            Reconnect
          </Button>
        </Box>
      );
    }
    
    return null;
  };
  
  // Render error message
  const renderErrorMessage = () => {
    if (streamError) {
      return (
        <Box 
          sx={{ 
            mb: 2, 
            p: 1, 
            backgroundColor: '#ffebee',
            borderRadius: 1,
            border: '1px solid #ef9a9a'
          }}
        >
          <Typography variant="body2" color="error">
            <ErrorIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Connection error: {streamError.message}
          </Typography>
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        ...style 
      }}
      className={className}
    >
      {/* Header with status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderAgentState()}
          
          {state.status !== 'complete' && state.status !== 'cancelled' && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
              {state.currentStep || 'Processing...'}
            </Typography>
          )}
        </Box>
        
        <Box>
          {state.status !== 'complete' && state.status !== 'cancelled' && (
            <IconButton 
              size="small" 
              color="default" 
              onClick={handleCancel}
              title="Cancel"
            >
              <CancelIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* Connection status and errors */}
      {renderConnectionStatus()}
      {renderErrorMessage()}
      
      {/* Progress indicator */}
      {renderProgress()}
      
      {/* Messages container */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          mb: 2,
          p: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: '#fafafa'
        }}
      >
        {events.filter(event => 
          event.type === 'TEXT_MESSAGE_CONTENT' || 
          event.type === 'TOOL_CALL_START' || 
          event.type === 'TOOL_CALL_END' || 
          event.type === 'ERROR' ||
          event.type === 'USER_INPUT_REQUEST'
        ).map(renderEventMessage)}
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* User input form */}
      {renderUserInputForm()}
      
      {/* Validation dialog */}
      {renderValidationDialog()}
    </Paper>
  );
};

export default AGUIStreamComponent;
