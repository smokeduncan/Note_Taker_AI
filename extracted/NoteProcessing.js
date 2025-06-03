import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  AutoFixHigh as CleanupIcon,
  Summarize as SummarizeIcon,
  Assignment as ActionItemsIcon,
  Email as EmailIcon,
  Event as MeetingIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';

const NoteProcessing = ({ note, onProcessingComplete }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processedNote, setProcessedNote] = useState(null);
  const [formattedContent, setFormattedContent] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState([]);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    // Reset state when note changes
    if (note) {
      setProcessedNote(note);
      setFormattedContent(note.formattedContent || note.originalContent);
      setSummary(note.summary || '');
      setActionItems(note.actionItems || []);
      setEmailDraft({ subject: '', body: '' });
      setMeetingDetails(null);
    }
  }, [note]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCleanupNote = async () => {
    if (!note) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/ai/cleanup', {
        noteId: note._id,
        content: note.originalContent,
        userId: note.userId
      });

      setFormattedContent(response.data.data.formattedContent);
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        formattedContent: response.data.data.formattedContent,
        aiProcessed: true,
        aiProcessingDetails: {
          processedAt: new Date(),
          model: 'Gemini Pro 2.5 (Simulated)',
          confidence: 0.92
        }
      });

      // Update local state
      setProcessedNote({
        ...note,
        formattedContent: response.data.data.formattedContent,
        aiProcessed: true,
        aiProcessingDetails: {
          processedAt: new Date(),
          model: 'Gemini Pro 2.5 (Simulated)',
          confidence: 0.92
        }
      });

      setLoading(false);
      showSnackbar('Note cleaned up successfully', 'success');
      
      if (onProcessingComplete) {
        onProcessingComplete('cleanup', response.data.data.formattedContent);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to clean up note. Please try again.');
      console.error('Error cleaning up note:', err);
      showSnackbar('Error cleaning up note', 'error');
    }
  };

  const handleSummarizeNote = async () => {
    if (!note) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/ai/summarize', {
        noteId: note._id,
        content: note.originalContent,
        userId: note.userId
      });

      setSummary(response.data.data.summary);
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        summary: response.data.data.summary,
        aiProcessed: true,
        aiProcessingDetails: {
          processedAt: new Date(),
          model: 'Gemini Pro 2.5 (Simulated)',
          confidence: 0.88
        }
      });

      // Update local state
      setProcessedNote({
        ...note,
        summary: response.data.data.summary,
        aiProcessed: true,
        aiProcessingDetails: {
          processedAt: new Date(),
          model: 'Gemini Pro 2.5 (Simulated)',
          confidence: 0.88
        }
      });

      setLoading(false);
      showSnackbar('Note summarized successfully', 'success');
      
      if (onProcessingComplete) {
        onProcessingComplete('summarize', response.data.data.summary);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to summarize note. Please try again.');
      console.error('Error summarizing note:', err);
      showSnackbar('Error summarizing note', 'error');
    }
  };

  const handleExtractActions = async () => {
    if (!note) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/ai/extract-actions', {
        noteId: note._id,
        content: note.originalContent,
        userId: note.userId
      });

      setActionItems(response.data.data.actionItems);

      // Update local state
      setProcessedNote({
        ...note,
        actionItems: response.data.data.actionItems,
        aiProcessed: true,
        aiProcessingDetails: {
          processedAt: new Date(),
          model: 'Gemini Pro 2.5 (Simulated)',
          confidence: 0.85
        }
      });

      setLoading(false);
      showSnackbar('Action items extracted successfully', 'success');
      
      if (onProcessingComplete) {
        onProcessingComplete('extract-actions', response.data.data.actionItems);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to extract action items. Please try again.');
      console.error('Error extracting action items:', err);
      showSnackbar('Error extracting action items', 'error');
    }
  };

  const handleDraftEmail = async () => {
    if (!note) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/ai/draft-email', {
        noteId: note._id,
        content: note.originalContent,
        userId: note.userId
      });

      setEmailDraft({
        subject: response.data.data.subject,
        body: response.data.data.body
      });

      setLoading(false);
      showSnackbar('Email drafted successfully', 'success');
      
      if (onProcessingComplete) {
        onProcessingComplete('draft-email', response.data.data);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to draft email. Please try again.');
      console.error('Error drafting email:', err);
      showSnackbar('Error drafting email', 'error');
    }
  };

  const handleScheduleMeeting = async () => {
    if (!note) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/ai/schedule-meeting', {
        noteId: note._id,
        content: note.originalContent,
        userId: note.userId
      });

      setMeetingDetails(response.data.data);

      setLoading(false);
      showSnackbar('Meeting scheduled successfully', 'success');
      
      if (onProcessingComplete) {
        onProcessingComplete('schedule-meeting', response.data.data);
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to schedule meeting. Please try again.');
      console.error('Error scheduling meeting:', err);
      showSnackbar('Error scheduling meeting', 'error');
    }
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

  if (!note) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Please select a note to process
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          AI Processing for: {note.title}
        </Typography>
        {note.aiProcessed && (
          <Chip 
            label="AI Processed" 
            color="primary" 
            size="small" 
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab icon={<CleanupIcon />} label="Cleanup" />
        <Tab icon={<SummarizeIcon />} label="Summarize" />
        <Tab icon={<ActionItemsIcon />} label="Action Items" />
        <Tab icon={<EmailIcon />} label="Draft Email" />
        <Tab icon={<MeetingIcon />} label="Schedule Meeting" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Cleanup Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Clean up and format your note
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI will clean up your note by fixing formatting, grammar, and punctuation.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {formattedContent || note.originalContent}
                </Typography>
              </Paper>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<CleanupIcon />}
                onClick={handleCleanupNote}
                disabled={loading}
              >
                Clean Up Note
              </Button>
            </Box>
          )}

          {/* Summarize Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Summarize your note
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI will create a concise summary of your note highlighting the key points.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                <Typography variant="body1">
                  {summary || 'Your summary will appear here after processing.'}
                </Typography>
              </Paper>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SummarizeIcon />}
                onClick={handleSummarizeNote}
                disabled={loading}
              >
                Summarize Note
              </Button>
            </Box>
          )}

          {/* Action Items Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Extract action items
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI will identify action items and tasks from your note.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                {actionItems && actionItems.length > 0 ? (
                  <List>
                    {actionItems.map((item, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ActionItemsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.description}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {item.assignedTo}
                              </Typography>
                              {` — Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  label={item.status} 
                                  size="small" 
                                  color={item.status === 'completed' ? 'success' : 'default'} 
                                  sx={{ mr: 1 }} 
                                />
                                <Chip 
                                  label={item.priority} 
                                  size="small" 
                                  color={
                                    item.priority === 'high' ? 'error' : 
                                    item.priority === 'medium' ? 'warning' : 'info'
                                  } 
                                />
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1">
                    Action items will appear here after processing.
                  </Typography>
                )}
              </Paper>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ActionItemsIcon />}
                onClick={handleExtractActions}
                disabled={loading}
              >
                Extract Action Items
              </Button>
            </Box>
          )}

          {/* Draft Email Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Draft an email
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI will create an email draft based on your note content.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                {emailDraft.subject || emailDraft.body ? (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Subject: {emailDraft.subject}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {emailDraft.body}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1">
                    Your email draft will appear here after processing.
                  </Typography>
                )}
              </Paper>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EmailIcon />}
                onClick={handleDraftEmail}
                disabled={loading}
              >
                Draft Email
              </Button>
            </Box>
          )}

          {/* Schedule Meeting Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Schedule a meeting
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI will suggest meeting details based on your note content.
              </Typography>
              
              <
(Content truncated due to size limit. Use line ranges to read in chunks)