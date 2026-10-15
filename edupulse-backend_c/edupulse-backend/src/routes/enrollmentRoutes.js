const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  enroll,
  getMyEnrollments,
  getCourseRoster,
  updateEnrollmentStatus,
  removeEnrollment,
} = require('../controllers/enrollmentController');

router.post('/', protect, authorize('student'), enroll);
router.get('/me', protect, authorize('student'), getMyEnrollments);
router.get('/course/:courseId', protect, authorize('instructor', 'admin'), getCourseRoster);
router.patch('/:id/status', protect, authorize('student', 'instructor', 'admin'), updateEnrollmentStatus);
router.delete('/:id', protect, authorize('instructor', 'admin'), removeEnrollment);

module.exports = router;
