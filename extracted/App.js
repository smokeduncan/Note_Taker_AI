import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AccountSelectionPage from './pages/AccountSelectionPage';
import NoteTakingPage from './pages/NoteTakingPage';
import Header from './components/Header';
import Footer from './components/Footer';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
    },
    secondary: {
      main: '#3498db',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/accounts" replace />} />
          <Route path="/accounts" element={<AccountSelectionPage />} />
          <Route path="/notes/:accountId" element={<NoteTakingPage />} />
          <Route path="/notes" element={<Navigate to="/accounts" replace />} />
          {/* Additional routes will be added as we implement more features */}
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;
