import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Mic as MicIcon, 
  MicOff as MicOffIcon, 
  Save as SaveIcon, 
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import axios from 'axios';

const NoteTaking = ({ account, onNoteSaved }) => {
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  const recognitionRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setNoteContent(prevContent => prevContent + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Generate default title when account changes
  useEffect(() => {
    if (account) {
      const date = new Date().toLocaleDateString();
      setNoteTitle(`${account.name} - Notes ${date}`);
    }
  }, [account]);
  
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showSnackbar('Speech recognition is not supported in your browser.', 'error');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      showSnackbar('Voice recording stopped', 'info');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      showSnackbar('Voice recording started - speak now', 'info');
    }
  };
  
  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      showSnackbar('Please enter some content for your note', 'error');
      return;
    }
    
    if (!account) {
      showSnackbar('Please select an account first', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // In a real implementation, userId would come from authentication
      const userId = '60d0fe4f5311236168a109ca'; // Placeholder user ID
      
      const response = await axios.post('/api/notes', {
        accountId: account._id,
        userId,
        title: noteTitle,
        originalContent: noteContent,
        isVoiceNote: isRecording || false
      });
      
      setIsSaving(false);
      showSnackbar('Note saved successfully', 'success');
      
      // Clear form after successful save
      setNoteContent('');
      
      // Generate new title
      const date = new Date().toLocaleDateString();
      setNoteTitle(`${account.name} - Notes ${date}`);
      
      // Notify parent component
      if (onNoteSaved) {
        onNoteSaved(response.data.data);
      }
    } catch (err) {
      setIsSaving(false);
      console.error('Error saving note:', err);
      showSnackbar('Error saving note. Please try again.', 'error');
    }
  };
  
  const handleClearNote = () => {
    setNoteContent('');
    showSnackbar('Note content cleared', 'info');
  };
  
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  if (!account) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Please select an account to take notes
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Take Notes for {account.name}
        </Typography>
        <Tooltip title={isRecording ? "Stop Recording" : "Start Voice Input"}>
          <IconButton 
            color={isRecording ? "error" : "primary"} 
            onClick={toggleRecording}
            sx={{ animation: isRecording ? 'pulse 1.5s infinite' : 'none' }}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        label="Note Title"
        variant="outlined"
        fullWidth
        value={noteTitle}
        onChange={(e) => setNoteTitle(e.target.value)}
        margin="normal"
      />
      
      <TextField
        label="Note Content"
        variant="outlined"
        multiline
        rows={10}
        fullWidth
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        margin="normal"
        placeholder="Type your notes here or use the microphone button for voice input..."
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleClearNote}
        >
          Clear
        </Button>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveNote}
          disabled={isSaving || !noteContent.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </Box>
      
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Paper>
  );
};

export default NoteTaking;
