import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import ActionItemExecution from '../components/ActionItemExecution';

// Mock axios
jest.mock('axios');

// Mock note data with action items
const mockNote = {
  _id: 'note123',
  title: 'Meeting with Acme Corp',
  originalContent: 'Met with John from Acme Corp to discuss the new project.',
  accountId: '1',
  isVoiceNote: false,
  createdAt: '2023-04-14T10:00:00.000Z',
  actionItems: [
    {
      description: 'Prepare proposal for Acme Corp',
      assignedTo: 'Sales Rep',
      dueDate: '2023-04-21T00:00:00.000Z',
      status: 'pending',
      priority: 'high'
    },
    {
      description: 'Follow up with marketing team',
      assignedTo: 'Account Manager',
      dueDate: '2023-04-18T00:00:00.000Z',
      status: 'pending',
      priority: 'medium'
    }
  ]
};

describe('ActionItemExecution Component', () => {
  const mockOnActionExecuted = jest.fn();

  beforeEach(() => {
    // Mock put response for updating note
    axios.put.mockResolvedValue({
      data: {
        success: true,
        data: {
          ...mockNote,
          actionItems: [
            {
              ...mockNote.actionItems[0],
              status: 'completed'
            },
            mockNote.actionItems[1]
          ]
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders action items from the note', () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={mockNote} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    expect(screen.getByText(`Action Items for: ${mockNote.title}`)).toBeInTheDocument();
    expect(screen.getByText('Prepare proposal for Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Follow up with marketing team')).toBeInTheDocument();
    expect(screen.getAllByText('Sales Rep')[0]).toBeInTheDocument();
    expect(screen.getByText('Account Manager')).toBeInTheDocument();
  });

  test('marks action item as complete when complete button is clicked', async () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={mockNote} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    // Find the complete button for the first action item
    const completeButtons = screen.getAllByTitle('Mark as Complete');
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(`/api/notes/${mockNote._id}`, {
        actionItems: expect.arrayContaining([
          expect.objectContaining({
            description: 'Prepare proposal for Acme Corp',
            status: 'completed'
          })
        ])
      });
      expect(mockOnActionExecuted).toHaveBeenCalledWith('complete', expect.objectContaining({
        description: 'Prepare proposal for Acme Corp'
      }));
    });
  });

  test('cancels action item when cancel button is clicked', async () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={mockNote} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    // Find the cancel button for the first action item
    const cancelButtons = screen.getAllByTitle('Cancel');
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(`/api/notes/${mockNote._id}`, {
        actionItems: expect.arrayContaining([
          expect.objectContaining({
            description: 'Prepare proposal for Acme Corp',
            status: 'cancelled'
          })
        ])
      });
      expect(mockOnActionExecuted).toHaveBeenCalledWith('cancel', expect.objectContaining({
        description: 'Prepare proposal for Acme Corp'
      }));
    });
  });

  test('opens email dialog when send email button is clicked', async () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={mockNote} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    // Find the email button for the first action item
    const emailButtons = screen.getAllByTitle('Send Email');
    fireEvent.click(emailButtons[0]);

    // Check if email dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Send Email')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
    });
  });

  test('opens meeting dialog when schedule meeting button is clicked', async () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={mockNote} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    // Find the meeting button for the first action item
    const meetingButtons = screen.getAllByTitle('Schedule Meeting');
    fireEvent.click(meetingButtons[0]);

    // Check if meeting dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Attendees (comma separated)')).toBeInTheDocument();
    });
  });

  test('shows message when no action items are available', () => {
    const noteWithoutActionItems = {
      ...mockNote,
      actionItems: []
    };

    render(
      <BrowserRouter>
        <ActionItemExecution note={noteWithoutActionItems} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    expect(screen.getByText('No action items available')).toBeInTheDocument();
    expect(screen.getByText('Process your note with AI to extract action items first.')).toBeInTheDocument();
  });

  test('shows message when no note is selected', () => {
    render(
      <BrowserRouter>
        <ActionItemExecution note={null} onActionExecuted={mockOnActionExecuted} />
      </BrowserRouter>
    );

    expect(screen.getByText('No action items available')).toBeInTheDocument();
  });
});
