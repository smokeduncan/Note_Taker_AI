const Note = require('../models/Note');
const AIInteraction = require('../models/AIInteraction');

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    // In a real implementation, we would filter by user permissions
    // For now, we'll just return all notes
    const notes = await Note.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName')
      .populate('accountId', 'name accountId');
    
    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get note by ID
// @route   GET /api/notes/:id
// @access  Private
exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('userId', 'firstName lastName')
      .populate('accountId', 'name accountId');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: note
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res, next) => {
  try {
    // In a real implementation, we would get the userId from the authenticated user
    // For now, we'll use the userId from the request body
    const { accountId, userId, title, originalContent, isVoiceNote } = req.body;
    
    // Create note
    const note = await Note.create({
      accountId,
      userId,
      title: title || `Note - ${new Date().toLocaleString()}`,
      originalContent,
      isVoiceNote: isVoiceNote || false,
      aiProcessed: false
    });
    
    res.status(201).json({
      success: true,
      data: note
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // In a real implementation, we would check if the user has permission to update the note
    
    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: note
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // In a real implementation, we would check if the user has permission to delete the note
    
    await note.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process note with AI
// @route   POST /api/notes/:id/process
// @access  Private
exports.processNoteWithAI = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    // In a real implementation, we would call the Gemini Pro 2.5 API
    // For now, we'll simulate AI processing
    
    // Simulate formatted content
    const formattedContent = note.originalContent
      .replace(/\n\n+/g, '\n\n')  // Replace multiple newlines with double newlines
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n'); // Add newline after sentences
    
    // Simulate summary
    const summary = `This is a simulated summary of the note: ${note.originalContent.substring(0, 100)}...`;
    
    // Simulate action items
    const actionItems = [
      {
        description: 'Follow up with client next week',
        assignedTo: 'Sales Rep',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        priority: 'high'
      },
      {
        description: 'Send product documentation',
        assignedTo: 'Support Team',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'pending',
        priority: 'medium'
      }
    ];
    
    // Update note with AI processing results
    note.formattedContent = formattedContent;
    note.summary = summary;
    note.actionItems = actionItems;
    note.aiProcessed = true;
    note.aiProcessingDetails = {
      processedAt: new Date(),
      model: 'Gemini Pro 2.5 (Simulated)',
      confidence: 0.92
    };
    
    await note.save();
    
    // Create AI interaction record
    await AIInteraction.create({
      userId: note.userId,
      noteId: note._id,
      type: 'cleanup',
      input: note.originalContent,
      output: formattedContent,
      model: 'Gemini Pro 2.5 (Simulated)',
      metadata: {
        processingTime: 1.2,
        tokenCount: note.originalContent.split(' ').length,
        confidence: 0.92
      }
    });
    
    res.status(200).json({
      success: true,
      data: note
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get action items for a note
// @route   GET /api/notes/:id/action-items
// @access  Private
exports.getActionItems = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    res.status(200).json({
      success: true,
      count: note.actionItems.length,
      data: note.actionItems
    });
  } catch (err) {
    next(err);
  }
};
