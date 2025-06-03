const mongoose = require('mongoose');

const AIInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID']
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: [true, 'Please add a note ID']
  },
  type: {
    type: String,
    enum: ['cleanup', 'summarization', 'action-extraction', 'email-draft', 'meeting-schedule', 'chat'],
    required: [true, 'Please add an interaction type']
  },
  input: {
    type: String,
    required: [true, 'Please add input content']
  },
  output: {
    type: String
  },
  model: {
    type: String,
    default: 'Gemini Pro 2.5'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    providedAt: Date
  },
  metadata: {
    processingTime: Number,
    tokenCount: Number,
    confidence: Number
  }
});

// Indexes for faster queries
AIInteractionSchema.index({ userId: 1 });
AIInteractionSchema.index({ noteId: 1 });
AIInteractionSchema.index({ type: 1 });
AIInteractionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AIInteraction', AIInteractionSchema);
