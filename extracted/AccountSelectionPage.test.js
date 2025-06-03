import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AccountSelectionPage from '../pages/AccountSelectionPage';

// Mock axios
jest.mock('axios');

// Mock data
const mockAccounts = [
  {
    _id: '1',
    name: 'Acme Corporation',
    industry: 'Technology',
    website: 'https://acme.example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, San Francisco, CA 94105',
    revenue: 5000000,
    employees: 250,
    status: 'active',
    type: 'customer',
    createdAt: '2023-01-15T08:30:00.000Z',
    updatedAt: '2023-03-20T14:45:00.000Z'
  },
  {
    _id: '2',
    name: 'Globex Industries',
    industry: 'Manufacturing',
    website: 'https://globex.example.com',
    phone: '(555) 987-6543',
    address: '456 Market St, Chicago, IL 60601',
    revenue: 12000000,
    employees: 500,
    status: 'active',
    type: 'customer',
    createdAt: '2023-02-10T10:15:00.000Z',
    updatedAt: '2023-04-05T09:30:00.000Z'
  }
];

describe('AccountSelectionPage Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: { data: mockAccounts } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders account selection page with search and filter options', async () => {
    render(
      <BrowserRouter>
        <AccountSelectionPage />
      </BrowserRouter>
    );

    // Check if the title is rendered
    expect(screen.getByText('Select an Account')).toBeInTheDocument();

    // Check if search input is rendered
    expect(screen.getByPlaceholderText('Search accounts...')).toBeInTheDocument();

    // Check if filter options are rendered
    expect(screen.getByText('All Accounts')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Prospects')).toBeInTheDocument();

    // Wait for accounts to be loaded
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith('/api/accounts');
    });

    // Check if accounts are rendered
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Globex Industries')).toBeInTheDocument();
    });
  });

  test('filters accounts when search term is entered', async () => {
    render(
      <BrowserRouter>
        <AccountSelectionPage />
      </BrowserRouter>
    );

    // Wait for accounts to be loaded
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Globex Industries')).toBeInTheDocument();
    });

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // Check if only matching account is displayed
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.queryByText('Globex Industries')).not.toBeInTheDocument();
    });
  });

  test('shows account details when an account is selected', async () => {
    render(
      <BrowserRouter>
        <AccountSelectionPage />
      </BrowserRouter>
    );

    // Wait for accounts to be loaded
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    // Click on an account
    fireEvent.click(screen.getByText('Acme Corporation'));

    // Check if account details are displayed
    await waitFor(() => {
      expect(screen.getByText('Account Details')).toBeInTheDocument();
      expect(screen.getByText('Industry:')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Website:')).toBeInTheDocument();
      expect(screen.getByText('https://acme.example.com')).toBeInTheDocument();
      expect(screen.getByText('Take Notes for This Account')).toBeInTheDocument();
    });
  });
});
