const express = require('express');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const {
  getBookmarks,
  addBookmark,
  removeBookmark
} = require('../controllers/bookmarkController');

// ============================================================
// STUDENT BOOKMARK ROUTES
// ============================================================

// Get all bookmarks of logged-in student
// GET /api/bookmarks
router.get(
  '/',
  protect,
  authorize('student'),
  getBookmarks
);

// Bookmark a lesson
// POST /api/bookmarks
router.post(
  '/',
  protect,
  authorize('student'),
  addBookmark
);

// Remove bookmark
// DELETE /api/bookmarks/:id
router.delete(
  '/:id',
  protect,
  authorize('student'),
  removeBookmark
);

module.exports = router;