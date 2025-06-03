import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Assignment as ActionItemsIcon,
  Email as EmailIcon,
  Event as MeetingIcon,
  Check as CompleteIcon,
  Delete as CancelIcon,
  Edit as EditIcon,
  Send as SendIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const ActionItemExecution = ({ note, onActionExecuted }) => {
  const [selectedActionItem, setSelectedActionItem] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [meetingData, setMeetingData] = useState({ 
    title: '', 
    description: '', 
    startTime: new Date(), 
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    attendees: '',
    location: 'Virtual Meeting'
  });
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleActionItemClick = (actionItem) => {
    setSelectedActionItem(actionItem);
  };

  const handleCompleteActionItem = async (actionItem) => {
    if (!note || !actionItem) return;

    try {
      setLoading(true);
      
      // Find the action item in the note
      const updatedActionItems = note.actionItems.map(item => {
        if (item.description === actionItem.description) {
          return {
            ...item,
            status: 'completed',
            completedAt: new Date()
          };
        }
        return item;
      });
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        actionItems: updatedActionItems
      });
      
      setLoading(false);
      showSnackbar('Action item marked as completed', 'success');
      
      if (onActionExecuted) {
        onActionExecuted('complete', actionItem);
      }
    } catch (err) {
      setLoading(false);
      console.error('Error completing action item:', err);
      showSnackbar('Error completing action item', 'error');
    }
  };

  const handleCancelActionItem = async (actionItem) => {
    if (!note || !actionItem) return;

    try {
      setLoading(true);
      
      // Find the action item in the note
      const updatedActionItems = note.actionItems.map(item => {
        if (item.description === actionItem.description) {
          return {
            ...item,
            status: 'cancelled'
          };
        }
        return item;
      });
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        actionItems: updatedActionItems
      });
      
      setLoading(false);
      showSnackbar('Action item cancelled', 'success');
      
      if (onActionExecuted) {
        onActionExecuted('cancel', actionItem);
      }
    } catch (err) {
      setLoading(false);
      console.error('Error cancelling action item:', err);
      showSnackbar('Error cancelling action item', 'error');
    }
  };

  const handleOpenEmailDialog = (actionItem) => {
    setSelectedActionItem(actionItem);
    
    // Generate email content based on action item
    const emailSubject = `Action Required: ${actionItem.description}`;
    const emailBody = `Hello,

I'm following up on our recent conversation regarding ${note.title}.

Action required: ${actionItem.description}
Due date: ${new Date(actionItem.dueDate).toLocaleDateString()}
Priority: ${actionItem.priority}

Please let me know if you have any questions.

Best regards,
[Your Name]`;

    setEmailData({
      to: '',
      subject: emailSubject,
      body: emailBody
    });
    
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      showSnackbar('Please fill in all email fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, we would send the email via an API
      // For now, we'll simulate sending the email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the action item status
      const updatedActionItems = note.actionItems.map(item => {
        if (item.description === selectedActionItem.description) {
          return {
            ...item,
            status: 'pending',
            lastUpdated: new Date()
          };
        }
        return item;
      });
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        actionItems: updatedActionItems
      });
      
      setLoading(false);
      setEmailDialogOpen(false);
      showSnackbar('Email sent successfully', 'success');
      
      if (onActionExecuted) {
        onActionExecuted('email', selectedActionItem);
      }
    } catch (err) {
      setLoading(false);
      console.error('Error sending email:', err);
      showSnackbar('Error sending email', 'error');
    }
  };

  const handleOpenMeetingDialog = (actionItem) => {
    setSelectedActionItem(actionItem);
    
    // Generate meeting details based on action item
    const meetingTitle = `Meeting: ${actionItem.description}`;
    const meetingDescription = `Follow-up meeting regarding ${note.title}.\n\nAction item: ${actionItem.description}`;
    
    // Set meeting time to the action item due date if it's in the future
    const dueDate = new Date(actionItem.dueDate);
    const now = new Date();
    const startTime = dueDate > now ? dueDate : new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    setMeetingData({
      title: meetingTitle,
      description: meetingDescription,
      startTime,
      endTime,
      attendees: actionItem.assignedTo || '',
      location: 'Virtual Meeting'
    });
    
    setMeetingDialogOpen(true);
  };

  const handleCloseMeetingDialog = () => {
    setMeetingDialogOpen(false);
  };

  const handleScheduleMeeting = async () => {
    if (!meetingData.title || !meetingData.startTime || !meetingData.endTime) {
      showSnackbar('Please fill in all meeting fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, we would schedule the meeting via an API
      // For now, we'll simulate scheduling the meeting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the action item status
      const updatedActionItems = note.actionItems.map(item => {
        if (item.description === selectedActionItem.description) {
          return {
            ...item,
            status: 'pending',
            lastUpdated: new Date()
          };
        }
        return item;
      });
      
      // Update the note in the database
      await axios.put(`/api/notes/${note._id}`, {
        actionItems: updatedActionItems
      });
      
      setLoading(false);
      setMeetingDialogOpen(false);
      showSnackbar('Meeting scheduled successfully', 'success');
      
      if (onActionExecuted) {
        onActionExecuted('meeting', selectedActionItem);
      }
    } catch (err) {
      setLoading(false);
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

  if (!note || !note.actionItems || note.actionItems.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          No action items available
        </Typography>
        <Typography variant="body1">
          Process your note with AI to extract action items first.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Action Items for: {note.title}
      </Typography>
      
      <List>
        {note.actionItems.map((actionItem, index) => (
          <Paper 
            key={index} 
            variant="outlined" 
            sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: actionItem.status === 'completed' ? 'success.50' : 
                      actionItem.status === 'cancelled' ? 'grey.100' : 'background.paper',
              opacity: actionItem.status === 'cancelled' ? 0.7 : 1
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ActionItemsIcon color={
                      actionItem.priority === 'high' ? 'error' : 
                      actionItem.priority === 'medium' ? 'warning' : 'info'
                    } />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          textDecoration: actionItem.status === 'completed' || actionItem.status === 'cancelled' 
                            ? 'line-through' 
                            : 'none'
                        }}
                      >
                        {actionItem.description}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {actionItem.assignedTo}
                        </Typography>
                        {` — Due: ${new Date(actionItem.dueDate).toLocaleDateString()}`}
                      </>
                    }
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Chip 
                    label={actionItem.status} 
                    color={
                      actionItem.status === 'completed' ? 'success' : 
                      actionItem.status === 'cancelled' ? 'default' : 
                      actionItem.priority === 'high' ? 'error' : 
                      actionItem.priority === 'medium' ? 'warning' : 'info'
                    } 
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {actionItem.status !== 'completed' && actionItem.status !== 'cancelled' && (
                    <>
                      <Tooltip title="Mark as Complete">
                        <IconButton 
                          color="success" 
                          onClick={() => handleCompleteActionItem(actionItem)}
                          disabled={loading}
                        >
                          <CompleteIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Send Email">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenEmailDialog(actionItem)}
                          disabled={loading}
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Schedule Meeting">
                        <IconButton 
                          color="secondary" 
                          onClick={() => handleOpenMeetingDialog(actionItem)}
                          disabled={loading}
                        >
                          <MeetingIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Cancel">
                        <IconButton 
                          color="error" 
                          onClick={() => handleCancelActionItem(actionItem)}
                          disabled={loading}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </List>
      
      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={handleCloseEmailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent>
          <TextField
            label="To"
            fullWidth
            margin="normal"
            value={emailData.to}
            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
          />
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            value={emailData.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
          />
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={8}
            margin="normal"
            value={emailData.body}
            onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSendEmail}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Meeting Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={meetingDialogOpen} onClose={handleCloseMeetingDialog} maxWidth="md" fullWidth>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogContent>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={meetingData.title}
              onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              margin="normal"
              value={meetingData.description}
              onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Time"
                  value={meetingData.startTime}
                  onChange={(newValue) => setMee
(Content truncated due to size limit. Use line ranges to read in chunks)