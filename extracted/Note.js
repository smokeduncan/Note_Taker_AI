const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please add an account ID']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  originalContent: {
    type: String,
    required: [true, 'Please add note content']
  },
  formattedContent: {
    type: String
  },
  summary: {
    type: String
  },
  tags: [String],
  isVoiceNote: {
    type: Boolean,
    default: false
  },
  actionItems: [
    {
      description: {
        type: String,
        required: true
      },
      assignedTo: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      completedAt: Date
    }
  ],
  aiProcessed: {
    type: Boolean,
    default: false
  },
  aiProcessingDetails: {
    processedAt: Date,
    model: String,
    confidence: Number
  }
}, {
  timestamps: true
});

// Indexes for faster queries
NoteSchema.index({ accountId: 1 });
NoteSchema.index({ userId: 1 });
NoteSchema.index({ createdAt: -1 });
NoteSchema.index({ tags: 1 });
NoteSchema.index({ originalContent: 'text' });

module.exports = mongoose.model('Note', NoteSchema);
