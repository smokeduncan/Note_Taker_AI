const express = require('express');
const router = express.Router();

// Import note controller
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  processNoteWithAI,
  getActionItems
} = require('../controllers/noteController');

// Define routes
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/process', processNoteWithAI);
router.get('/:id/action-items', getActionItems);

module.exports = router;
