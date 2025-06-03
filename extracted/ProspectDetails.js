import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Grid,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { 
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as MeetingIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  AttachFile as FileIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

const ProspectDetails = ({ account }) => {
  const [prospects, setProspects] = useState([]);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProspects = async () => {
      if (!account) return;
      
      try {
        setLoading(true);
        
        // Fetch prospects for this account
        const response = await axios.get(`/api/accounts/${account._id}/prospects`);
        setProspects(response.data.data || []);
        
        // Select the first prospect by default if available
        if (response.data.data && response.data.data.length > 0) {
          setSelectedProspect(response.data.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching prospects:', err);
        setError('Failed to load prospects. Please try again.');
        setLoading(false);
      }
    };

    fetchProspects();
  }, [account]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

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

  if (!account) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Please select an account to view prospects
        </Typography>
      </Paper>
    );
  }

  if (prospects.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          No prospects found for {account.name}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prospects for {account.name}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ height: '100%' }}>
            <List sx={{ p: 0 }}>
              {prospects.map((prospect) => (
                <ListItem 
                  key={prospect._id} 
                  button 
                  selected={selectedProspect && selectedProspect._id === prospect._id}
                  onClick={() => handleProspectSelect(prospect)}
                  divider
                >
                  <ListItemIcon>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${prospect.firstName} ${prospect.lastName}`}
                    secondary={prospect.title}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {selectedProspect ? (
            <Card>
              <CardHeader
                title={`${selectedProspect.firstName} ${selectedProspect.lastName}`}
                subheader={selectedProspect.title}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedProspect.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedProspect.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {account.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={selectedProspect.status} 
                      color={
                        selectedProspect.status === 'active' ? 'success' : 
                        selectedProspect.status === 'lead' ? 'primary' : 
                        selectedProspect.status === 'opportunity' ? 'warning' : 
                        'default'
                      } 
                      size="small"
                    />
                  </Grid>
                  {selectedProspect.lastContactDate && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Contact
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(selectedProspect.lastContactDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                  {selectedProspect.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedProspect.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a prospect to view details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProspectDetails;
