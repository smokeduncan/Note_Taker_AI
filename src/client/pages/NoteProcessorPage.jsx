import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  SyncAlt as SyncIcon,
  Description as DescriptionIcon,
  Summarize as SummarizeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import AGUIStreamComponent from '../components/AGUIStreamComponent';

/**
 * NoteProcessorPage
 * 
 * A page component for processing notes with AI using AG-UI integration.
 * Allows users to select notes, process them with AI, and interact with the results.
 */
const NoteProcessorPage = () => {
  const navigate = useNavigate();
  const { noteId: paramNoteId } = useParams();
  
  // State for notes and selection
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(paramNoteId || '');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for AG-UI stream
  const [threadId, setThreadId] = useState(null);
  const [processingType, setProcessingType] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  
  // State for UI
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Fetch notes when component mounts
  useEffect(() => {
    fetchNotes();
  }, []);
  
  // Update selected note when ID changes
  useEffect(() => {
    if (selectedNoteId && notes.length > 0) {
      const note = notes.find(note => note._id === selectedNoteId);
      setSelectedNote(note || null);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteId, notes]);
  
  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/notes');
      setNotes(response.data);
      
      // If we have a note ID from params, select it
      if (paramNoteId && response.data.length > 0) {
        setSelectedNoteId(paramNoteId);
      } else if (response.data.length > 0) {
        // Otherwise select the first note
        setSelectedNoteId(response.data[0]._id);
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch notes. Please try again.');
      console.error('Error fetching notes:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to fetch notes. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Process note with AI
  const processNote = async () => {
    if (!selectedNoteId) {
      setSnackbar({
        open: true,
        message: 'Please select a note to process.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingResult(null);
      setProcessingType('process');
      
      const response = await axios.post('/api/notes/process', {
        noteId: selectedNoteId
      });
      
      setThreadId(response.data.threadId);
      setLoading(false);
      
      // Update URL with note ID and thread ID
      navigate(`/notes/process/${selectedNoteId}?thread=${response.data.threadId}`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError('Failed to start note processing. Please try again.');
      console.error('Error processing note:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to start note processing. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Generate email draft from note
  const generateEmailDraft = async () => {
    if (!selectedNoteId) {
      setSnackbar({
        open: true,
        message: 'Please select a note to generate an email draft.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingResult(null);
      setProcessingType('email');
      
      const response = await axios.post('/api/notes/email-draft', {
        noteId: selectedNoteId
      });
      
      setThreadId(response.data.threadId);
      setLoading(false);
      
      // Update URL with note ID and thread ID
      navigate(`/notes/process/${selectedNoteId}?thread=${response.data.threadId}&type=email`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError('Failed to start email draft generation. Please try again.');
      console.error('Error generating email draft:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to start email draft generation. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Schedule meeting from note
  const scheduleMeeting = async () => {
    if (!selectedNoteId) {
      setSnackbar({
        open: true,
        message: 'Please select a note to schedule a meeting.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingResult(null);
      setProcessingType('meeting');
      
      const response = await axios.post('/api/notes/schedule-meeting', {
        noteId: selectedNoteId
      });
      
      setThreadId(response.data.threadId);
      setLoading(false);
      
      // Update URL with note ID and thread ID
      navigate(`/notes/process/${selectedNoteId}?thread=${response.data.threadId}&type=meeting`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError('Failed to start meeting scheduling. Please try again.');
      console.error('Error scheduling meeting:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to start meeting scheduling. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Sync note with SAP Sales Cloud
  const syncWithSAP = async () => {
    if (!selectedNoteId) {
      setSnackbar({
        open: true,
        message: 'Please select a note to sync with SAP Sales Cloud.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingResult(null);
      setProcessingType('sap');
      
      const response = await axios.post('/api/notes/sync-sap', {
        noteId: selectedNoteId
      });
      
      setThreadId(response.data.threadId);
      setLoading(false);
      
      // Update URL with note ID and thread ID
      navigate(`/notes/process/${selectedNoteId}?thread=${response.data.threadId}&type=sap`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError('Failed to start SAP sync. Please try again.');
      console.error('Error syncing with SAP:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to start SAP sync. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Chat with AI about note
  const chatWithAI = async () => {
    if (!selectedNoteId) {
      setSnackbar({
        open: true,
        message: 'Please select a note to chat about.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setProcessingResult(null);
      setProcessingType('chat');
      
      const response = await axios.post('/api/notes/chat', {
        noteId: selectedNoteId,
        message: 'Tell me about this note'
      });
      
      setThreadId(response.data.threadId);
      setLoading(false);
      
      // Update URL with note ID and thread ID
      navigate(`/notes/process/${selectedNoteId}?thread=${response.data.threadId}&type=chat`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError('Failed to start AI chat. Please try again.');
      console.error('Error starting AI chat:', err);
      
      setSnackbar({
        open: true,
        message: 'Failed to start AI chat. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Handle processing completion
  const handleProcessingComplete = (result) => {
    setProcessingResult(result);
    
    setSnackbar({
      open: true,
      message: 'Processing completed successfully!',
      severity: 'success'
    });
    
    // If we processed a note, refresh the notes list to get updated data
    if (processingType === 'process') {
      fetchNotes();
    }
  };
  
  // Handle processing error
  const handleProcessingError = (error) => {
    setError(`Processing error: ${error.message}`);
    
    setSnackbar({
      open: true,
      message: `Processing error: ${error.message}`,
      severity: 'error'
    });
  };
  
  // Handle processing cancellation
  const handleProcessingCancel = () => {
    setSnackbar({
      open: true,
      message: 'Processing cancelled.',
      severity: 'info'
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Render note selection
  const renderNoteSelection = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Select Note</InputLabel>
              <Select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                label="Select Note"
                disabled={loading}
              >
                {notes.length === 0 ? (
                  <MenuItem value="" disabled>
                    No notes available
                  </MenuItem>
                ) : (
                  notes.map((note) => (
                    <MenuItem key={note._id} value={note._id}>
                      {note.title || `Note ${note._id.substring(0, 8)}`}
                      {note.aiProcessed && (
                        <CheckCircleIcon 
                          color="success" 
                          fontSize="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchNotes}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/notes/new')}
                disabled={loading}
              >
                New Note
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render action buttons
  const renderActionButtons = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SummarizeIcon />}
              onClick={processNote}
              disabled={!selectedNoteId || loading || threadId !== null}
            >
              Process
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<EmailIcon />}
              onClick={generateEmailDraft}
              disabled={!selectedNoteId || loading || threadId !== null}
            >
              Email
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="info"
              startIcon={<EventIcon />}
              onClick={scheduleMeeting}
              disabled={!selectedNoteId || loading || threadId !== null}
            >
              Meeting
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<SyncIcon />}
              onClick={syncWithSAP}
              disabled={!selectedNoteId || loading || threadId !== null}
            >
              SAP Sync
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<ChatIcon />}
              onClick={chatWithAI}
              disabled={!selectedNoteId || loading || threadId !== null}
            >
              AI Chat
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate(`/notes/${selectedNoteId}`)}
              disabled={!selectedNoteId || loading}
            >
              View
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render note details
  const renderNoteDetails = () => {
    if (!selectedNote) {
      return (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No note selected. Please select a note to process.
          </Typography>
        </Paper>
      );
    }
    
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {selectedNote.title || `Note ${selectedNote._id.substring(0, 8)}`}
          {selectedNote.aiProcessed && (
            <Tooltip title="AI Processed">
              <CheckCircleIcon 
                color="success" 
                fontSize="small" 
                sx={{ ml: 1, verticalAlign: 'middle' }}
              />
            </Tooltip>
          )}
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Original Content:
            </Typography>
            <Box 
              sx={{ 
                p: 1, 
                maxHeight: '200px', 
                overflowY: 'auto',
                backgroundColor: '#f5f5f5',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedNote.originalContent}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {selectedNote.aiProcessed ? (
              <>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  AI Summary:
                </Typography>
                <Box 
                  sx={{ 
                    p: 1, 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    backgroundColor: '#e8f5e9',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {selectedNote.summary || 'No summary available.'}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="textSecondary" align="center">
                  This note has not been processed by AI yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<SummarizeIcon />}
                  onClick={processNote}
                  sx={{ mt: 2 }}
                  disabled={loading || threadId !== null}
                >
                  Process Now
                </Button>
              </Box>
            )}
          </Grid>
          
          {selectedNote.aiProcessed && selectedNote.actionItems && selectedNote.actionItems.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 1 }}>
                Action Items:
              </Typography>
              <Box 
                sx={{ 
                  p: 1, 
                  backgroundColor: '#fff8e1',
                  borderRadius: 1
                }}
              >
                {selectedNote.actionItems.map((item, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{index + 1}.</strong> {item.description}
                      {item.priority && (
                        <Chip
                          label={item.priority}
                          size="small"
                          color={
                            item.priority === 'high' ? 'error' :
                            item.priority === 'medium' ? 'warning' : 'default'
                          }
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    {(item.assignedTo || item.dueDate) && (
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 3 }}>
                        {item.assignedTo && `Assigned to: ${item.assignedTo}`}
                        {item.assignedTo && item.dueDate && ' | '}
                        {item.dueDate && `Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };
  
  // Render processing stream
  const renderProcessingStream = () => {
    if (!threadId) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {processingType === 'process' && 'Processing Note'}
            {processingType === 'email' && 'Generating Email Draft'}
            {processingType === 'meeting' && 'Scheduling Meeting'}
            {processingType === 'sap' && 'Syncing with SAP Sales Cloud'}
            {processingType === 'chat' && 'AI Chat'}
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ height: '400px' }}>
            <AGUIStreamComponent
              threadId={threadId}
              onComplete={handleProcessingComplete}
              onError={handleProcessingError}
              onCancel={handleProcessingCancel}
              autoScroll={true}
            />
          </Box>
        </Paper>
      </Box>
    );
  };
  
  // Render processing result
  const renderProcessingResult = () => {
    if (!processingResult) {
      return null;
    }
    
    return (
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          {processingType === 'email' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Email Draft
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>To:</strong> {processingResult.to || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Subject:</strong> {processingResult.subject || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                  {processingResult.body || 'No content available.'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<EmailIcon />}>
                  Open in Email Client
                </Button>
                <Button size="small" startIcon={<SaveIcon />}>
                  Save Draft
                </Button>
              </CardActions>
            </Card>
          )}
          
          {processingType === 'meeting' && processingResult.meetingProposal && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Meeting Proposal
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Subject:</strong> {processingResult.meetingProposal.subject || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Participants:</strong> {processingResult.meetingProposal.participants?.join(', ') || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Duration:</strong> {processingResult.meetingProposal.duration || 'N/A'} minutes
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Suggested Dates:</strong> {processingResult.meetingProposal.suggestedDates?.join(', ') || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                  {processingResult.meetingProposal.description || 'No description available.'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<EventIcon />}>
                  Open in Calendar
                </Button>
                <Button size="small" startIcon={<SaveIcon />}>
                  Save Meeting
                </Button>
              </CardActions>
            </Card>
          )}
          
          {processingType === 'sap' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  SAP Sync Results
                </Typography>
                {processingResult.status === 'error' ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {processingResult.error || 'An error occurred during synchronization.'}
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Activity Created:</strong> {processingResult.activityCreated ? 'Yes' : 'No'}
                      {processingResult.activityId && ` (ID: ${processingResult.activityId})`}
                    </Typography>
                    
                    {processingResult.syncedActionItems && processingResult.syncedActionItems.length > 0 && (
                      <>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          <strong>Synced Action Items:</strong>
                        </Typography>
                        <Box sx={{ ml: 2 }}>
                          {processingResult.syncedActionItems.map((item, index) => (
                            <Typography key={index} variant="body2" gutterBottom>
                              {item.status === 'synced' ? (
                                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                              ) : (
                                <ErrorIcon color="error" fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                              )}
                              {item.description}
                              {item.sapTaskId && ` (ID: ${item.sapTaskId})`}
                            </Typography>
                          ))}
                        </Box>
                      </>
                    )}
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Opportunity Updated:</strong> {processingResult.opportunityUpdated ? 'Yes' : 'No'}
                    </Typography>
                  </>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<SyncIcon />}>
                  View in SAP
                </Button>
              </CardActions>
            </Card>
          )}
          
          {processingType === 'process' && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Processing Results
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Summary:</strong>
                </Typography>
                <Box 
                  sx={{ 
                    p: 1, 
                    mb: 2,
                    backgroundColor: '#e8f5e9',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2">
                    {processingResult.summary || 'No summary generated.'}
                  </Typography>
                </Box>
                
                {processingResult.actionItems && processingResult.actionItems.length > 0 && (
                  <>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Action Items:</strong>
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1, 
                        mb: 2,
                        backgroundColor: '#fff8e1',
                        borderRadius: 1
                      }}
                    >
                      {processingResult.actionItems.map((item, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{index + 1}.</strong> {item.description}
                            {item.priority && (
                              <Chip
                                label={item.priority}
                                size="small"
                                color={
                                  item.priority === 'high' ? 'error' :
                                  item.priority === 'medium' ? 'warning' : 'default'
                                }
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          {(item.assignedTo || item.dueDate) && (
                            <Typography variant="caption" color="textSecondary" sx={{ ml: 3 }}>
                              {item.assignedTo && `Assigned to: ${item.assignedTo}`}
                              {item.assignedTo && item.dueDate && ' | '}
                              {item.dueDate && `Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
                
                {processingResult.extractedInfo && processingResult.extractedInfo.entities && (
                  <>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Extracted Entities:</strong>
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1,
                        backgroundColor: '#e3f2fd',
                        borderRadius: 1
                      }}
                    >
                      <Grid container spacing={2}>
                        {processingResult.extractedInfo.entities.people && processingResult.extractedInfo.entities.people.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="textSecondary">People:</Typography>
                            <Box sx={{ ml: 1 }}>
                              {processingResult.extractedInfo.entities.people.map((person, index) => (
                                <Chip key={index} label={person} size="small" sx={{ m: 0.5 }} />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        
                        {processingResult.extractedInfo.entities.dates && processingResult.extractedInfo.entities.dates.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="textSecondary">Dates:</Typography>
                            <Box sx={{ ml: 1 }}>
                              {processingResult.extractedInfo.entities.dates.map((date, index) => (
                                <Chip key={index} label={date} size="small" sx={{ m: 0.5 }} />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        
                        {processingResult.extractedInfo.entities.monetaryValues && processingResult.extractedInfo.entities.monetaryValues.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="textSecondary">Monetary Values:</Typography>
                            <Box sx={{ ml: 1 }}>
                              {processingResult.extractedInfo.entities.monetaryValues.map((value, index) => (
                                <Chip key={index} label={value} size="small" sx={{ m: 0.5 }} />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        
                        {processingResult.extractedInfo.entities.products && processingResult.extractedInfo.entities.products.length > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="textSecondary">Products:</Typography>
                            <Box sx={{ ml: 1 }}>
                              {processingResult.extractedInfo.entities.products.map((product, index) => (
                                <Chip key={index} label={product} size="small" sx={{ m: 0.5 }} />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<SaveIcon />}>
                  Save Results
                </Button>
              </CardActions>
            </Card>
          )}
        </Paper>
      </Box>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Note Processor
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Select a note and use AI to process it, generate email drafts, schedule meetings, or sync with SAP Sales Cloud.
      </Typography>
      
      {/* Note selection */}
      {renderNoteSelection()}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Action buttons */}
      {renderActionButtons()}
      
      {/* Tabs for different sections */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Note Details" />
          {threadId && <Tab label="Processing" />}
          {processingResult && <Tab label="Results" />}
        </Tabs>
      </Box>
      
      {/* Tab content */}
      {activeTab === 0 && renderNoteDetails()}
      {activeTab === 1 && threadId && renderProcessingStream()}
      {activeTab === 2 && processingResult && renderProcessingResult()}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NoteProcessorPage;
