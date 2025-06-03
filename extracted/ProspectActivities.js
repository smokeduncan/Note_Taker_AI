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
  IconButton
} from '@mui/material';
import { 
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as MeetingIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  AttachFile as FileIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

const ProspectActivities = ({ account }) => {
  const [activities, setActivities] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchProspectsAndActivities = async () => {
      if (!account) return;
      
      try {
        setLoading(true);
        
        // Fetch prospects for this account
        const prospectsResponse = await axios.get(`/api/accounts/${account._id}/prospects`);
        setProspects(prospectsResponse.data.data || []);
        
        // Fetch activities for all prospects of this account
        const activitiesResponse = await axios.get(`/api/accounts/${account._id}/activities`);
        setActivities(activitiesResponse.data.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching prospect activities:', err);
        setError('Failed to load prospect activities. Please try again.');
        setLoading(false);
      }
    };

    fetchProspectsAndActivities();
  }, [account]);

  const getProspectName = (prospectId) => {
    const prospect = prospects.find(p => p._id === prospectId);
    return prospect ? `${prospect.firstName} ${prospect.lastName}` : 'Unknown Prospect';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email':
        return <EmailIcon color="primary" />;
      case 'call':
        return <PhoneIcon color="secondary" />;
      case 'meeting':
        return <MeetingIcon color="success" />;
      case 'download':
        return <DownloadIcon color="info" />;
      case 'view':
        return <ViewIcon color="action" />;
      case 'file':
        return <FileIcon color="warning" />;
      default:
        return <EmailIcon color="primary" />;
    }
  };

  const getActivityTypeLabel = (type) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Phone Call';
      case 'meeting':
        return 'Meeting';
      case 'download':
        return 'Download';
      case 'view':
        return 'Page View';
      case 'file':
        return 'File Access';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  const filteredActivities = activities
    .filter(activity => {
      // Apply search filter
      if (searchTerm) {
        const prospectName = getProspectName(activity.prospectId).toLowerCase();
        const description = activity.description.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return prospectName.includes(searchLower) || 
               description.includes(searchLower) ||
               activity.type.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(activity => {
      // Apply type filter
      if (filterType === 'all') return true;
      return activity.type === filterType;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent

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
          Please select an account to view prospect activities
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prospect Activities for {account.name}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search activities..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant={filterType === 'all' ? 'contained' : 'outlined'} 
                size="small"
                onClick={() => handleFilterChange('all')}
              >
                All
              </Button>
              <Button 
                variant={filterType === 'email' ? 'contained' : 'outlined'} 
                size="small"
                startIcon={<EmailIcon />}
                onClick={() => handleFilterChange('email')}
              >
                Emails
              </Button>
              <Button 
                variant={filterType === 'call' ? 'contained' : 'outlined'} 
                size="small"
                startIcon={<PhoneIcon />}
                onClick={() => handleFilterChange('call')}
              >
                Calls
              </Button>
              <Button 
                variant={filterType === 'meeting' ? 'contained' : 'outlined'} 
                size="small"
                startIcon={<MeetingIcon />}
                onClick={() => handleFilterChange('meeting')}
              >
                Meetings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {filteredActivities.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ py: 3 }}>
          No activities found for the selected filters.
        </Typography>
      ) : (
        <List>
          {filteredActivities.map((activity, index) => (
            <Paper 
              key={activity._id || index} 
              variant="outlined" 
              sx={{ mb: 2, overflow: 'hidden' }}
            >
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {getActivityIcon(activity.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {getProspectName(activity.prospectId)}
                      </Typography>
                      <Chip 
                        label={getActivityTypeLabel(activity.type)} 
                        size="small" 
                        color={
                          activity.type === 'email' ? 'primary' : 
                          activity.type === 'call' ? 'secondary' : 
                          activity.type === 'meeting' ? 'success' : 
                          'default'
                        } 
                      />
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
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {activity.description}
                      </Typography>
                      {activity.metadata && (
                        <Box sx={{ mt: 1 }}>
                          {activity.metadata.subject && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Subject:</strong> {activity.metadata.subject}
                            </Typography>
                          )}
                          {activity.metadata.duration && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Duration:</strong> {activity.metadata.duration} minutes
                            </Typography>
                          )}
                          {activity.metadata.outcome && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Outcome:</strong> {activity.metadata.outcome}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ProspectActivities;
