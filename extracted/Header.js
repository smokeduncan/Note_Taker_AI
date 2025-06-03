import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NoteAltIcon from '@mui/icons-material/NoteAlt';

const Header = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <NoteAltIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'white' }}>
              CRM Note-Taking App
            </Typography>
          </Box>
          <Button color="inherit" component={RouterLink} to="/accounts">
            Accounts
          </Button>
          <Button color="inherit" component={RouterLink} to="/notes">
            Notes
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
