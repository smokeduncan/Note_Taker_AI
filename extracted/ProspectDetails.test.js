import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import ProspectDetails from '../components/ProspectDetails';

// Mock axios
jest.mock('axios');

// Mock account data
const mockAccount = {
  _id: '1',
  name: 'Acme Corporation',
  industry: 'Technology',
  website: 'https://acme.example.com',
  phone: '(555) 123-4567',
  address: '123 Main St, San Francisco, CA 94105'
};

// Mock prospects data
const mockProspects = [
  {
    _id: 'prospect1',
    firstName: 'John',
    lastName: 'Doe',
    title: 'CTO',
    email: 'john.doe@acme.example.com',
    phone: '(555) 987-6543',
    accountId: '1',
    status: 'active',
    lastContactDate: '2023-04-10T14:30:00.000Z',
    notes: 'Key decision maker for technical purchases'
  },
  {
    _id: 'prospect2',
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'VP of Marketing',
    email: 'jane.smith@acme.example.com',
    phone: '(555) 456-7890',
    accountId: '1',
    status: 'lead',
    lastContactDate: '2023-04-05T09:00:00.000Z',
    notes: 'Interested in our marketing automation solutions'
  }
];

describe('ProspectDetails Component', () => {
  beforeEach(() => {
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url === `/api/accounts/${mockAccount._id}/prospects`) {
        return Promise.resolve({ data: { data: mockProspects } });
      }
      return Promise.reject(new Error('Not implemented'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders prospect details for the account', async () => {
    render(
      <BrowserRouter>
        <ProspectDetails account={mockAccount} />
      </BrowserRouter>
    );

    // Check if the title is rendered
    expect(screen.getByText(`Prospects for ${mockAccount.name}`)).toBeInTheDocument();

    // Wait for prospects to be loaded
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/accounts/${mockAccount._id}/prospects`);
    });

    // Check if prospect list is rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('CTO')).toBeInTheDocument();
      expect(screen.getByText('VP of Marketing')).toBeInTheDocument();
    });

    // Check if first prospect details are shown by default
    await waitFor(() => {
      expect(screen.getByText('john.doe@acme.example.com')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
      expect(screen.getByText('Key decision maker for technical purchases')).toBeInTheDocument();
    });
  });

  test('switches prospect details when a different prospect is selected', async () => {
    render(
      <BrowserRouter>
        <ProspectDetails account={mockAccount} />
      </BrowserRouter>
    );

    // Wait for prospects to be loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click on the second prospect
    fireEvent.click(screen.getByText('Jane Smith'));

    // Check if second prospect details are shown
    await waitFor(() => {
      expect(screen.getByText('jane.smith@acme.example.com')).toBeInTheDocument();
      expect(screen.getByText('(555) 456-7890')).toBeInTheDocument();
      expect(screen.getByText('Interested in our marketing automation solutions')).toBeInTheDocument();
    });
  });

  test('shows message when no prospects are found', async () => {
    // Mock empty prospects response
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <BrowserRouter>
        <ProspectDetails account={mockAccount} />
      </BrowserRouter>
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/accounts/${mockAccount._id}/prospects`);
    });

    // Check if no prospects message is displayed
    expect(screen.getByText(`No prospects found for ${mockAccount.name}`)).toBeInTheDocument();
  });

  test('shows message when no account is selected', () => {
    render(
      <BrowserRouter>
        <ProspectDetails account={null} />
      </BrowserRouter>
    );

    expect(screen.getByText('Please select an account to view prospects')).toBeInTheDocument();
  });
});
