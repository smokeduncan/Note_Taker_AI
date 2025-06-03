import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Divider, 
  Grid,
  Button,
  Tab,
  Tabs
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AccountDetails from '../components/AccountDetails';
import NoteTaking from '../components/NoteTaking';
import NotesList from '../components/NotesList';
import NoteProcessing from '../components/NoteProcessing';
import ActionItemExecution from '../components/ActionItemExecution';
import ProspectActivities from '../components/ProspectActivities';
import ProspectDetails from '../components/ProspectDetails';

const NoteTakingPage = () => {
  const [account, setAccount] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { accountId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        if (accountId) {
          const response = await axios.get(`/api/accounts/${accountId}`);
          setAccount(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching account:', err);
        setError('Failed to load account details. Please try again.');
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const handleNoteSaved = (note) => {
    console.log('Note saved:', note);
    // Refresh the notes list
    setActiveTab(1); // Switch to the Notes tab
  };

  const handleNoteSelected = (note) => {
    setSelectedNote(note);
    setActiveTab(2); // Switch to the AI Processing tab
  };

  const handleProcessingComplete = (type, result) => {
    console.log(`Processing complete: ${type}`, result);
    // If action items were extracted, switch to the Action Items tab
    if (type === 'extract-actions') {
      setActiveTab(3);
    }
  };

  const handleActionExecuted = (type, actionItem) => {
    console.log(`Action executed: ${type}`, actionItem);
    // In a real implementation, we might update the UI or perform additional actions
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBackToAccounts = () => {
    navigate('/accounts');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, my: 4 }}>
          <Typography>Loading account details...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, my: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={handleBackToAccounts}
            sx={{ mt: 2 }}
          >
            Back to Accounts
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Account Notes</Typography>
          <Button 
            variant="outlined" 
            onClick={handleBackToAccounts}
          >
            Back to Account Selection
          </Button>
        </Box>

        {account && (
          <>
            <AccountDetails account={account} />
            <Divider sx={{ my: 3 }} />
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ mb: 3 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Take Notes" />
              <Tab label="View Notes" />
              <Tab label="AI Processing" />
              <Tab label="Action Items" />
              <Tab label="Prospect Activities" />
              <Tab label="Prospect Details" />
            </Tabs>
            
            {activeTab === 0 && (
              <NoteTaking account={account} onNoteSaved={handleNoteSaved} />
            )}
            
            {activeTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <NotesList 
                    accountId={account._id} 
                    onNoteSelect={handleNoteSelected}
                  />
                </Grid>
              </Grid>
            )}
            
            {activeTab === 2 && (
              <NoteProcessing 
                note={selectedNote} 
                onProcessingComplete={handleProcessingComplete} 
              />
            )}
            
            {activeTab === 3 && (
              <ActionItemExecution 
                note={selectedNote} 
                onActionExecuted={handleActionExecuted} 
              />
            )}
            
            {activeTab === 4 && (
              <ProspectActivities account={account} />
            )}
            
            {activeTab === 5 && (
              <ProspectDetails account={account} />
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NoteTakingPage;
