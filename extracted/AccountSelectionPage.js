import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountSelection from '../components/AccountSelection';
import AccountDetails from '../components/AccountDetails';

const AccountSelectionPage = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const navigate = useNavigate();

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setShowAccountDetails(true);
  };

  const handleBackToSelection = () => {
    setShowAccountDetails(false);
  };

  const handleProceedToNotes = () => {
    navigate(`/notes/${selectedAccount._id}`);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        {!showAccountDetails ? (
          <AccountSelection onAccountSelect={handleAccountSelect} />
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Account Details</Typography>
              <Button 
                variant="outlined" 
                onClick={handleBackToSelection}
              >
                Back to Account Selection
              </Button>
            </Box>
            
            <AccountDetails account={selectedAccount} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleProceedToNotes}
              >
                Take Notes for This Account
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AccountSelectionPage;
