const express = require('express');
const router = express.Router();

// Import AI controller
const {
  cleanupNote,
  summarizeNote,
  extractActions,
  draftEmail,
  scheduleMeeting,
  chatWithAI
} = require('../controllers/aiController');

// Define routes
router.post('/cleanup', cleanupNote);
router.post('/summarize', summarizeNote);
router.post('/extract-actions', extractActions);
router.post('/draft-email', draftEmail);
router.post('/schedule-meeting', scheduleMeeting);
router.post('/chat', chatWithAI);

module.exports = router;
