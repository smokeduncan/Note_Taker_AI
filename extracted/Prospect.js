const mongoose = require('mongoose');

const ProspectSchema = new mongoose.Schema({
  prospectId: {
    type: String,
    required: [true, 'Please add a prospect ID'],
    unique: true,
    trim: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please add an account ID']
  },
  name: {
    type: String,
    required: [true, 'Please add a prospect name'],
    trim: true,
    maxlength: [100, 'Prospect name cannot be more than 100 characters']
  },
  status: {
    type: String,
    enum: ['lead', 'qualified lead', 'opportunity', 'proposal', 'negotiation', 'closed won', 'closed lost'],
    default: 'lead'
  },
  value: {
    type: Number,
    default: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  source: {
    type: String,
    trim: true
  },
  owner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  },
  contactInfo: {
    email: String,
    phone: String,
    title: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ProspectSchema.index({ accountId: 1 });
ProspectSchema.index({ 'owner.userId': 1 });
ProspectSchema.index({ status: 1 });
ProspectSchema.index({ name: 'text' });

module.exports = mongoose.model('Prospect', ProspectSchema);
