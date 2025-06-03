import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import NoteProcessing from '../components/NoteProcessing';

// Mock axios
jest.mock('axios');

// Mock note data
const mockNote = {
  _id: 'note123',
  title: 'Meeting with Acme Corp',
  originalContent: 'Met with John from Acme Corp to discuss the new project. They need a proposal by next week. Follow up with marketing team about materials. Schedule a demo for next month.',
  accountId: '1',
  isVoiceNote: false,
  createdAt: '2023-04-14T10:00:00.000Z',
  formattedContent: '',
  summary: '',
  actionItems: []
};

describe('NoteProcessing Component', () => {
  const mockOnProcessingComplete = jest.fn();

  beforeEach(() => {
    // Mock cleanup response
    axios.post.mockImplementation((url) => {
      if (url === '/api/ai/cleanup') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              formattedContent: 'Met with John from Acme Corp to discuss the new project.\n\nThey need a proposal by next week.\n\nFollow up with marketing team about materials.\n\nSchedule a demo for next month.'
            }
          }
        });
      } else if (url === '/api/ai/summarize') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              summary: 'Met with Acme Corp about new project. Need to prepare proposal, follow up with marketing, and schedule demo.'
            }
          }
        });
      } else if (url === '/api/ai/extract-actions') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
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
                },
                {
                  description: 'Schedule demo',
                  assignedTo: 'Sales Rep',
                  dueDate: '2023-05-14T00:00:00.000Z',
                  status: 'pending',
                  priority: 'medium'
                }
              ]
            }
          }
        });
      } else if (url === '/api/ai/draft-email') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              subject: 'Follow-up from our recent conversation',
              body: 'Dear Valued Client,\n\nThank you for meeting with me today...'
            }
          }
        });
      } else if (url === '/api/ai/schedule-meeting') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              subject: 'Follow-up Discussion',
              description: 'Follow-up meeting to discuss the points raised in our previous conversation',
              suggestedTimes: [
                {
                  start: '2023-04-15T10:00:00.000Z',
                  end: '2023-04-15T11:00:00.000Z'
                }
              ],
              location: 'Virtual Meeting (Zoom)'
            }
          }
        });
      }
      return Promise.reject(new Error('Not implemented'));
    });

    // Mock put response for updating note
    axios.put.mockResolvedValue({
      data: {
        success: true,
        data: {
          ...mockNote,
          formattedContent: 'Formatted content',
          summary: 'Summary',
          actionItems: []
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders note processing component with tabs', () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    expect(screen.getByText(`AI Processing for: ${mockNote.title}`)).toBeInTheDocument();
    expect(screen.getByText('Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Action Items')).toBeInTheDocument();
    expect(screen.getByText('Draft Email')).toBeInTheDocument();
    expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
  });

  test('processes note cleanup when Clean Up Note button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    const cleanupButton = screen.getByText('Clean Up Note');
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/cleanup', {
        noteId: mockNote._id,
        content: mockNote.originalContent,
        userId: mockNote.userId
      });
      expect(axios.put).toHaveBeenCalled();
      expect(mockOnProcessingComplete).toHaveBeenCalledWith('cleanup', expect.any(String));
    });
  });

  test('processes note summarization when Summarize Note button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    // Navigate to Summarize tab
    const summarizeTab = screen.getByText('Summarize');
    fireEvent.click(summarizeTab);

    const summarizeButton = screen.getByText('Summarize Note');
    fireEvent.click(summarizeButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/summarize', {
        noteId: mockNote._id,
        content: mockNote.originalContent,
        userId: mockNote.userId
      });
      expect(axios.put).toHaveBeenCalled();
      expect(mockOnProcessingComplete).toHaveBeenCalledWith('summarize', expect.any(String));
    });
  });

  test('extracts action items when Extract Action Items button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    // Navigate to Action Items tab
    const actionItemsTab = screen.getByText('Action Items');
    fireEvent.click(actionItemsTab);

    const extractButton = screen.getByText('Extract Action Items');
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/extract-actions', {
        noteId: mockNote._id,
        content: mockNote.originalContent,
        userId: mockNote.userId
      });
      expect(mockOnProcessingComplete).toHaveBeenCalledWith('extract-actions', expect.any(Array));
    });
  });

  test('drafts email when Draft Email button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    // Navigate to Draft Email tab
    const emailTab = screen.getByText('Draft Email');
    fireEvent.click(emailTab);

    const draftButton = screen.getByText('Draft Email');
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/draft-email', {
        noteId: mockNote._id,
        content: mockNote.originalContent,
        userId: mockNote.userId
      });
      expect(mockOnProcessingComplete).toHaveBeenCalledWith('draft-email', expect.objectContaining({
        subject: expect.any(String),
        body: expect.any(String)
      }));
    });
  });

  test('schedules meeting when Schedule Meeting button is clicked', async () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={mockNote} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    // Navigate to Schedule Meeting tab
    const meetingTab = screen.getByText('Schedule Meeting');
    fireEvent.click(meetingTab);

    const scheduleButton = screen.getByText('Schedule Meeting');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/schedule-meeting', {
        noteId: mockNote._id,
        content: mockNote.originalContent,
        userId: mockNote.userId
      });
      expect(mockOnProcessingComplete).toHaveBeenCalledWith('schedule-meeting', expect.objectContaining({
        subject: expect.any(String),
        suggestedTimes: expect.any(Array)
      }));
    });
  });

  test('shows message when no note is selected', () => {
    render(
      <BrowserRouter>
        <NoteProcessing note={null} onProcessingComplete={mockOnProcessingComplete} />
      </BrowserRouter>
    );

    expect(screen.getByText('Please select a note to process')).toBeInTheDocument();
  });
});
