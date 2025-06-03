import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import ProspectActivities from '../components/ProspectActivities';

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
    status: 'active'
  },
  {
    _id: 'prospect2',
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'VP of Marketing',
    email: 'jane.smith@acme.example.com',
    phone: '(555) 456-7890',
    accountId: '1',
    status: 'lead'
  }
];

// Mock activities data
const mockActivities = [
  {
    _id: 'activity1',
    prospectId: 'prospect1',
    type: 'email',
    description: 'Sent follow-up email about proposal',
    timestamp: '2023-04-10T14:30:00.000Z',
    metadata: {
      subject: 'Proposal Follow-up',
      status: 'sent'
    }
  },
  {
    _id: 'activity2',
    prospectId: 'prospect1',
    type: 'call',
    description: 'Discussed project timeline',
    timestamp: '2023-04-08T10:15:00.000Z',
    metadata: {
      duration: 25,
      outcome: 'positive'
    }
  },
  {
    _id: 'activity3',
    prospectId: 'prospect2',
    type: 'meeting',
    description: 'Initial consultation meeting',
    timestamp: '2023-04-05T09:00:00.000Z',
    metadata: {
      duration: 60,
      location: 'Virtual'
    }
  }
];

describe('ProspectActivities Component', () => {
  beforeEach(() => {
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url === `/api/accounts/${mockAccount._id}/prospects`) {
        return Promise.resolve({ data: { data: mockProspects } });
      } else if (url === `/api/accounts/${mockAccount._id}/activities`) {
        return Promise.resolve({ data: { data: mockActivities } });
      }
      return Promise.reject(new Error('Not implemented'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders prospect activities for the account', async () => {
    render(
      <BrowserRouter>
        <ProspectActivities account={mockAccount} />
      </BrowserRouter>
    );

    // Check if the title is rendered
    expect(screen.getByText(`Prospect Activities for ${mockAccount.name}`)).toBeInTheDocument();

    // Check if search input is rendered
    expect(screen.getByPlaceholderText('Search activities...')).toBeInTheDocument();

    // Check if filter buttons are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Emails')).toBeInTheDocument();
    expect(screen.getByText('Calls')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();

    // Wait for activities to be loaded
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/accounts/${mockAccount._id}/prospects`);
      expect(axios.get).toHaveBeenCalledWith(`/api/accounts/${mockAccount._id}/activities`);
    });

    // Check if activities are rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
      expect(screen.getByText('Discussed project timeline')).toBeInTheDocument();
      expect(screen.getByText('Initial consultation meeting')).toBeInTheDocument();
    });
  });

  test('filters activities when search term is entered', async () => {
    render(
      <BrowserRouter>
        <ProspectActivities account={mockAccount} />
      </BrowserRouter>
    );

    // Wait for activities to be loaded
    await waitFor(() => {
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
      expect(screen.getByText('Discussed project timeline')).toBeInTheDocument();
      expect(screen.getByText('Initial consultation meeting')).toBeInTheDocument();
    });

    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search activities...');
    fireEvent.change(searchInput, { target: { value: 'proposal' } });

    // Check if only matching activities are displayed
    await waitFor(() => {
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
      expect(screen.queryByText('Discussed project timeline')).not.toBeInTheDocument();
      expect(screen.queryByText('Initial consultation meeting')).not.toBeInTheDocument();
    });
  });

  test('filters activities by type when filter button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProspectActivities account={mockAccount} />
      </BrowserRouter>
    );

    // Wait for activities to be loaded
    await waitFor(() => {
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
      expect(screen.getByText('Discussed project timeline')).toBeInTheDocument();
      expect(screen.getByText('Initial consultation meeting')).toBeInTheDocument();
    });

    // Click on Emails filter
    const emailsFilterButton = screen.getByText('Emails');
    fireEvent.click(emailsFilterButton);

    // Check if only email activities are displayed
    await waitFor(() => {
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
      expect(screen.queryByText('Discussed project timeline')).not.toBeInTheDocument();
      expect(screen.queryByText('Initial consultation meeting')).not.toBeInTheDocument();
    });

    // Click on Calls filter
    const callsFilterButton = screen.getByText('Calls');
    fireEvent.click(callsFilterButton);

    // Check if only call activities are displayed
    await waitFor(() => {
      expect(screen.queryByText('Sent follow-up email about proposal')).not.toBeInTheDocument();
      expect(screen.getByText('Discussed project timeline')).toBeInTheDocument();
      expect(screen.queryByText('Initial consultation meeting')).not.toBeInTheDocument();
    });
  });

  test('shows message when no activities match filters', async () => {
    render(
      <BrowserRouter>
        <ProspectActivities account={mockAccount} />
      </BrowserRouter>
    );

    // Wait for activities to be loaded
    await waitFor(() => {
      expect(screen.getByText('Sent follow-up email about proposal')).toBeInTheDocument();
    });

    // Enter search term that won't match any activities
    const searchInput = screen.getByPlaceholderText('Search activities...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // Check if no activities message is displayed
    await waitFor(() => {
      expect(screen.getByText('No activities found for the selected filters.')).toBeInTheDocument();
    });
  });

  test('shows message when no account is selected', () => {
    render(
      <BrowserRouter>
        <ProspectActivities account={null} />
      </BrowserRouter>
    );

    expect(screen.getByText('Please select an account to view prospect activities')).toBeInTheDocument();
  });
});
