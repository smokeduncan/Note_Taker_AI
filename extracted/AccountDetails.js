import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Divider, Chip, Avatar, Button } from '@mui/material';
import { Business as BusinessIcon, Person as PersonIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';

const AccountDetails = ({ account }) => {
  if (!account) {
    return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <BusinessIcon />
            </Avatar>
            <Typography variant="h5">{account.name}</Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={account.industry} 
              color="primary" 
              size="small" 
              sx={{ mr: 1 }} 
            />
            <Chip 
              label={account.status || 'Active'} 
              color={account.status === 'Inactive' ? 'error' : 'success'} 
              size="small" 
              sx={{ mr: 1 }} 
            />
            <Chip 
              label={account.type || 'Customer'} 
              variant="outlined" 
              size="small" 
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Account ID: {account.accountId}
          </Typography>
          
          {account.website && (
            <Typography variant="body2" gutterBottom>
              Website: <a href={account.website} target="_blank" rel="noopener noreferrer">{account.website}</a>
            </Typography>
          )}
          
          {account.address && (
            <Typography variant="body2" gutterBottom>
              Address: {account.address.street}, {account.address.city}, {account.address.state} {account.address.zipCode}, {account.address.country}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Account Details
            </Typography>
            
            {account.revenue && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Annual Revenue:</Typography>
                <Typography variant="body2">${account.revenue.toLocaleString()}</Typography>
              </Box>
            )}
            
            {account.employeeCount && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Employees:</Typography>
                <Typography variant="body2">{account.employeeCount.toLocaleString()}</Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Last Activity:</Typography>
              <Typography variant="body2">
                {new Date(account.lastActivity).toLocaleDateString()}
              </Typography>
            </Box>
            
            {account.owner && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Account Owner:</Typography>
                <Typography variant="body2">{account.owner.name}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {account.contacts && account.contacts.length > 0 && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Key Contacts
            </Typography>
            
            <Grid container spacing={2}>
              {account.contacts.map((contact, index) => (
                <Grid item xs={12} sm={6} md={4} key={contact.contactId || index}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 1, width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle2">
                        {contact.name}
                        {contact.isPrimary && (
                          <Chip 
                            label="Primary" 
                            color="primary" 
                            size="small" 
                            sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} 
                          />
                        )}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {contact.title}
                    </Typography>
                    
                    {contact.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{contact.email}</Typography>
                      </Box>
                    )}
                    
                    {contact.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{contact.phone}</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AccountDetails;
