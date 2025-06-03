const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: [true, 'Please add an activity ID'],
    unique: true,
    trim: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please add an account ID']
  },
  prospectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prospect'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user ID']
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'task', 'other'],
    required: [true, 'Please add an activity type']
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planned', 'completed', 'cancelled'],
    default: 'planned'
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: Date,
  outcome: String,
  followUpActions: [String]
}, {
  timestamps: true
});

// Indexes for faster queries
ActivitySchema.index({ accountId: 1 });
ActivitySchema.index({ prospectId: 1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ status: 1 });
ActivitySchema.index({ startDate: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
