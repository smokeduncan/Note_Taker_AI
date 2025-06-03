const Note = require('../models/Note');
const AIInteraction = require('../models/AIInteraction');

// Helper function to simulate AI processing delay
const simulateAIProcessing = async (timeMs = 1500) => {
  return new Promise(resolve => setTimeout(resolve, timeMs));
};

// @desc    Clean up and format note
// @route   POST /api/ai/cleanup
// @access  Private
exports.cleanupNote = async (req, res, next) => {
  try {
    const { noteId, content, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide note content'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing();
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Simulate formatted content
    const formattedContent = content
      .replace(/\n\n+/g, '\n\n')  // Replace multiple newlines with double newlines
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n')  // Add newline after sentences
      .replace(/\b(i)\b/g, 'I')  // Capitalize standalone 'i'
      .replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());  // Capitalize first letter of sentences
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'cleanup',
        input: content,
        output: formattedContent,
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 1.2,
          tokenCount: content.split(' ').length,
          confidence: 0.92
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        formattedContent
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Summarize note
// @route   POST /api/ai/summarize
// @access  Private
exports.summarizeNote = async (req, res, next) => {
  try {
    const { noteId, content, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide note content'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing();
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Generate a simulated summary based on the content length
    let summary;
    if (content.length < 100) {
      summary = content;
    } else {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const firstSentence = sentences[0] || '';
      const lastSentence = sentences[sentences.length - 1] || '';
      
      if (sentences.length <= 2) {
        summary = content;
      } else {
        summary = `${firstSentence}. This note discusses key points about the account. ${lastSentence}.`;
      }
    }
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'summarization',
        input: content,
        output: summary,
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 1.5,
          tokenCount: content.split(' ').length,
          confidence: 0.88
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        summary
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Extract action items from note
// @route   POST /api/ai/extract-actions
// @access  Private
exports.extractActions = async (req, res, next) => {
  try {
    const { noteId, content, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide note content'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing(2000);
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Generate simulated action items based on content keywords
    const actionItems = [];
    
    // Check for common action keywords
    if (content.match(/follow.?up|contact|reach.?out/i)) {
      actionItems.push({
        description: 'Follow up with client next week',
        assignedTo: 'Sales Rep',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        priority: 'high'
      });
    }
    
    if (content.match(/send|email|document|information/i)) {
      actionItems.push({
        description: 'Send product documentation',
        assignedTo: 'Support Team',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'pending',
        priority: 'medium'
      });
    }
    
    if (content.match(/meet|meeting|schedule|discuss/i)) {
      actionItems.push({
        description: 'Schedule follow-up meeting',
        assignedTo: 'Account Manager',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'pending',
        priority: 'medium'
      });
    }
    
    if (content.match(/proposal|quote|price/i)) {
      actionItems.push({
        description: 'Prepare pricing proposal',
        assignedTo: 'Sales Rep',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
        priority: 'high'
      });
    }
    
    // If no action items were detected, add a generic one
    if (actionItems.length === 0) {
      actionItems.push({
        description: 'Review account status',
        assignedTo: 'Account Manager',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        priority: 'low'
      });
    }
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'action-extraction',
        input: content,
        output: JSON.stringify(actionItems),
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 1.8,
          tokenCount: content.split(' ').length,
          confidence: 0.85
        }
      });
      
      // Update the note with action items
      await Note.findByIdAndUpdate(noteId, {
        actionItems,
        $set: {
          'aiProcessingDetails.processedAt': new Date()
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        actionItems
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Draft email based on note
// @route   POST /api/ai/draft-email
// @access  Private
exports.draftEmail = async (req, res, next) => {
  try {
    const { noteId, content, userId, recipient, subject } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide note content'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing(2500);
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Generate a simulated email draft
    const recipientName = recipient?.name || 'Valued Client';
    const emailSubject = subject || 'Follow-up from our recent conversation';
    
    const emailDraft = `Dear ${recipientName},

I hope this email finds you well. I wanted to follow up on our recent conversation about ${content.substring(0, 30)}...

Based on our discussion, I've noted the following key points:
- We discussed your current needs and challenges
- We identified potential solutions that could address your requirements
- We agreed to follow up with additional information

I'll be sending over the requested information shortly. In the meantime, please let me know if you have any questions or if there's anything else you need.

Looking forward to our continued collaboration.

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`;
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'email-draft',
        input: content,
        output: emailDraft,
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 2.1,
          tokenCount: content.split(' ').length,
          confidence: 0.89
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        subject: emailSubject,
        body: emailDraft
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule meeting based on note
// @route   POST /api/ai/schedule-meeting
// @access  Private
exports.scheduleMeeting = async (req, res, next) => {
  try {
    const { noteId, content, userId, attendees } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide note content'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing(2000);
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Generate simulated meeting details
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(14, 0, 0, 0);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(11, 0, 0, 0);
    
    const meetingDetails = {
      subject: 'Follow-up Discussion',
      description: `Follow-up meeting to discuss the points raised in our previous conversation about ${content.substring(0, 30)}...`,
      suggestedTimes: [
        {
          start: tomorrow.toISOString(),
          end: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString() // 1 hour meeting
        },
        {
          start: dayAfterTomorrow.toISOString(),
          end: new Date(dayAfterTomorrow.getTime() + 60 * 60 * 1000).toISOString() // 1 hour meeting
        },
        {
          start: nextWeek.toISOString(),
          end: new Date(nextWeek.getTime() + 60 * 60 * 1000).toISOString() // 1 hour meeting
        }
      ],
      attendees: attendees || [],
      location: 'Virtual Meeting (Zoom)',
      agenda: [
        'Review previous discussion points',
        'Address any outstanding questions',
        'Discuss next steps',
        'Set action items and timeline'
      ]
    };
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'meeting-schedule',
        input: content,
        output: JSON.stringify(meetingDetails),
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 1.9,
          tokenCount: content.split(' ').length,
          confidence: 0.87
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: meetingDetails
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAI = async (req, res, next) => {
  try {
    const { noteId, message, userId, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a message'
      });
    }
    
    // Simulate AI processing delay
    await simulateAIProcessing(1000);
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI responses based on keywords
    
    let response = '';
    
    if (message.match(/hello|hi|hey/i)) {
      response = "Hello! I'm your AI assistant. How can I help you with this account today?";
    } else if (message.match(/meeting|schedule|calendar/i)) {
      response = "I can help you schedule a meeting. Would you like me to suggest some available times based on your calendar?";
    } else if (message.match(/email|send|message/i)) {
      response = "I can help you draft an email based on your notes. Would you like me to create a draft for you?";
    } else if (message.match(/action|task|todo/i)) {
      response = "I can extract action items from your notes. Would you like me to identify the key tasks that need to be completed?";
    } else if (message.match(/summary|summarize/i)) {
      response = "I can summarize your notes to highlight the key points. Would you like me to create a summary?";
    } else if (message.match(/thank|thanks/i)) {
      response = "You're welcome! Is there anything else I can help you with?";
    } else {
      response = "I understand you're asking about " + message.substring(0, 20) + "... How would you like me to help with this?";
    }
    
    // Create AI interaction record if noteId is provided
    if (noteId && userId) {
      await AIInteraction.create({
        userId,
        noteId,
        type: 'chat',
        input: message,
        output: response,
        model: 'Gemini Pro 2.5 (Simulated)',
        metadata: {
          processingTime: 0.8,
          tokenCount: message.split(' ').length,
          confidence: 0.91
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: response
      }
    });
  } catch (err) {
    next(err);
  }
};
