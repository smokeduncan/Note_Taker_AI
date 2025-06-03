const Account = require('../models/Account');
const Note = require('../models/Note');
const Prospect = require('../models/Prospect');
const Activity = require('../models/Activity');

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
exports.getAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: account
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search accounts
// @route   GET /api/accounts/search/:query
// @access  Private
exports.searchAccounts = async (req, res, next) => {
  try {
    const searchQuery = req.params.query;
    const accounts = await Account.find({ 
      $text: { $search: searchQuery } 
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Filter accounts by industry
// @route   GET /api/accounts/filter/:industry
// @access  Private
exports.filterAccountsByIndustry = async (req, res, next) => {
  try {
    const industry = req.params.industry;
    const accounts = await Account.find({ industry }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get recently accessed accounts
// @route   GET /api/accounts/recent
// @access  Private
exports.getRecentAccounts = async (req, res, next) => {
  try {
    // In a real implementation, this would filter by user's recently accessed accounts
    // For now, we'll just return the most recently updated accounts
    const accounts = await Account.find()
      .sort({ updatedAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get account notes
// @route   GET /api/accounts/:id/notes
// @access  Private
exports.getAccountNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ accountId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get account prospects
// @route   GET /api/accounts/:id/prospects
// @access  Private
exports.getAccountProspects = async (req, res, next) => {
  try {
    const prospects = await Prospect.find({ accountId: req.params.id })
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: prospects.length,
      data: prospects
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get account activities
// @route   GET /api/accounts/:id/activities
// @access  Private
exports.getAccountActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ accountId: req.params.id })
      .sort({ startDate: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};
