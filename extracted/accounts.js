const express = require('express');
const router = express.Router();

// Import account controller
const {
  getAccounts,
  getAccount,
  searchAccounts,
  filterAccountsByIndustry,
  getRecentAccounts,
  getAccountNotes,
  getAccountProspects,
  getAccountActivities
} = require('../controllers/accountController');

// Define routes
router.get('/', getAccounts);
router.get('/recent', getRecentAccounts);
router.get('/search/:query', searchAccounts);
router.get('/filter/:industry', filterAccountsByIndustry);
router.get('/:id', getAccount);
router.get('/:id/notes', getAccountNotes);
router.get('/:id/prospects', getAccountProspects);
router.get('/:id/activities', getAccountActivities);

module.exports = router;
