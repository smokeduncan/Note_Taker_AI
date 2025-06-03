import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import NoteTaking from '../components/NoteTaking';

// Mock axios
jest.mock('axios');

// Mock SpeechRecognition API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

window.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
window.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

// Mock account data
const mockAccount = {
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
};

describe('NoteTaking Component', () => {
  const mockOnNoteSaved = jest.fn();

  beforeEach(() => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: 'note123',
          title: 'Test Note',
          originalContent: 'This is a test note content',
          accountId: '1',
          isVoiceNote: false,
          createdAt: '2023-04-14T10:00:00.000Z'
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders note taking form with title and content fields', () => {
    render(
      <BrowserRouter>
        <NoteTaking account={mockAccount} onNoteSaved={mockOnNoteSaved} />
      </BrowserRouter>
    );

    expect(screen.getByText('Take Notes for Acme Corporation')).toBeInTheDocument();
    expect(screen.getByLabelText('Note Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Note Content')).toBeInTheDocument();
    expect(screen.getByText('Start Voice Recording')).toBeInTheDocument();
    expect(screen.getByText('Save Note')).toBeInTheDocument();
  });

  test('allows entering note title and content', () => {
    render(
      <BrowserRouter>
        <NoteTaking account={mockAccount} onNoteSaved={mockOnNoteSaved} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText('Note Title');
    const contentInput = screen.getByLabelText('Note Content');

    fireEvent.change(titleInput, { target: { value: 'Test Note Title' } });
    fireEvent.change(contentInput, { target: { value: 'This is the content of my test note.' } });

    expect(titleInput.value).toBe('Test Note Title');
    expect(contentInput.value).toBe('This is the content of my test note.');
  });

  test('saves note when Save Note button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteTaking account={mockAccount} onNoteSaved={mockOnNoteSaved} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText('Note Title');
    const contentInput = screen.getByLabelText('Note Content');
    const saveButton = screen.getByText('Save Note');

    fireEvent.change(titleInput, { target: { value: 'Test Note Title' } });
    fireEvent.change(contentInput, { target: { value: 'This is the content of my test note.' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/notes', {
        title: 'Test Note Title',
        originalContent: 'This is the content of my test note.',
        accountId: '1',
        isVoiceNote: false
      });
      expect(mockOnNoteSaved).toHaveBeenCalled();
    });
  });

  test('toggles voice recording when voice button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteTaking account={mockAccount} onNoteSaved={mockOnNoteSaved} />
      </BrowserRouter>
    );

    const voiceButton = screen.getByText('Start Voice Recording');
    
    // Start recording
    fireEvent.click(voiceButton);
    
    await waitFor(() => {
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });
    
    // Stop recording
    fireEvent.click(screen.getByText('Stop Recording'));
    
    await waitFor(() => {
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(screen.getByText('Start Voice Recording')).toBeInTheDocument();
    });
  });

  test('shows error message when saving fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('Failed to save note'));
    
    render(
      <BrowserRouter>
        <NoteTaking account={mockAccount} onNoteSaved={mockOnNoteSaved} />
      </BrowserRouter>
    );

    const titleInput = screen.getByLabelText('Note Title');
    const contentInput = screen.getByLabelText('Note Content');
    const saveButton = screen.getByText('Save Note');

    fireEvent.change(titleInput, { target: { value: 'Test Note Title' } });
    fireEvent.change(contentInput, { target: { value: 'This is the content of my test note.' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save note. Please try again.')).toBeInTheDocument();
      expect(mockOnNoteSaved).not.toHaveBeenCalled();
    });
  });
});
