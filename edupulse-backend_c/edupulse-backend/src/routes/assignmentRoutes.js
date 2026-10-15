const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

// ============================================================
// GET ALL ASSIGNMENTS
// ============================================================

router.get(
  '/',
  protect,
  getAssignments
);

// ============================================================
// CREATE ASSIGNMENT
// Instructor can optionally upload:
// PDF / DOC / DOCX
//
// Frontend FormData field name:
// "attachment"
// ============================================================

router.post(
  '/',
  protect,
  authorize('instructor'),
  upload.single('attachment'),
  createAssignment
);

// ============================================================
// GET SINGLE ASSIGNMENT
// ============================================================

router.get(
  '/:id',
  protect,
  getAssignmentById
);

// ============================================================
// UPDATE ASSIGNMENT
// ============================================================

router.patch(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  updateAssignment
);

// ============================================================
// DELETE ASSIGNMENT
// ============================================================

router.delete(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  deleteAssignment
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;