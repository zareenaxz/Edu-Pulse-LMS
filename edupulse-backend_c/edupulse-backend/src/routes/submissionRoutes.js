const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  submitWork,
  getSubmissionsForAssignment,
  getMySubmission,
  gradeSubmission,
} = require('../controllers/submissionController');

router.post('/assignments/:assignmentId/submissions', protect, authorize('student'), upload.single('file'), submitWork);
router.get('/assignments/:assignmentId/submissions/me', protect, authorize('student'), getMySubmission);
router.get('/assignments/:assignmentId/submissions', protect, authorize('instructor', 'admin'), getSubmissionsForAssignment);
router.patch('/submissions/:id/grade', protect, authorize('instructor', 'admin'), gradeSubmission);

module.exports = router;
