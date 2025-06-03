import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, InputAdornment, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Business as BusinessIcon } from '@mui/icons-material';
import axios from 'axios';

const AccountSelection = ({ onAccountSelect }) => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/accounts');
        setAccounts(response.data.data);
        setFilteredAccounts(response.data.data);
        
        // Extract unique industries for filtering
        const uniqueIndustries = [...new Set(response.data.data.map(account => account.industry))];
        setIndustries(uniqueIndustries.filter(industry => industry)); // Remove null/undefined
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch accounts. Please try again later.');
        setLoading(false);
        console.error('Error fetching accounts:', err);
      }
    };

    fetchAccounts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      // If search is cleared, show all accounts or industry-filtered accounts
      if (selectedIndustry) {
        const industryFiltered = accounts.filter(account => 
          account.industry === selectedIndustry
        );
        setFilteredAccounts(industryFiltered);
      } else {
        setFilteredAccounts(accounts);
      }
    } else {
      // Filter by search term and possibly industry
      const searchFiltered = accounts.filter(account => 
        account.name.toLowerCase().includes(value.toLowerCase()) &&
        (selectedIndustry ? account.industry === selectedIndustry : true)
      );
      setFilteredAccounts(searchFiltered);
    }
  };

  // Handle industry filter selection
  const handleIndustrySelect = (industry) => {
    if (selectedIndustry === industry) {
      // If clicking the same industry, clear the filter
      setSelectedIndustry('');
      
      // Apply only search filter if present
      if (searchTerm) {
        const searchFiltered = accounts.filter(account => 
          account.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredAccounts(searchFiltered);
      } else {
        setFilteredAccounts(accounts);
      }
    } else {
      // Set new industry filter
      setSelectedIndustry(industry);
      
      // Apply both industry and search filters
      const filtered = accounts.filter(account => 
        account.industry === industry &&
        (searchTerm ? account.name.toLowerCase().includes(searchTerm.toLowerCase()) : true)
      );
      setFilteredAccounts(filtered);
    }
  };

  // Handle account selection
  const handleAccountSelect = (account) => {
    onAccountSelect(account);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Select an Account
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search accounts..."
        value={searchTerm}
        onChange={handleSearchChange}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ my: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {industries.map((industry) => (
          <Chip
            key={industry}
            label={industry}
            clickable
            color={selectedIndustry === industry ? "primary" : "default"}
            onClick={() => handleIndustrySelect(industry)}
          />
        ))}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account, index) => (
                  <React.Fragment key={account._id}>
                    <ListItem 
                      alignItems="flex-start" 
                      button 
                      onClick={() => handleAccountSelect(account)}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <BusinessIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={account.name}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {account.industry}
                            </Typography>
                            {` — ${account.type || 'Customer'}`}
                            <br />
                            {`ID: ${account.accountId}`}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < filteredAccounts.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No accounts found" 
                    secondary="Try adjusting your search or filters"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AccountSelection;
