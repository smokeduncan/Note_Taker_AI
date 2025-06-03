import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Chip, CircularProgress } from '@mui/material';
import axios from 'axios';

const NotesList = ({ accountId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      if (!accountId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/accounts/${accountId}/notes`);
        setNotes(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again.');
        setLoading(false);
      }
    };

    fetchNotes();
  }, [accountId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }

  if (notes.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
        <Typography variant="body1" align="center">
          No notes found for this account. Create your first note above.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mt: 3 }}>
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Recent Notes
        </Typography>
      </Box>
      <Divider />
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {notes.map((note, index) => (
          <React.Fragment key={note._id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">{note.title}</Typography>
                    <Box>
                      {note.isVoiceNote && (
                        <Chip 
                          label="Voice" 
                          size="small" 
                          color="secondary" 
                          sx={{ mr: 1 }} 
                        />
                      )}
                      {note.aiProcessed && (
                        <Chip 
                          label="AI Processed" 
                          size="small" 
                          color="primary" 
                        />
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {new Date(note.createdAt).toLocaleString()}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        display: 'block', 
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {note.summary || note.originalContent.substring(0, 200) + (note.originalContent.length > 200 ? '...' : '')}
                    </Typography>
                    {note.actionItems && note.actionItems.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.primary">
                          Action Items: {note.actionItems.length}
                        </Typography>
                      </Box>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < notes.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default NotesList;
