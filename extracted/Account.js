const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: [true, 'Please add an account ID'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add an account name'],
    trim: true,
    maxlength: [100, 'Account name cannot be more than 100 characters']
  },
  industry: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  status: {
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
  contacts: [
    {
      contactId: String,
      name: String,
      title: String,
      email: String,
      phone: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }
  ],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  revenue: Number,
  employeeCount: Number,
  website: String,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
AccountSchema.index({ name: 'text' });
AccountSchema.index({ accountId: 1 });
AccountSchema.index({ 'owner.userId': 1 });

module.exports = mongoose.model('Account', AccountSchema);
